const fs = require('fs');
const path = require('path');
const { config, validateConfig } = require('./config');
const PM2Service = require('./services/pm2Service');
const DiscordService = require('./services/discordService');
const { createStatusEmbed } = require('./services/uptimeService');
const logger = require('./utils/logger');

class UptimeTracker {
	constructor() {
		this.pm2Service = new PM2Service(config.processName);
		this.discordService = new DiscordService(
			config.webhookUrl,
			config.messageId
		);
		this.intervalId = null;
		this.quickCheckIntervalId = null;
		this.lastStatus = null;
		this.lastRestartTime = null;
		this.restartCount = 0;
	}

	setupEventListeners() {
		// Real-time event listeners
		this.pm2Service.on('restart', (data) => {
			this.restartCount++;
			logger.warn(
				`🔄 RESTART DETECTED: ${config.processName} restarted (#${this.restartCount})`
			);
			this.sendImmediateNotification('restarting', {
				restartDetected: true,
			});
		});

		this.pm2Service.on('stop', (data) => {
			logger.error(`🛑 STOP DETECTED: ${config.processName} stopped`);
			this.sendImmediateNotification('stopped', { statusChanged: true });
		});

		this.pm2Service.on('start', (data) => {
			logger.success(`🚀 START DETECTED: ${config.processName} started`);
			this.sendImmediateNotification('online', { statusChanged: true });
		});

		this.pm2Service.on('error', (data) => {
			logger.error(
				`❌ ERROR DETECTED: ${config.processName} encountered an error`
			);
			this.sendImmediateNotification('error', {
				statusChanged: true,
				error: data.data || 'Unknown error',
			});
		});

		this.pm2Service.on('online', (data) => {
			logger.success(
				`✅ ONLINE DETECTED: ${config.processName} is now online`
			);
			this.sendImmediateNotification('online', { statusChanged: true });
		});

		this.pm2Service.on('exit', (data) => {
			logger.warn(`🚪 EXIT DETECTED: ${config.processName} exited`);
			this.sendImmediateNotification('offline', { statusChanged: true });
		});
	}

	async sendImmediateNotification(status, metadata = {}) {
		try {
			const { uptime, lastRestart } =
				await this.pm2Service.getProcessUptime();

			const embed = createStatusEmbed(
				config.processName,
				status,
				uptime,
				lastRestart,
				{
					...metadata,
					restartCount: this.restartCount,
					immediate: true,
				}
			);

			await this.discordService.sendUptimeUpdate(embed);
			logger.success(
				`🚨 IMMEDIATE notification sent for ${config.processName} (${status})`
			);
		} catch (error) {
			logger.error(
				`Failed to send immediate notification: ${error.message}`
			);
		}
	}

	async updateUptime() {
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

			// Log status changes
			if (statusChanged) {
				logger.info(
					`Status changed from ${this.lastStatus} to ${status}`
				);

				// Send immediate notification for critical status changes
				if (status === 'errored' || status === 'stopped') {
					logger.warn(
						`CRITICAL: Process ${config.processName} is now ${status}`
					);
				} else if (
					status === 'online' &&
					(this.lastStatus === 'errored' ||
						this.lastStatus === 'stopped')
				) {
					logger.success(
						`RECOVERY: Process ${config.processName} is back online`
					);
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
				config.processName,
				status,
				uptime,
				lastRestart,
				{
					restartCount: this.restartCount,
					statusChanged,
					restartDetected,
				}
			);

			await this.discordService.sendUptimeUpdate(embed);

			// Log based on status
			if (statusChanged || restartDetected) {
				logger.success(
					`Status notification sent for ${config.processName} (${status})`
				);
			} else {
				logger.info(
					`Regular update sent for ${config.processName} (${status})`
				);
			}
		} catch (error) {
			logger.error(`Failed to update uptime: ${error.message}`);

			// Send error notification if we can't connect to the process
			if (error.message.includes('not found')) {
				try {
					const errorEmbed = createStatusEmbed(
						config.processName,
						'not-found',
						0,
						null,
						{ error: error.message }
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

	async start() {
		logger.info('Starting uptime tracking...');

		// Initial update
		await this.updateUptime();

		// Set up quick polling for status changes (every 5 seconds)
		this.quickCheckIntervalId = setInterval(async () => {
			await this.quickStatusCheck();
		}, 5000);

		// Set up regular updates (every 60 seconds)
		this.intervalId = setInterval(async () => {
			await this.updateUptime();
		}, config.updateInterval);

		logger.info(
			`Uptime tracking started. Quick checks every 5 seconds, full updates every ${
				config.updateInterval / 1000
			} seconds.`
		);
		logger.info('Check your Discord channel for updates.');
	}

	async quickStatusCheck() {
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
						`🔄 RESTART DETECTED: ${config.processName} restarted (#${this.restartCount})`
					);
				}

				// Send immediate notification
				const embed = createStatusEmbed(
					config.processName,
					status,
					uptime,
					lastRestart,
					{
						statusChanged,
						restartDetected,
						restartCount: this.restartCount,
						immediate: true,
					}
				);

				await this.discordService.sendUptimeUpdate(embed);
				logger.success(
					`🚨 IMMEDIATE notification sent for ${config.processName} (${status})`
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
	logger.info('Configuration validated successfully.');

	// Check if embeds.json exists
	if (!fs.existsSync(path.join(__dirname, '..', 'embeds.json'))) {
		logger.error(
			'embeds.json file not found. Please ensure the file exists in the project root.'
		);
		process.exit(1);
	} else {
		logger.info('Using embeds from embeds.json');
	}

	// Create and start the uptime tracker
	logger.info('Creating uptime tracker...');
	const tracker = new UptimeTracker();
	logger.info('Starting uptime tracker...');
	tracker.start();

	// Graceful shutdown
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

// Only run if this file is executed directly
if (require.main === module) {
	console.log('App.js is being executed directly');
	init();
} else {
	console.log('App.js is being required as a module');
}

module.exports = UptimeTracker;
