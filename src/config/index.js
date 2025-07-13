require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Default configuration
const defaultConfig = {
	discord: {
		webhookUrl: '',
		messageId: '',
		username: 'PM2 Uptime Tracker',
		avatarUrl: '',
	},
	monitoring: {
		processName: 'example-process',
		updateInterval: 60000,
		quickCheckInterval: 5000,
		enableQuickChecks: true,
		enableImmediateNotifications: true,
		enableEventListeners: true,
	},
	notifications: {
		statusChanges: {
			enabled: true,
			notifyOnOnline: true,
			notifyOnOffline: true,
			notifyOnError: true,
			notifyOnRestart: true,
			notifyOnStop: true,
			notifyOnStart: true,
			notifyOnExit: true,
		},
		regularUpdates: {
			enabled: true,
			onlyOnChanges: false,
		},
		criticalOnly: false,
	},
	embeds: {
		useCustomEmbeds: true,
		embedsFile: 'embeds.json',
		showUptime: true,
		showLastRestart: true,
		showRestartCount: true,
		showProcessInfo: false,
		showTimestamp: true,
		includeStatusChangeInfo: true,
		includeImmediateNotificationFlag: true,
		includeErrorDetails: true,
	},
	logging: {
		enabled: true,
		level: 'info',
		showTimestamp: true,
		showColors: true,
		logToFile: false,
		logFile: 'logs/uptime-tracker.log',
	},
	advanced: {
		retryAttempts: 3,
		retryDelay: 5000,
		gracefulShutdown: true,
		processMultiple: false,
		processNames: [],
		enableDataPersistence: true,
		dataFile: 'data.json',
	},
	features: {
		enableWebhookFallback: false,
		webhookFallbackUrl: '',
		enableMetrics: false,
		metricsPort: 3000,
		enableHealthcheck: false,
		healthcheckPort: 3001,
	},
};

// Load configuration from JSON file
function loadConfigFromJson() {
	const configPath = path.join(__dirname, '..', '..', 'config.json');

	try {
		if (fs.existsSync(configPath)) {
			const configData = fs.readFileSync(configPath, 'utf8');
			return JSON.parse(configData);
		}
	} catch (error) {
		console.warn(
			'Warning: Could not load config.json, using defaults and environment variables'
		);
		console.warn('Error:', error.message);
	}

	return {};
}

// Load configuration from environment variables
function loadConfigFromEnv() {
	const envConfig = {
		discord: {
			webhookUrl: process.env.WEBHOOK_URL || '',
			messageId: process.env.MESSAGE_ID || '',
			username: process.env.DISCORD_USERNAME || 'PM2 Uptime Tracker',
			avatarUrl: process.env.DISCORD_AVATAR_URL || '',
		},
		monitoring: {
			processName: process.env.PROCESS_NAME || 'example-process',
			updateInterval: parseInt(process.env.UPDATE_INTERVAL) || 60000,
			quickCheckInterval:
				parseInt(process.env.QUICK_CHECK_INTERVAL) || 5000,
			enableQuickChecks: process.env.ENABLE_QUICK_CHECKS !== 'false',
			enableImmediateNotifications:
				process.env.ENABLE_IMMEDIATE_NOTIFICATIONS !== 'false',
			enableEventListeners:
				process.env.ENABLE_EVENT_LISTENERS !== 'false',
		},
		notifications: {
			statusChanges: {
				enabled: process.env.NOTIFY_ON_STATUS_CHANGES !== 'false',
				notifyOnOnline: process.env.NOTIFY_ON_ONLINE !== 'false',
				notifyOnOffline: process.env.NOTIFY_ON_OFFLINE !== 'false',
				notifyOnError: process.env.NOTIFY_ON_ERROR !== 'false',
				notifyOnRestart: process.env.NOTIFY_ON_RESTART !== 'false',
				notifyOnStop: process.env.NOTIFY_ON_STOP !== 'false',
				notifyOnStart: process.env.NOTIFY_ON_START !== 'false',
				notifyOnExit: process.env.NOTIFY_ON_EXIT !== 'false',
			},
			regularUpdates: {
				enabled: process.env.ENABLE_REGULAR_UPDATES !== 'false',
				onlyOnChanges:
					process.env.REGULAR_UPDATES_ONLY_ON_CHANGES === 'true',
			},
			criticalOnly: process.env.CRITICAL_ONLY === 'true',
		},
		embeds: {
			useCustomEmbeds: process.env.USE_CUSTOM_EMBEDS !== 'false',
			embedsFile: process.env.EMBEDS_FILE || 'embeds.json',
			showUptime: process.env.SHOW_UPTIME !== 'false',
			showLastRestart: process.env.SHOW_LAST_RESTART !== 'false',
			showRestartCount: process.env.SHOW_RESTART_COUNT !== 'false',
			showProcessInfo: process.env.SHOW_PROCESS_INFO === 'true',
			showTimestamp: process.env.SHOW_TIMESTAMP !== 'false',
			includeStatusChangeInfo:
				process.env.INCLUDE_STATUS_CHANGE_INFO !== 'false',
			includeImmediateNotificationFlag:
				process.env.INCLUDE_IMMEDIATE_NOTIFICATION_FLAG !== 'false',
			includeErrorDetails: process.env.INCLUDE_ERROR_DETAILS !== 'false',
		},
		logging: {
			enabled: process.env.ENABLE_LOGGING !== 'false',
			level: process.env.LOG_LEVEL || 'info',
			showTimestamp: process.env.SHOW_TIMESTAMP !== 'false',
			showColors: process.env.SHOW_COLORS !== 'false',
			logToFile: process.env.LOG_TO_FILE === 'true',
			logFile: process.env.LOG_FILE || 'logs/uptime-tracker.log',
		},
		advanced: {
			retryAttempts: parseInt(process.env.RETRY_ATTEMPTS) || 3,
			retryDelay: parseInt(process.env.RETRY_DELAY) || 5000,
			gracefulShutdown: process.env.GRACEFUL_SHUTDOWN !== 'false',
			processMultiple: process.env.PROCESS_MULTIPLE === 'true',
			processNames: process.env.PROCESS_NAMES
				? process.env.PROCESS_NAMES.split(',')
				: [],
			enableDataPersistence:
				process.env.ENABLE_DATA_PERSISTENCE !== 'false',
			dataFile: process.env.DATA_FILE || 'data.json',
		},
		features: {
			enableWebhookFallback:
				process.env.ENABLE_WEBHOOK_FALLBACK === 'true',
			webhookFallbackUrl: process.env.WEBHOOK_FALLBACK_URL || '',
			enableMetrics: process.env.ENABLE_METRICS === 'true',
			metricsPort: parseInt(process.env.METRICS_PORT) || 3000,
			enableHealthcheck: process.env.ENABLE_HEALTHCHECK === 'true',
			healthcheckPort: parseInt(process.env.HEALTHCHECK_PORT) || 3001,
		},
	};

	// Filter out empty values
	return filterEmptyValues(envConfig);
}

// Deep merge objects
function deepMerge(target, source) {
	const result = { ...target };

	for (const key in source) {
		if (
			source[key] !== null &&
			typeof source[key] === 'object' &&
			!Array.isArray(source[key])
		) {
			result[key] = deepMerge(result[key] || {}, source[key]);
		} else if (
			source[key] !== undefined &&
			source[key] !== null &&
			source[key] !== ''
		) {
			result[key] = source[key];
		}
	}

	return result;
}

// Filter out empty values from config
function filterEmptyValues(obj) {
	const filtered = {};

	for (const key in obj) {
		if (
			obj[key] !== null &&
			typeof obj[key] === 'object' &&
			!Array.isArray(obj[key])
		) {
			const filteredNested = filterEmptyValues(obj[key]);
			if (Object.keys(filteredNested).length > 0) {
				filtered[key] = filteredNested;
			}
		} else if (
			obj[key] !== undefined &&
			obj[key] !== null &&
			obj[key] !== ''
		) {
			filtered[key] = obj[key];
		}
	}

	return filtered;
}

// Load and merge configuration
const jsonConfig = loadConfigFromJson();
const envConfig = loadConfigFromEnv();

// Priority: Environment variables > JSON config > Default config
const config = deepMerge(deepMerge(defaultConfig, jsonConfig), envConfig);

// Backward compatibility - create legacy config object
const legacyConfig = {
	webhookUrl: config.discord.webhookUrl,
	messageId: config.discord.messageId,
	processName: config.monitoring.processName,
	updateInterval: config.monitoring.updateInterval,
};

function validateConfig() {
	if (!config.discord.webhookUrl) {
		console.error('❌ WEBHOOK_URL is not set in the configuration.');
		console.error('   Please set it in config.json or .env file.');
		process.exit(1);
	}

	if (!config.discord.messageId) {
		console.error('❌ MESSAGE_ID is not set in the configuration.');
		console.error(
			'   Please make sure to have your webhook send a message and copy the ID of that message into the configuration.'
		);
		process.exit(1);
	}

	if (!config.monitoring.processName) {
		console.error('❌ PROCESS_NAME is not set in the configuration.');
		console.error('   Please specify the PM2 process name to monitor.');
		process.exit(1);
	}

	// Validate intervals
	if (config.monitoring.updateInterval < 5000) {
		console.warn(
			'⚠️  Update interval is less than 5 seconds. This may cause rate limiting.'
		);
	}

	if (config.monitoring.quickCheckInterval < 1000) {
		console.warn(
			'⚠️  Quick check interval is less than 1 second. This may cause high CPU usage.'
		);
	}

	// Validate embeds file
	if (config.embeds.useCustomEmbeds) {
		const embedsPath = path.join(
			__dirname,
			'..',
			'..',
			config.embeds.embedsFile
		);
		if (!fs.existsSync(embedsPath)) {
			console.error(
				`❌ Embeds file not found: ${config.embeds.embedsFile}`
			);
			console.error(
				'   Please ensure the file exists or set useCustomEmbeds to false.'
			);
			process.exit(1);
		}
	}

	// Validate multiple processes
	if (
		config.advanced.processMultiple &&
		config.advanced.processNames.length === 0
	) {
		console.error(
			'❌ Multiple process monitoring is enabled but no process names are specified.'
		);
		console.error('   Please add process names to the processNames array.');
		process.exit(1);
	}

	console.log('✅ Configuration validated successfully.');
}

// Export both new and legacy configs for backward compatibility
module.exports = {
	config: legacyConfig, // Legacy compatibility
	fullConfig: config, // New full configuration
	validateConfig,
};
