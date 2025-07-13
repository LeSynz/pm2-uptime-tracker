const axios = require('axios');
const logger = require('../utils/logger');

class DiscordService {
	constructor(webhookUrl, messageId, username = null, avatarUrl = null) {
		this.webhookUrl = webhookUrl;
		this.messageId = messageId;
		this.username = username;
		this.avatarUrl = avatarUrl;
	}

	async sendUptimeUpdate(embed) {
		try {
			const payload = { embeds: [embed] };

			// Add username and avatar if provided
			if (this.username) {
				payload.username = this.username;
			}
			if (this.avatarUrl) {
				payload.avatar_url = this.avatarUrl;
			}

			const response = await axios.patch(
				`${this.webhookUrl}/messages/${this.messageId}`,
				payload,
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

	async sendNewMessage(embed) {
		try {
			const payload = { embeds: [embed] };

			// Add username and avatar if provided
			if (this.username) {
				payload.username = this.username;
			}
			if (this.avatarUrl) {
				payload.avatar_url = this.avatarUrl;
			}

			const response = await axios.post(this.webhookUrl, payload, {
				headers: {
					'Content-Type': 'application/json',
				},
			});
			logger.info('New Discord message sent successfully.');
			return response.data;
		} catch (error) {
			logger.error(
				'Error sending new Discord message:',
				error.response?.data || error.message
			);
			throw error;
		}
	}
}

module.exports = DiscordService;
