const fs = require('fs');
const path = require('path');

// Load configuration
let logConfig = {
	enabled: true,
	level: 'info',
	showTimestamp: true,
	showColors: true,
	logToFile: false,
	logFile: 'logs/uptime-tracker.log',
};

// Try to load config from the main config
try {
	const { fullConfig } = require('../config');
	if (fullConfig && fullConfig.logging) {
		logConfig = { ...logConfig, ...fullConfig.logging };
	}
} catch (error) {
	// Ignore config loading errors for logger
}

const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
};

const logLevels = {
	error: 0,
	warn: 1,
	info: 2,
	debug: 3,
};

function shouldLog(level) {
	if (!logConfig.enabled) return false;
	return logLevels[level] <= logLevels[logConfig.level];
}

function formatMessage(message, level) {
	let formattedMessage = '';

	// Add timestamp if enabled
	if (logConfig.showTimestamp) {
		const timestamp = new Date().toISOString();
		formattedMessage += `[${timestamp}] `;
	}

	// Add level
	formattedMessage += `${level.toUpperCase()}: ${message}`;

	return formattedMessage;
}

function writeToFile(message) {
	if (!logConfig.logToFile) return;

	try {
		const logDir = path.dirname(logConfig.logFile);
		if (!fs.existsSync(logDir)) {
			fs.mkdirSync(logDir, { recursive: true });
		}

		const timestamp = new Date().toISOString();
		const logEntry = `[${timestamp}] ${message}\n`;
		fs.appendFileSync(logConfig.logFile, logEntry);
	} catch (error) {
		// Silently fail file logging to avoid recursive logging issues
	}
}

function log(message, level = 'info') {
	if (!shouldLog(level)) return;

	const formattedMessage = formatMessage(message, level);
	const coloredMessage = logConfig.showColors
		? addColors(formattedMessage, level)
		: formattedMessage;

	// Log to file (without colors)
	writeToFile(formattedMessage);

	// Log to console
	switch (level) {
		case 'error':
			console.error(coloredMessage);
			break;
		case 'warn':
			console.warn(coloredMessage);
			break;
		case 'success':
			console.log(coloredMessage);
			break;
		case 'info':
		case 'debug':
		default:
			console.log(coloredMessage);
			break;
	}
}

function addColors(message, level) {
	if (!logConfig.showColors) return message;

	switch (level) {
		case 'error':
			return `${colors.red}${message}${colors.reset}`;
		case 'warn':
			return `${colors.yellow}${message}${colors.reset}`;
		case 'success':
			return `${colors.green}${message}${colors.reset}`;
		case 'info':
			return `${colors.blue}${message}${colors.reset}`;
		case 'debug':
			return `${colors.magenta}${message}${colors.reset}`;
		default:
			return message;
	}
}

// Update configuration at runtime
function updateConfig(newConfig) {
	logConfig = { ...logConfig, ...newConfig };
}

module.exports = {
	log,
	error: (message) => log(message, 'error'),
	warn: (message) => log(message, 'warn'),
	success: (message) => log(message, 'success'),
	info: (message) => log(message, 'info'),
	debug: (message) => log(message, 'debug'),
	updateConfig,
	getConfig: () => logConfig,
};
