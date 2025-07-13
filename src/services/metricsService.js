const express = require('express');
const cors = require('cors');
const logger = require('../utils/logger');

class MetricsServer {
	constructor(port = 3000, uptimeTracker = null) {
		this.port = port;
		this.app = express();
		this.server = null;
		this.uptimeTracker = uptimeTracker;
		this.startTime = new Date();
		this.requestCount = 0;
		this.lastUpdate = null;
		this.cachedMetrics = null;
		this.cacheTimeout = 5000; // Cache for 5 seconds

		this.setupRoutes();
	}

	setupRoutes() {
		// Enable CORS for all routes
		this.app.use(cors());

		// Add request counter middleware
		this.app.use((req, res, next) => {
			this.requestCount++;
			next();
		});

		// Root endpoint - basic info
		this.app.get('/', (req, res) => {
			res.json({
				service: 'PM2 Uptime Tracker Metrics',
				version: '1.0.0',
				uptime: Math.floor(
					(Date.now() - this.startTime.getTime()) / 1000
				),
				endpoints: {
					'/': 'This information',
					'/health': 'Health check endpoint',
					'/metrics': 'Prometheus-style metrics',
					'/metrics/json': 'JSON formatted metrics',
					'/metrics/process': 'Individual process metrics',
					'/metrics/summary': 'Summary statistics',
				},
				requests: this.requestCount,
			});
		});

		// Health check endpoint
		this.app.get('/health', (req, res) => {
			const healthStatus = {
				status: 'healthy',
				timestamp: new Date().toISOString(),
				uptime: Math.floor(
					(Date.now() - this.startTime.getTime()) / 1000
				),
				requests: this.requestCount,
				memory: process.memoryUsage(),
				process: {
					pid: process.pid,
					version: process.version,
					platform: process.platform,
				},
			};

			res.json(healthStatus);
		});

		// Prometheus-style metrics endpoint
		this.app.get('/metrics', async (req, res) => {
			try {
				const metrics = await this.getMetrics();
				const prometheusFormat = this.formatPrometheus(metrics);

				res.set(
					'Content-Type',
					'text/plain; version=0.0.4; charset=utf-8'
				);
				res.send(prometheusFormat);
			} catch (error) {
				logger.error(
					`Error generating Prometheus metrics: ${error.message}`
				);
				res.status(500).json({ error: 'Failed to generate metrics' });
			}
		});

		// JSON metrics endpoint
		this.app.get('/metrics/json', async (req, res) => {
			try {
				const metrics = await this.getMetrics();
				res.json(metrics);
			} catch (error) {
				logger.error(`Error generating JSON metrics: ${error.message}`);
				res.status(500).json({ error: 'Failed to generate metrics' });
			}
		});

		// Individual process metrics
		this.app.get('/metrics/process/:processName', async (req, res) => {
			try {
				const processName = req.params.processName;
				const processMetrics = await this.getProcessMetrics(
					processName
				);
				res.json(processMetrics);
			} catch (error) {
				logger.error(
					`Error generating process metrics: ${error.message}`
				);
				res.status(500).json({
					error: 'Failed to generate process metrics',
				});
			}
		});

		// Default process metrics (uses configured process name)
		this.app.get('/metrics/process', async (req, res) => {
			try {
				const processName = this.uptimeTracker
					? this.uptimeTracker.config.monitoring.processName
					: 'example-process';
				const processMetrics = await this.getProcessMetrics(
					processName
				);
				res.json(processMetrics);
			} catch (error) {
				logger.error(
					`Error generating process metrics: ${error.message}`
				);
				res.status(500).json({
					error: 'Failed to generate process metrics',
				});
			}
		});

		// Summary statistics
		this.app.get('/metrics/summary', async (req, res) => {
			try {
				const summary = await this.getSummaryMetrics();
				res.json(summary);
			} catch (error) {
				logger.error(
					`Error generating summary metrics: ${error.message}`
				);
				res.status(500).json({
					error: 'Failed to generate summary metrics',
				});
			}
		});

		// 404 handler
		this.app.use((req, res) => {
			res.status(404).json({ error: 'Endpoint not found' });
		});
	}

	async getMetrics() {
		const now = Date.now();

		// Use cached metrics if available and not expired
		if (
			this.cachedMetrics &&
			this.lastUpdate &&
			now - this.lastUpdate < this.cacheTimeout
		) {
			return this.cachedMetrics;
		}

		try {
			const PM2Service = require('./pm2Service');
			const pm2Service = new PM2Service();

			// Get all PM2 processes
			const processes = await pm2Service.getAllProcesses();

			const metrics = {
				timestamp: new Date().toISOString(),
				server: {
					uptime: Math.floor((now - this.startTime.getTime()) / 1000),
					requests: this.requestCount,
					memory: process.memoryUsage(),
					pid: process.pid,
				},
				pm2: {
					totalProcesses: processes.length,
					runningProcesses: processes.filter(
						(p) => p.pm2_env.status === 'online'
					).length,
					stoppedProcesses: processes.filter(
						(p) => p.pm2_env.status === 'stopped'
					).length,
					erroredProcesses: processes.filter(
						(p) => p.pm2_env.status === 'errored'
					).length,
					restartingProcesses: processes.filter(
						(p) => p.pm2_env.status === 'restarting'
					).length,
				},
				processes: processes.map((proc) => ({
					name: proc.name,
					pm_id: proc.pm_id,
					status: proc.pm2_env.status,
					uptime: proc.pm2_env.pm_uptime
						? Math.floor((now - proc.pm2_env.pm_uptime) / 1000)
						: 0,
					restarts: proc.pm2_env.restart_time || 0,
					memory: proc.monit ? proc.monit.memory : 0,
					cpu: proc.monit ? proc.monit.cpu : 0,
					pid: proc.pid,
					created_at: proc.pm2_env.created_at,
					exec_mode: proc.pm2_env.exec_mode,
					watching: proc.pm2_env.watch,
					instances: proc.pm2_env.instances,
				})),
			};

			// Add tracked process specific metrics if uptime tracker is available
			if (this.uptimeTracker) {
				const trackedProcess = processes.find(
					(p) =>
						p.name ===
						this.uptimeTracker.config.monitoring.processName
				);
				if (trackedProcess) {
					metrics.tracked_process = {
						name: trackedProcess.name,
						status: trackedProcess.pm2_env.status,
						uptime: trackedProcess.pm2_env.pm_uptime
							? Math.floor(
									(now - trackedProcess.pm2_env.pm_uptime) /
										1000
							  )
							: 0,
						restarts: trackedProcess.pm2_env.restart_time || 0,
						memory: trackedProcess.monit
							? trackedProcess.monit.memory
							: 0,
						cpu: trackedProcess.monit
							? trackedProcess.monit.cpu
							: 0,
						restart_count: this.uptimeTracker.restartCount || 0,
						last_status: this.uptimeTracker.lastStatus,
						is_monitoring: this.uptimeTracker.isRunning,
					};
				}
			}

			// Cache the metrics
			this.cachedMetrics = metrics;
			this.lastUpdate = now;

			return metrics;
		} catch (error) {
			logger.error(`Error collecting metrics: ${error.message}`);
			throw error;
		}
	}

	async getProcessMetrics(processName) {
		const PM2Service = require('./pm2Service');
		const pm2Service = new PM2Service(processName);

		try {
			const { uptime, status, lastRestart, processInfo } =
				await pm2Service.getProcessUptime();

			return {
				name: processName,
				status: status,
				uptime: uptime,
				last_restart: lastRestart,
				process_info: processInfo,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			return {
				name: processName,
				status: 'not-found',
				error: error.message,
				timestamp: new Date().toISOString(),
			};
		}
	}

	async getSummaryMetrics() {
		const metrics = await this.getMetrics();

		return {
			timestamp: metrics.timestamp,
			summary: {
				total_processes: metrics.pm2.totalProcesses,
				healthy_processes: metrics.pm2.runningProcesses,
				unhealthy_processes:
					metrics.pm2.stoppedProcesses + metrics.pm2.erroredProcesses,
				health_percentage:
					metrics.pm2.totalProcesses > 0
						? Math.round(
								(metrics.pm2.runningProcesses /
									metrics.pm2.totalProcesses) *
									100
						  )
						: 0,
				total_memory: metrics.processes.reduce(
					(sum, p) => sum + (p.memory || 0),
					0
				),
				total_restarts: metrics.processes.reduce(
					(sum, p) => sum + (p.restarts || 0),
					0
				),
				server_uptime: metrics.server.uptime,
				requests_served: metrics.server.requests,
			},
			tracked_process: metrics.tracked_process || null,
		};
	}

	formatPrometheus(metrics) {
		const lines = [];
		const timestamp = Date.now();

		// Server metrics
		lines.push(
			'# HELP pm2_uptime_tracker_server_uptime_seconds Server uptime in seconds'
		);
		lines.push('# TYPE pm2_uptime_tracker_server_uptime_seconds counter');
		lines.push(
			`pm2_uptime_tracker_server_uptime_seconds ${metrics.server.uptime} ${timestamp}`
		);

		lines.push(
			'# HELP pm2_uptime_tracker_server_requests_total Total number of requests served'
		);
		lines.push('# TYPE pm2_uptime_tracker_server_requests_total counter');
		lines.push(
			`pm2_uptime_tracker_server_requests_total ${metrics.server.requests} ${timestamp}`
		);

		// PM2 summary metrics
		lines.push('# HELP pm2_processes_total Total number of PM2 processes');
		lines.push('# TYPE pm2_processes_total gauge');
		lines.push(
			`pm2_processes_total ${metrics.pm2.totalProcesses} ${timestamp}`
		);

		lines.push(
			'# HELP pm2_processes_running Number of running PM2 processes'
		);
		lines.push('# TYPE pm2_processes_running gauge');
		lines.push(
			`pm2_processes_running ${metrics.pm2.runningProcesses} ${timestamp}`
		);

		lines.push(
			'# HELP pm2_processes_stopped Number of stopped PM2 processes'
		);
		lines.push('# TYPE pm2_processes_stopped gauge');
		lines.push(
			`pm2_processes_stopped ${metrics.pm2.stoppedProcesses} ${timestamp}`
		);

		lines.push(
			'# HELP pm2_processes_errored Number of errored PM2 processes'
		);
		lines.push('# TYPE pm2_processes_errored gauge');
		lines.push(
			`pm2_processes_errored ${metrics.pm2.erroredProcesses} ${timestamp}`
		);

		// Individual process metrics
		lines.push(
			'# HELP pm2_process_uptime_seconds Process uptime in seconds'
		);
		lines.push('# TYPE pm2_process_uptime_seconds gauge');

		lines.push(
			'# HELP pm2_process_memory_bytes Process memory usage in bytes'
		);
		lines.push('# TYPE pm2_process_memory_bytes gauge');

		lines.push(
			'# HELP pm2_process_cpu_percent Process CPU usage percentage'
		);
		lines.push('# TYPE pm2_process_cpu_percent gauge');

		lines.push(
			'# HELP pm2_process_restarts_total Total number of process restarts'
		);
		lines.push('# TYPE pm2_process_restarts_total counter');

		metrics.processes.forEach((proc) => {
			const labels = `{name="${proc.name}",pm_id="${proc.pm_id}",status="${proc.status}"}`;
			lines.push(
				`pm2_process_uptime_seconds${labels} ${proc.uptime} ${timestamp}`
			);
			lines.push(
				`pm2_process_memory_bytes${labels} ${proc.memory} ${timestamp}`
			);
			lines.push(
				`pm2_process_cpu_percent${labels} ${proc.cpu} ${timestamp}`
			);
			lines.push(
				`pm2_process_restarts_total${labels} ${proc.restarts} ${timestamp}`
			);
		});

		return lines.join('\n') + '\n';
	}

	async start() {
		return new Promise((resolve, reject) => {
			this.server = this.app.listen(this.port, (err) => {
				if (err) {
					logger.error(
						`Failed to start metrics server: ${err.message}`
					);
					reject(err);
					return;
				}

				logger.success(
					`🎯 Metrics server started on port ${this.port}`
				);
				logger.info(`📊 Metrics endpoints available:`);
				logger.info(`   - http://localhost:${this.port}/ (Info)`);
				logger.info(
					`   - http://localhost:${this.port}/health (Health)`
				);
				logger.info(
					`   - http://localhost:${this.port}/metrics (Prometheus)`
				);
				logger.info(
					`   - http://localhost:${this.port}/metrics/json (JSON)`
				);
				logger.info(
					`   - http://localhost:${this.port}/metrics/summary (Summary)`
				);
				resolve();
			});
		});
	}

	async stop() {
		return new Promise((resolve) => {
			if (this.server) {
				this.server.close(() => {
					logger.info('📊 Metrics server stopped');
					resolve();
				});
			} else {
				resolve();
			}
		});
	}
}

module.exports = MetricsServer;
