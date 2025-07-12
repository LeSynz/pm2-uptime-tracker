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
	}

	async updateUptime() {
		try {
			const { uptime, status, lastRestart } =
				await this.pm2Service.getProcessUptime();
			const embed = createStatusEmbed(
				config.processName,
				status,
				uptime,
				lastRestart
			);
			await this.discordService.sendUptimeUpdate(embed);
			logger.success(
				`Status updated for ${config.processName} (${status})`
			);
		} catch (error) {
			logger.error(`Failed to update uptime: ${error.message}`);
		}
	}

	start() {
		logger.info('Starting uptime tracking...');

		// Initial update
		this.updateUptime();

		// Set up interval for regular updates
		this.intervalId = setInterval(() => {
			this.updateUptime();
		}, config.updateInterval);

		logger.info(
			`Uptime tracking started. Updates every ${
				config.updateInterval / 1000
			} seconds.`
		);
		logger.info('Check your Discord channel for updates.');
	}

	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
			logger.info('Uptime tracking stopped.');
		}
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
