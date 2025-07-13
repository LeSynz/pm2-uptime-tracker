const path = require('path');
const fs = require('fs');

// Load embeds from file or use defaults
function loadEmbeds(embedsFile = 'embeds.json') {
	const embedsPath = path.join(__dirname, '..', '..', embedsFile);

	try {
		if (fs.existsSync(embedsPath)) {
			return require(embedsPath);
		}
	} catch (error) {
		console.warn(
			`Warning: Could not load ${embedsFile}, using default embeds`
		);
	}

	// Default embeds if file doesn't exist
	return {
		restarting: {
			title: '$processName - Restarting',
			description: 'The process is currently restarting.',
			color: 4380038,
		},
		online: {
			title: '$processName - Online',
			description: 'The process is online and running.',
			fields: [
				{
					name: 'Uptime',
					value: '$uptime',
				},
				{
					name: 'Last Restart',
					value: '$lastRestart',
				},
			],
			color: 4380024,
		},
		offline: {
			title: '$processName - Offline',
			description: 'The process is currently offline.',
			color: 16711680,
		},
		error: {
			title: '$processName - Error',
			description: 'The process has encountered an error.',
			color: 16711680,
		},
		unknown: {
			title: '$processName - Status Unknown',
			description: 'The status of the process is unknown.',
			color: 16777215,
		},
		'not-found': {
			title: '$processName - Not Found',
			description: 'The process could not be found in PM2.',
			color: 16711680,
		},
	};
}

function formatUptime(uptime) {
	const seconds = Math.floor((uptime / 1000) % 60);
	const minutes = Math.floor((uptime / (1000 * 60)) % 60);
	const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
	const days = Math.floor(uptime / (1000 * 60 * 60 * 24));

	if (days > 0) {
		return `${days}d ${hours}h ${minutes}m ${seconds}s`;
	} else if (hours > 0) {
		return `${hours}h ${minutes}m ${seconds}s`;
	} else if (minutes > 0) {
		return `${minutes}m ${seconds}s`;
	}
	return `${seconds}s`;
}

function formatLastRestart(timestamp) {
	if (!timestamp) return 'N/A';
	const date = new Date(timestamp);
	return date.toLocaleString();
}

function createStatusEmbed(
	processName,
	status,
	uptime,
	lastRestart,
	metadata = {},
	config = null
) {
	const embedsFile = config?.embeds?.embedsFile || 'embeds.json';
	const embeds = config?.embeds?.useCustomEmbeds
		? loadEmbeds(embedsFile)
		: loadEmbeds();

	let embedTemplate;

	// Map PM2 status to embed types
	switch (status) {
		case 'online':
			embedTemplate = embeds.online;
			break;
		case 'stopping':
		case 'stopped':
			embedTemplate = embeds.offline;
			break;
		case 'launching':
		case 'errored':
			embedTemplate = embeds.error;
			break;
		case 'one-launch-status':
		case 'restarting':
			embedTemplate = embeds.restarting;
			break;
		case 'not-found':
			embedTemplate = embeds.error;
			break;
		default:
			embedTemplate = embeds.unknown || embeds.generic;
	}

	// Clone the template to avoid modifying the original
	const embed = JSON.parse(JSON.stringify(embedTemplate));

	// Replace placeholders in title and description
	embed.title = embed.title.replace(/\$processName/g, processName);
	embed.description = embed.description.replace(
		/\$processName/g,
		processName
	);

	// Process fields if they exist
	if (embed.fields) {
		embed.fields = embed.fields.map((field) => ({
			...field,
			name: field.name.replace(/\$processName/g, processName),
			value: field.value
				.replace(/\$uptime/g, formatUptime(uptime))
				.replace(/\$lastRestart/g, formatLastRestart(lastRestart))
				.replace(/\$processName/g, processName),
		}));

		// Filter out fields based on config
		embed.fields = embed.fields.filter((field) => {
			if (
				config?.embeds?.showUptime === false &&
				field.name.toLowerCase().includes('uptime')
			) {
				return false;
			}
			if (
				config?.embeds?.showLastRestart === false &&
				field.name.toLowerCase().includes('restart')
			) {
				return false;
			}
			return true;
		});
	}

	// Add additional fields for status changes and restarts
	if (config?.embeds?.includeStatusChangeInfo && metadata.statusChanged) {
		embed.fields = embed.fields || [];
		embed.fields.push({
			name: 'Status Change',
			value: `🔄 Status changed to **${status}**`,
			inline: true,
		});
	}

	if (config?.embeds?.showRestartCount && metadata.restartDetected) {
		embed.fields = embed.fields || [];
		embed.fields.push({
			name: 'Restart Detected',
			value: `🔄 Restart #${metadata.restartCount || 1}`,
			inline: true,
		});
	}

	if (
		config?.embeds?.includeImmediateNotificationFlag &&
		metadata.immediate
	) {
		embed.fields = embed.fields || [];
		embed.fields.push({
			name: 'Alert Type',
			value: `🚨 **IMMEDIATE NOTIFICATION**`,
			inline: true,
		});
	}

	if (config?.embeds?.includeErrorDetails && metadata.error) {
		embed.fields = embed.fields || [];
		embed.fields.push({
			name: 'Error',
			value: `❌ ${metadata.error}`,
			inline: false,
		});
	}

	// Add process info if enabled
	if (config?.embeds?.showProcessInfo && metadata.processInfo) {
		embed.fields = embed.fields || [];
		embed.fields.push({
			name: 'Process Info',
			value: `PID: ${metadata.processInfo.pid}\nMemory: ${metadata.processInfo.memory}MB\nCPU: ${metadata.processInfo.cpu}%`,
			inline: true,
		});
	}

	// Add restart count if enabled and available
	if (
		config?.embeds?.showRestartCount &&
		metadata.restartCount !== undefined
	) {
		embed.fields = embed.fields || [];
		embed.fields.push({
			name: 'Restart Count',
			value: `${metadata.restartCount}`,
			inline: true,
		});
	}

	// Add timestamp if enabled
	if (config?.embeds?.showTimestamp !== false) {
		embed.timestamp = new Date().toISOString();
	}

	return embed;
}
// Backward compatibility function
function createUptimeEmbed(processName, uptime, lastRestart, config = null) {
	return createStatusEmbed(
		processName,
		'online',
		uptime,
		lastRestart,
		{},
		config
	);
}

module.exports = {
	formatUptime,
	formatLastRestart,
	createStatusEmbed,
	createUptimeEmbed,
	loadEmbeds,
};
