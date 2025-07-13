const fs = require('fs');
const path = require('path');
const { config, fullConfig, validateConfig } = require('./config');
const PM2Service = require('./services/pm2Service');
const DiscordService = require('./services/discordService');
const MetricsServer = require('./services/metricsService');
const { createStatusEmbed } = require('./services/uptimeService');
const logger = require('./utils/logger');

class UptimeTracker {
	constructor() {
		this.config = fullConfig;
		this.pm2Service = new PM2Service(this.config.monitoring.processName);
		this.discordService = new DiscordService(
			this.config.discord.webhookUrl,
			this.config.discord.messageId,
			this.config.discord.username,
			this.config.discord.avatarUrl
		);
		this.intervalId = null;
		this.quickCheckIntervalId = null;
		this.lastStatus = null;
		this.lastRestartTime = null;
		this.restartCount = 0;
		this.isRunning = false;

		// Initialize metrics server if enabled
		if (this.config.features.enableMetrics) {
			this.metricsServer = new MetricsServer(
				this.config.features.metricsPort,
				this
			);
		}
	}

	setupEventListeners() {
		if (!this.config.monitoring.enableEventListeners) {
			logger.info('Event listeners disabled in configuration');
			return;
		}

		// Real-time event listeners
		this.pm2Service.on('restart', (data) => {
			if (!this.config.notifications.statusChanges.notifyOnRestart)
				return;

			this.restartCount++;
			logger.warn(
				`🔄 RESTART DETECTED: ${this.config.monitoring.processName} restarted (#${this.restartCount})`
			);
			this.sendImmediateNotification('restarting', {
				restartDetected: true,
			});
		});

		this.pm2Service.on('stop', (data) => {
			if (!this.config.notifications.statusChanges.notifyOnStop) return;

			logger.error(
				`🛑 STOP DETECTED: ${this.config.monitoring.processName} stopped`
			);
			this.sendImmediateNotification('stopped', { statusChanged: true });
		});

		this.pm2Service.on('start', (data) => {
			if (!this.config.notifications.statusChanges.notifyOnStart) return;

			logger.success(
				`🚀 START DETECTED: ${this.config.monitoring.processName} started`
			);
			this.sendImmediateNotification('online', { statusChanged: true });
		});

		this.pm2Service.on('error', (data) => {
			if (!this.config.notifications.statusChanges.notifyOnError) return;

			logger.error(
				`❌ ERROR DETECTED: ${this.config.monitoring.processName} encountered an error`
			);
			this.sendImmediateNotification('error', {
				statusChanged: true,
				error: data.data || 'Unknown error',
			});
		});

		this.pm2Service.on('online', (data) => {
			if (!this.config.notifications.statusChanges.notifyOnOnline) return;

			logger.success(
				`✅ ONLINE DETECTED: ${this.config.monitoring.processName} is now online`
			);
			this.sendImmediateNotification('online', { statusChanged: true });
		});

		this.pm2Service.on('exit', (data) => {
			if (!this.config.notifications.statusChanges.notifyOnExit) return;

			logger.warn(
				`🚪 EXIT DETECTED: ${this.config.monitoring.processName} exited`
			);
			this.sendImmediateNotification('offline', { statusChanged: true });
		});

		logger.info('Event listeners set up successfully');
	}

	async sendImmediateNotification(status, metadata = {}) {
		if (!this.config.monitoring.enableImmediateNotifications) return;

		try {
			const { uptime, lastRestart } =
				await this.pm2Service.getProcessUptime();

			const embed = createStatusEmbed(
				this.config.monitoring.processName,
				status,
				uptime,
				lastRestart,
				{
					...metadata,
					restartCount: this.restartCount,
					immediate: true,
				},
				this.config
			);

			await this.discordService.sendUptimeUpdate(embed);
			logger.success(
				`🚨 IMMEDIATE notification sent for ${this.config.monitoring.processName} (${status})`
			);
		} catch (error) {
			logger.error(
				`Failed to send immediate notification: ${error.message}`
			);
		}
	}

	async updateUptime() {
		if (!this.config.notifications.regularUpdates.enabled) return;

		try {
			const { uptime, status, lastRestart, processInfo } =
				await this.pm2Service.getProcessUptime();

			// Check for status changes
			const statusChanged =
				this.lastStatus !== null && this.lastStatus !== status;
			const restartDetected =
				this.lastRestartTime !== null &&
				lastRestart &&
				lastRestart.getTime() !== this.lastRestartTime.getTime();

			// Skip update if only sending on changes and no changes detected
			if (
				this.config.notifications.regularUpdates.onlyOnChanges &&
				!statusChanged &&
				!restartDetected
			) {
				return;
			}

			// Skip non-critical updates if critical only mode is enabled
			if (
				this.config.notifications.criticalOnly &&
				!this.isCriticalStatus(status) &&
				!statusChanged
			) {
				return;
			}

			// Log status changes
			if (statusChanged) {
				logger.info(
					`Status changed from ${this.lastStatus} to ${status}`
				);

				// Send immediate notification for critical status changes
				if (status === 'errored' || status === 'stopped') {
					if (
						this.config.notifications.statusChanges.notifyOnError ||
						this.config.notifications.statusChanges.notifyOnOffline
					) {
						logger.warn(
							`CRITICAL: Process ${this.config.monitoring.processName} is now ${status}`
						);
					}
				} else if (
					status === 'online' &&
					(this.lastStatus === 'errored' ||
						this.lastStatus === 'stopped')
				) {
					if (
						this.config.notifications.statusChanges.notifyOnOnline
					) {
						logger.success(
							`RECOVERY: Process ${this.config.monitoring.processName} is back online`
						);
					}
				}
			}

			// Track restarts
			if (restartDetected) {
				this.restartCount++;
				logger.info(
					`Restart detected (#${
						this.restartCount
					}). Last restart: ${lastRestart.toLocaleString()}`
				);
			}

			// Update stored values
			this.lastStatus = status;
			this.lastRestartTime = lastRestart;

			// Create and send embed
			const embed = createStatusEmbed(
				this.config.monitoring.processName,
				status,
				uptime,
				lastRestart,
				{
					restartCount: this.restartCount,
					statusChanged,
					restartDetected,
					processInfo: this.config.embeds.showProcessInfo
						? processInfo
						: null,
				},
				this.config
			);

			await this.discordService.sendUptimeUpdate(embed);

			// Log based on status
			if (statusChanged || restartDetected) {
				logger.success(
					`Status notification sent for ${this.config.monitoring.processName} (${status})`
				);
			} else {
				logger.info(
					`Regular update sent for ${this.config.monitoring.processName} (${status})`
				);
			}
		} catch (error) {
			logger.error(`Failed to update uptime: ${error.message}`);

			// Send error notification if we can't connect to the process
			if (error.message.includes('not found')) {
				try {
					const errorEmbed = createStatusEmbed(
						this.config.monitoring.processName,
						'not-found',
						0,
						null,
						{ error: error.message },
						this.config
					);
					await this.discordService.sendUptimeUpdate(errorEmbed);
				} catch (discordError) {
					logger.error(
						`Failed to send error notification: ${discordError.message}`
					);
				}
			}
		}
	}

	isCriticalStatus(status) {
		return ['errored', 'stopped', 'not-found'].includes(status);
	}

	async start() {
		if (this.isRunning) {
			logger.warn('Uptime tracker is already running');
			return;
		}

		logger.info('Starting uptime tracking...');
		this.isRunning = true;

		// Start metrics server if enabled
		if (this.config.features.enableMetrics && this.metricsServer) {
			try {
				await this.metricsServer.start();
			} catch (error) {
				logger.error(
					`Failed to start metrics server: ${error.message}`
				);
				logger.warn('Continuing without metrics server...');
			}
		}

		// Set up event listeners
		this.setupEventListeners();

		// Initial update
		await this.updateUptime();

		// Set up quick polling for status changes
		if (this.config.monitoring.enableQuickChecks) {
			this.quickCheckIntervalId = setInterval(async () => {
				await this.quickStatusCheck();
			}, this.config.monitoring.quickCheckInterval);

			logger.info(
				`Quick status checks enabled: every ${
					this.config.monitoring.quickCheckInterval / 1000
				} seconds`
			);
		}

		// Set up regular updates
		if (this.config.notifications.regularUpdates.enabled) {
			this.intervalId = setInterval(async () => {
				await this.updateUptime();
			}, this.config.monitoring.updateInterval);

			logger.info(
				`Regular updates enabled: every ${
					this.config.monitoring.updateInterval / 1000
				} seconds`
			);
		}

		logger.info('Uptime tracking started successfully');
		logger.info('Check your Discord channel for updates.');
	}

	async quickStatusCheck() {
		if (!this.config.monitoring.enableQuickChecks) return;

		try {
			const { uptime, status, lastRestart } =
				await this.pm2Service.getProcessUptime();

			// Check for status changes
			const statusChanged =
				this.lastStatus !== null && this.lastStatus !== status;
			const restartDetected =
				this.lastRestartTime !== null &&
				lastRestart &&
				lastRestart.getTime() !== this.lastRestartTime.getTime();

			// If changes detected, send immediate notification
			if (statusChanged || restartDetected) {
				if (statusChanged) {
					logger.warn(
						`🔄 STATUS CHANGE DETECTED: ${this.lastStatus} → ${status}`
					);
				}
				if (restartDetected) {
					this.restartCount++;
					logger.warn(
						`🔄 RESTART DETECTED: ${this.config.monitoring.processName} restarted (#${this.restartCount})`
					);
				}

				// Send immediate notification
				const embed = createStatusEmbed(
					this.config.monitoring.processName,
					status,
					uptime,
					lastRestart,
					{
						statusChanged,
						restartDetected,
						restartCount: this.restartCount,
						immediate: true,
					},
					this.config
				);

				await this.discordService.sendUptimeUpdate(embed);
				logger.success(
					`🚨 IMMEDIATE notification sent for ${this.config.monitoring.processName} (${status})`
				);

				// Update stored values
				this.lastStatus = status;
				this.lastRestartTime = lastRestart;
			}
		} catch (error) {
			// Silently fail quick checks to avoid spam
		}
	}

	async stop() {
		if (!this.isRunning) {
			logger.info('Uptime tracker is not running');
			return;
		}

		this.isRunning = false;

		// Stop metrics server if running
		if (this.metricsServer) {
			try {
				await this.metricsServer.stop();
			} catch (error) {
				logger.error(`Error stopping metrics server: ${error.message}`);
			}
		}

		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
			logger.info('Regular polling stopped.');
		}

		if (this.quickCheckIntervalId) {
			clearInterval(this.quickCheckIntervalId);
			this.quickCheckIntervalId = null;
			logger.info('Quick status checks stopped.');
		}

		logger.info('Uptime tracking stopped.');
	}
}

function init() {
	logger.info('Initializing PM2 Uptime Tracker...');

	// Validate configuration
	logger.info('Validating configuration...');
	validateConfig();

	// Check if embeds.json exists (if custom embeds are enabled)
	if (fullConfig.embeds.useCustomEmbeds) {
		const embedsPath = path.join(
			__dirname,
			'..',
			fullConfig.embeds.embedsFile
		);
		if (!fs.existsSync(embedsPath)) {
			logger.error(
				`Embeds file not found: ${fullConfig.embeds.embedsFile}. Please ensure the file exists in the project root.`
			);
			process.exit(1);
		} else {
			logger.info(
				`Using custom embeds from ${fullConfig.embeds.embedsFile}`
			);
		}
	}

	// Create and start the uptime tracker
	logger.info('Creating uptime tracker...');
	const tracker = new UptimeTracker();
	logger.info('Starting uptime tracker...');
	tracker.start();

	// Graceful shutdown
	if (fullConfig.advanced.gracefulShutdown) {
		process.on('SIGINT', () => {
			logger.info('Received SIGINT. Shutting down gracefully...');
			tracker.stop();
			process.exit(0);
		});

		process.on('SIGTERM', () => {
			logger.info('Received SIGTERM. Shutting down gracefully...');
			tracker.stop();
			process.exit(0);
		});
	}
}

// Only run if this file is executed directly
if (require.main === module) {
	console.log('App.js is being executed directly');
	init();
} else {
	console.log('App.js is being required as a module');
}

module.exports = UptimeTracker;
