const path = require('path');
const embeds = require(path.join(__dirname, '..', '..', 'embeds.json'));

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
	metadata = {}
) {
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
			embedTemplate = embeds.restarting;
			break;
		case 'not-found':
			embedTemplate = embeds.error;
			break;
		default:
			embedTemplate = embeds.unknown;
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
	}

	// Add additional fields for status changes and restarts
	if (metadata.statusChanged) {
		embed.fields = embed.fields || [];
		embed.fields.push({
			name: 'Status Change',
			value: `🔄 Status changed to **${status}**`,
			inline: true,
		});
	}

	if (metadata.restartDetected) {
		embed.fields = embed.fields || [];
		embed.fields.push({
			name: 'Restart Detected',
			value: `🔄 Restart #${metadata.restartCount || 1}`,
			inline: true,
		});
	}

	if (metadata.immediate) {
		embed.fields = embed.fields || [];
		embed.fields.push({
			name: 'Alert Type',
			value: `🚨 **IMMEDIATE NOTIFICATION**`,
			inline: true,
		});
	}

	if (metadata.error) {
		embed.fields = embed.fields || [];
		embed.fields.push({
			name: 'Error',
			value: `❌ ${metadata.error}`,
			inline: false,
		});
	}

	// Add timestamp
	embed.timestamp = new Date().toISOString();

	return embed;
}

// Backward compatibility function
function createUptimeEmbed(processName, uptime, lastRestart) {
	return createStatusEmbed(processName, 'online', uptime, lastRestart);
}

module.exports = {
	formatUptime,
	formatLastRestart,
	createStatusEmbed,
	createUptimeEmbed,
};
