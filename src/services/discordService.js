const axios = require('axios');
const logger = require('../utils/logger');

class DiscordService {
	constructor(webhookUrl, messageId) {
		this.webhookUrl = webhookUrl;
		this.messageId = messageId;
	}

	async sendUptimeUpdate(embed) {
		try {
			const response = await axios.patch(
				`${this.webhookUrl}/messages/${this.messageId}`,
				{ embeds: [embed] },
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
			logger.info('Discord embed updated successfully.');
			return response.data;
		} catch (error) {
			logger.error(
				'Error updating Discord embed:',
				error.response?.data || error.message
			);
			throw error;
		}
	}
}

module.exports = DiscordService;
