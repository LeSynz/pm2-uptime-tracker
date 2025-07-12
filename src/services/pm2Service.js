const pm2 = require('pm2');
const logger = require('../utils/logger');
const EventEmitter = require('events');

class PM2Service extends EventEmitter {
	constructor(processName) {
		super();
		this.processName = processName;
		this.isMonitoring = false;
		this.lastStatus = null;
		this.lastRestartTime = null;
	}

	async startMonitoring() {
		if (this.isMonitoring) return;

		try {
			await new Promise((resolve, reject) => {
				pm2.connect((err) => {
					if (err) {
						logger.error(`Error connecting to PM2: ${err.message}`);
						reject(err);
						return;
					}
					resolve();
				});
			});

			// Set up event listeners for real-time monitoring
			pm2.launchBus((err, bus) => {
				if (err) {
					logger.error(`Error launching PM2 bus: ${err.message}`);
					return;
				}

				logger.info('PM2 event bus connected for real-time monitoring');
				this.isMonitoring = true;

				// Listen for process events
				bus.on('process:event', (data) => {
					if (data.process.name === this.processName) {
						logger.info(
							`PM2 Event: ${data.event} for ${this.processName}`
						);

						switch (data.event) {
							case 'restart':
								this.emit('restart', data);
								break;
							case 'stop':
								this.emit('stop', data);
								break;
							case 'start':
								this.emit('start', data);
								break;
							case 'error':
								this.emit('error', data);
								break;
							case 'online':
								this.emit('online', data);
								break;
							case 'exit':
								this.emit('exit', data);
								break;
						}
					}
				});

				// Listen for log events (optional)
				bus.on('log:err', (data) => {
					if (data.process.name === this.processName) {
						this.emit('log:error', data);
					}
				});
			});
		} catch (error) {
			logger.error(`Failed to start PM2 monitoring: ${error.message}`);
			throw error;
		}
	}

	async stopMonitoring() {
		if (!this.isMonitoring) return;

		pm2.disconnect();
		this.isMonitoring = false;
		logger.info('PM2 monitoring stopped');
	}

	async getProcessUptime() {
		return new Promise((resolve, reject) => {
			pm2.connect((err) => {
				if (err) {
					logger.error(`Error connecting to PM2: ${err.message}`);
					reject(err);
					return;
				}

				pm2.describe(this.processName, (err, processDescription) => {
					if (err) {
						logger.error(
							`Error describing process: ${err.message}`
						);
						pm2.disconnect();
						reject(err);
						return;
					}

					if (processDescription.length === 0) {
						const error = new Error(
							`Process ${this.processName} not found.`
						);
						logger.error(error.message);
						pm2.disconnect();
						reject(error);
						return;
					}

					const processInfo = processDescription[0];
					const startTime =
						processInfo.pm2_env.pm_uptime ||
						processInfo.pm2_env.created_at;
					const uptime = startTime ? Date.now() - startTime : 0;
					const lastRestart = startTime ? new Date(startTime) : null;

					pm2.disconnect();
					resolve({
						uptime,
						status: processInfo.pm2_env.status,
						lastRestart,
						processInfo: processInfo,
					});
				});
			});
		});
	}
}

module.exports = PM2Service;
