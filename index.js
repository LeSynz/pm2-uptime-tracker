require('dotenv').config();
const pm2 = require('pm2');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { send } = require('process');

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const MESSAGE_ID = process.env.MESSAGE_ID;
const PROCESS_NAME = 'verify-tag'; // the name of the process you want to monitor

if (!WEBHOOK_URL) {
	console.error('WEBHOOK_URL is not set in the environment variables.');
	process.exit(1);
}

if (!MESSAGE_ID) {
	console.error(
		'MESSAGE_ID is not set in the environment variables.\nPlease make sure to have you webhook send a message and copy the ID of that message into the .env file.'
	);
	process.exit(1);
}

const uptimeMap = new Map();

// Embed for uptime tracking
const embed = {
	title: 'Uptime Tracker',
	description:
		'Uptime Tracker is in development! Please check back later for updates.',
	color: 0x5dca6e, // Use an integer for color
	fields: [],
	timestamp: new Date(),
	footer: {
		text: 'Uptime Tracker - Made by synz.xyz',
	},
};

// Function to send the embed to Discord
async function sendEmbed() {
	try {
		await axios.post(WEBHOOK_URL, {
			content: '',
			embeds: [embed],
		});
	} catch (error) {
		console.error('Error sending embed:', error);
	}
}

sendEmbed();
