const axios = require('axios');

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
			console.log('Uptime updated successfully.');
			return response.data;
		} catch (error) {
			console.error(
				'Error updating uptime:',
				error.response?.data || error.message
			);
			throw error;
		}
	}
}

module.exports = DiscordService;
