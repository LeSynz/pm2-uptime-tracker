const UptimeTracker = require('./src/app');

const fs = require('fs');
const path = require('path');
const { config, validateConfig } = require('./src/config');
const logger = require('./src/utils/logger');

function init() {
	logger.info('Initializing PM2 Uptime Tracker...');

	// Validate configuration
	logger.info('Validating configuration...');
	validateConfig();
	logger.info('Configuration validated successfully.');

	// Check if embeds.json exists
	if (!fs.existsSync(path.join(__dirname, 'embeds.json'))) {
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

init();
