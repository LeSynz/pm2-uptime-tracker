require('dotenv').config();

const config = {
	webhookUrl: process.env.WEBHOOK_URL,
	messageId: process.env.MESSAGE_ID,
	processName: process.env.PROCESS_NAME || 'example-process',
	updateInterval: parseInt(process.env.UPDATE_INTERVAL) || 60000, // 1 minute default
};

function validateConfig() {
	if (!config.webhookUrl) {
		console.error('WEBHOOK_URL is not set in the environment variables.');
		process.exit(1);
	}

	if (!config.messageId) {
		console.error(
			'MESSAGE_ID is not set in the environment variables.\nPlease make sure to have you webhook send a message and copy the ID of that message into the .env file.'
		);
		process.exit(1);
	}
}

module.exports = {
	config,
	validateConfig,
};
