#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

console.log('🚀 PM2 Uptime Tracker Configuration Wizard');
console.log('==========================================\n');

function askQuestion(question) {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer.trim());
		});
	});
}

function askYesNo(question, defaultValue = true) {
	const defaultText = defaultValue ? '(Y/n)' : '(y/N)';
	return askQuestion(`${question} ${defaultText}: `).then((answer) => {
		if (answer === '') return defaultValue;
		return answer.toLowerCase().startsWith('y');
	});
}

function askNumber(question, defaultValue = 0) {
	return askQuestion(`${question} (${defaultValue}): `).then((answer) => {
		if (answer === '') return defaultValue;
		const num = parseInt(answer);
		return isNaN(num) ? defaultValue : num;
	});
}

async function main() {
	const config = {
		discord: {},
		monitoring: {},
		notifications: {
			statusChanges: {},
			regularUpdates: {},
		},
		embeds: {},
		logging: {},
		advanced: {},
		features: {},
	};

	try {
		// Discord Configuration
		console.log('📢 Discord Configuration');
		console.log('------------------------');

		config.discord.webhookUrl = await askQuestion(
			'Discord Webhook URL (required): '
		);
		if (!config.discord.webhookUrl) {
			console.error('❌ Webhook URL is required!');
			process.exit(1);
		}

		config.discord.messageId = await askQuestion(
			'Message ID to edit (required): '
		);
		if (!config.discord.messageId) {
			console.error('❌ Message ID is required!');
			process.exit(1);
		}

		config.discord.username =
			(await askQuestion('Webhook username (PM2 Uptime Tracker): ')) ||
			'PM2 Uptime Tracker';
		config.discord.avatarUrl =
			(await askQuestion('Avatar URL (optional): ')) || '';

		// Monitoring Configuration
		console.log('\n🔍 Monitoring Configuration');
		console.log('---------------------------');

		config.monitoring.processName = await askQuestion(
			'PM2 Process name to monitor (required): '
		);
		if (!config.monitoring.processName) {
			console.error('❌ Process name is required!');
			process.exit(1);
		}

		config.monitoring.updateInterval = await askNumber(
			'Update interval in milliseconds',
			60000
		);
		config.monitoring.quickCheckInterval = await askNumber(
			'Quick check interval in milliseconds',
			5000
		);
		config.monitoring.enableQuickChecks = await askYesNo(
			'Enable quick status checks?',
			true
		);
		config.monitoring.enableImmediateNotifications = await askYesNo(
			'Enable immediate notifications?',
			true
		);
		config.monitoring.enableEventListeners = await askYesNo(
			'Enable PM2 event listeners?',
			true
		);

		// Notification Configuration
		console.log('\n🔔 Notification Configuration');
		console.log('-----------------------------');

		config.notifications.statusChanges.enabled = await askYesNo(
			'Enable status change notifications?',
			true
		);

		if (config.notifications.statusChanges.enabled) {
			config.notifications.statusChanges.notifyOnOnline = await askYesNo(
				'Notify when process goes online?',
				true
			);
			config.notifications.statusChanges.notifyOnOffline = await askYesNo(
				'Notify when process goes offline?',
				true
			);
			config.notifications.statusChanges.notifyOnError = await askYesNo(
				'Notify on errors?',
				true
			);
			config.notifications.statusChanges.notifyOnRestart = await askYesNo(
				'Notify on restarts?',
				true
			);
			config.notifications.statusChanges.notifyOnStop = await askYesNo(
				'Notify when process stops?',
				true
			);
			config.notifications.statusChanges.notifyOnStart = await askYesNo(
				'Notify when process starts?',
				true
			);
			config.notifications.statusChanges.notifyOnExit = await askYesNo(
				'Notify when process exits?',
				true
			);
		}

		config.notifications.regularUpdates.enabled = await askYesNo(
			'Enable regular updates?',
			true
		);
		config.notifications.regularUpdates.onlyOnChanges = await askYesNo(
			'Only send updates when changes occur?',
			false
		);
		config.notifications.criticalOnly = await askYesNo(
			'Only send critical notifications?',
			false
		);

		// Embed Configuration
		console.log('\n🎨 Embed Configuration');
		console.log('----------------------');

		config.embeds.useCustomEmbeds = await askYesNo(
			'Use custom embeds from embeds.json?',
			true
		);
		config.embeds.showUptime = await askYesNo(
			'Show uptime in embeds?',
			true
		);
		config.embeds.showLastRestart = await askYesNo(
			'Show last restart time?',
			true
		);
		config.embeds.showRestartCount = await askYesNo(
			'Show restart count?',
			true
		);
		config.embeds.showProcessInfo = await askYesNo(
			'Show process info (PID, memory, CPU)?',
			false
		);
		config.embeds.showTimestamp = await askYesNo(
			'Show timestamp in embeds?',
			true
		);
		config.embeds.includeStatusChangeInfo = await askYesNo(
			'Include status change information?',
			true
		);
		config.embeds.includeImmediateNotificationFlag = await askYesNo(
			'Flag immediate notifications?',
			true
		);
		config.embeds.includeErrorDetails = await askYesNo(
			'Include error details?',
			true
		);

		// Logging Configuration
		console.log('\n📝 Logging Configuration');
		console.log('------------------------');

		config.logging.enabled = await askYesNo('Enable logging?', true);

		if (config.logging.enabled) {
			const logLevel =
				(await askQuestion(
					'Log level (error/warn/info/debug) (info): '
				)) || 'info';
			config.logging.level = ['error', 'warn', 'info', 'debug'].includes(
				logLevel
			)
				? logLevel
				: 'info';
			config.logging.showTimestamp = await askYesNo(
				'Show timestamp in logs?',
				true
			);
			config.logging.showColors = await askYesNo(
				'Use colored output?',
				true
			);
			config.logging.logToFile = await askYesNo(
				'Enable file logging?',
				false
			);

			if (config.logging.logToFile) {
				config.logging.logFile =
					(await askQuestion(
						'Log file path (logs/uptime-tracker.log): '
					)) || 'logs/uptime-tracker.log';
			}
		}

		// Advanced Configuration
		console.log('\n⚙️ Advanced Configuration');
		console.log('-------------------------');

		config.advanced.retryAttempts = await askNumber(
			'Retry attempts on failure',
			3
		);
		config.advanced.retryDelay = await askNumber(
			'Retry delay in milliseconds',
			5000
		);
		config.advanced.gracefulShutdown = await askYesNo(
			'Enable graceful shutdown?',
			true
		);
		config.advanced.processMultiple = await askYesNo(
			'Monitor multiple processes? (Coming Soon - not yet implemented)',
			false
		);

		if (config.advanced.processMultiple) {
			const processNames = await askQuestion(
				'Enter process names separated by commas: '
			);
			config.advanced.processNames = processNames
				.split(',')
				.map((name) => name.trim())
				.filter((name) => name);
		}

		config.advanced.enableDataPersistence = await askYesNo(
			'Enable data persistence?',
			true
		);

		if (config.advanced.enableDataPersistence) {
			config.advanced.dataFile =
				(await askQuestion('Data file path (data.json): ')) ||
				'data.json';
		}

		// Feature Flags
		console.log('\n🎯 Feature Flags');
		console.log('----------------');

		config.features.enableWebhookFallback = await askYesNo(
			'Enable webhook fallback?',
			false
		);

		if (config.features.enableWebhookFallback) {
			config.features.webhookFallbackUrl =
				(await askQuestion('Fallback webhook URL: ')) || '';
		}

		config.features.enableMetrics = await askYesNo(
			'Enable metrics endpoint?',
			false
		);

		if (config.features.enableMetrics) {
			config.features.metricsPort = await askNumber(
				'Metrics server port',
				3000
			);
		}

		config.features.enableHealthcheck = await askYesNo(
			'Enable health check endpoint?',
			false
		);

		if (config.features.enableHealthcheck) {
			config.features.healthcheckPort = await askNumber(
				'Health check server port',
				3001
			);
		}

		// Save configuration
		console.log('\n💾 Saving Configuration');
		console.log('-----------------------');

		const configMethod =
			(await askQuestion(
				'Save as (1) config.json or (2) .env file? (1/2) (1): '
			)) || '1';

		if (configMethod === '1') {
			// Save as JSON
			const configPath = path.join(process.cwd(), 'config.json');
			fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
			console.log(`✅ Configuration saved to ${configPath}`);
		} else {
			// Save as .env
			const envPath = path.join(process.cwd(), '.env');
			const envContent = generateEnvContent(config);
			fs.writeFileSync(envPath, envContent);
			console.log(`✅ Configuration saved to ${envPath}`);
		}

		console.log('\n🎉 Configuration completed successfully!');
		console.log('You can now run: npm start');
		console.log('\nFor more configuration options, see CONFIG.md');
	} catch (error) {
		console.error('❌ Configuration failed:', error.message);
		process.exit(1);
	} finally {
		rl.close();
	}
}

function generateEnvContent(config) {
	const lines = [
		'# PM2 Uptime Tracker Configuration',
		'# Generated by configuration wizard',
		'',
		'# Discord Configuration',
		`WEBHOOK_URL=${config.discord.webhookUrl}`,
		`MESSAGE_ID=${config.discord.messageId}`,
		`DISCORD_USERNAME=${config.discord.username}`,
		`DISCORD_AVATAR_URL=${config.discord.avatarUrl}`,
		'',
		'# Process Monitoring',
		`PROCESS_NAME=${config.monitoring.processName}`,
		`UPDATE_INTERVAL=${config.monitoring.updateInterval}`,
		`QUICK_CHECK_INTERVAL=${config.monitoring.quickCheckInterval}`,
		`ENABLE_QUICK_CHECKS=${config.monitoring.enableQuickChecks}`,
		`ENABLE_IMMEDIATE_NOTIFICATIONS=${config.monitoring.enableImmediateNotifications}`,
		`ENABLE_EVENT_LISTENERS=${config.monitoring.enableEventListeners}`,
		'',
		'# Notification Settings',
		`NOTIFY_ON_STATUS_CHANGES=${config.notifications.statusChanges.enabled}`,
		`NOTIFY_ON_ONLINE=${config.notifications.statusChanges.notifyOnOnline}`,
		`NOTIFY_ON_OFFLINE=${config.notifications.statusChanges.notifyOnOffline}`,
		`NOTIFY_ON_ERROR=${config.notifications.statusChanges.notifyOnError}`,
		`NOTIFY_ON_RESTART=${config.notifications.statusChanges.notifyOnRestart}`,
		`NOTIFY_ON_STOP=${config.notifications.statusChanges.notifyOnStop}`,
		`NOTIFY_ON_START=${config.notifications.statusChanges.notifyOnStart}`,
		`NOTIFY_ON_EXIT=${config.notifications.statusChanges.notifyOnExit}`,
		`ENABLE_REGULAR_UPDATES=${config.notifications.regularUpdates.enabled}`,
		`REGULAR_UPDATES_ONLY_ON_CHANGES=${config.notifications.regularUpdates.onlyOnChanges}`,
		`CRITICAL_ONLY=${config.notifications.criticalOnly}`,
		'',
		'# Embed Settings',
		`USE_CUSTOM_EMBEDS=${config.embeds.useCustomEmbeds}`,
		`SHOW_UPTIME=${config.embeds.showUptime}`,
		`SHOW_LAST_RESTART=${config.embeds.showLastRestart}`,
		`SHOW_RESTART_COUNT=${config.embeds.showRestartCount}`,
		`SHOW_PROCESS_INFO=${config.embeds.showProcessInfo}`,
		`SHOW_TIMESTAMP=${config.embeds.showTimestamp}`,
		`INCLUDE_STATUS_CHANGE_INFO=${config.embeds.includeStatusChangeInfo}`,
		`INCLUDE_IMMEDIATE_NOTIFICATION_FLAG=${config.embeds.includeImmediateNotificationFlag}`,
		`INCLUDE_ERROR_DETAILS=${config.embeds.includeErrorDetails}`,
		'',
		'# Logging',
		`ENABLE_LOGGING=${config.logging.enabled}`,
		`LOG_LEVEL=${config.logging.level}`,
		`SHOW_TIMESTAMP=${config.logging.showTimestamp}`,
		`SHOW_COLORS=${config.logging.showColors}`,
		`LOG_TO_FILE=${config.logging.logToFile}`,
		`LOG_FILE=${config.logging.logFile}`,
		'',
		'# Advanced Settings',
		`RETRY_ATTEMPTS=${config.advanced.retryAttempts}`,
		`RETRY_DELAY=${config.advanced.retryDelay}`,
		`GRACEFUL_SHUTDOWN=${config.advanced.gracefulShutdown}`,
		`PROCESS_MULTIPLE=${config.advanced.processMultiple}`,
		`PROCESS_NAMES=${
			config.advanced.processNames
				? config.advanced.processNames.join(',')
				: ''
		}`,
		`ENABLE_DATA_PERSISTENCE=${config.advanced.enableDataPersistence}`,
		`DATA_FILE=${config.advanced.dataFile}`,
		'',
		'# Features',
		`ENABLE_WEBHOOK_FALLBACK=${config.features.enableWebhookFallback}`,
		`WEBHOOK_FALLBACK_URL=${config.features.webhookFallbackUrl}`,
		`ENABLE_METRICS=${config.features.enableMetrics}`,
		`METRICS_PORT=${config.features.metricsPort}`,
		`ENABLE_HEALTHCHECK=${config.features.enableHealthcheck}`,
		`HEALTHCHECK_PORT=${config.features.healthcheckPort}`,
	];

	return lines.join('\n');
}

if (require.main === module) {
	main();
}

module.exports = { main };
