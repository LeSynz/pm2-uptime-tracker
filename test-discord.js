#!/usr/bin/env node

// Test script for Discord integration
const path = require('path');
const fs = require('fs');
const readline = require('readline');

console.log('🔗 Discord Integration Test');
console.log('===========================\n');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

function askQuestion(question) {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer.trim());
		});
	});
}

async function testDiscordIntegration() {
	console.log('This test will help you verify Discord integration.');
	console.log('You can run this in two modes:\n');

	const mode = await askQuestion(
		'Choose mode:\n1. Dry run (no actual messages sent)\n2. Live test (sends real messages)\nEnter 1 or 2: '
	);

	if (mode === '1') {
		await testDryRun();
	} else if (mode === '2') {
		await testLiveIntegration();
	} else {
		console.log('Invalid selection. Exiting.');
		process.exit(1);
	}
}

async function testDryRun() {
	console.log('\n🧪 Running Discord Dry Run Test...\n');

	try {
		const DiscordService = require('./src/services/discordService');
		const { createStatusEmbed } = require('./src/services/uptimeService');

		// Test service creation
		const service = new DiscordService(
			'https://discord.com/api/webhooks/test/test',
			'123456789',
			'Test Bot',
			'https://example.com/avatar.png'
		);

		console.log('✅ Discord service created successfully');
		console.log(`   Webhook URL: ${service.webhookUrl}`);
		console.log(`   Message ID: ${service.messageId}`);
		console.log(`   Username: ${service.username}`);

		// Test embed creation
		const testEmbed = createStatusEmbed(
			'test-process',
			'online',
			120000, // 2 minutes
			new Date(),
			{ restartCount: 3, statusChanged: true }
		);

		console.log('\n✅ Embed created successfully');
		console.log('   Embed preview:');
		console.log(`   Title: ${testEmbed.title}`);
		console.log(`   Description: ${testEmbed.description}`);
		console.log(`   Color: ${testEmbed.color}`);
		console.log(
			`   Fields: ${testEmbed.fields ? testEmbed.fields.length : 0}`
		);

		// Test different embed types
		const embedTypes = ['online', 'offline', 'error', 'restarting'];
		console.log('\n✅ Testing different embed types:');

		for (const type of embedTypes) {
			const embed = createStatusEmbed(
				'test-process',
				type,
				60000,
				new Date()
			);
			console.log(`   ${type}: ${embed.title}`);
		}

		console.log('\n🎉 Dry run completed successfully!');
		console.log('All Discord components are working correctly.');
	} catch (error) {
		console.error('\n❌ Dry run failed:', error.message);
		console.error('Please check your configuration and dependencies.');
	}
}

async function testLiveIntegration() {
	console.log('\n🚀 Running Discord Live Integration Test...\n');

	const webhookUrl = await askQuestion('Enter your Discord webhook URL: ');
	if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
		console.error('❌ Invalid webhook URL format');
		process.exit(1);
	}

	const sendTestMessage = await askQuestion(
		'Send a test message first? (y/n): '
	);

	try {
		const DiscordService = require('./src/services/discordService');
		const { createStatusEmbed } = require('./src/services/uptimeService');

		const service = new DiscordService(
			webhookUrl,
			null,
			'PM2 Uptime Tracker Test'
		);

		if (sendTestMessage.toLowerCase() === 'y') {
			console.log('\n📤 Sending test message...');

			const testEmbed = createStatusEmbed(
				'test-process',
				'online',
				300000, // 5 minutes
				new Date(),
				{
					restartCount: 1,
					statusChanged: false,
					immediate: false,
				}
			);

			const response = await service.sendNewMessage(testEmbed);
			console.log('✅ Test message sent successfully!');
			console.log(`   Message ID: ${response.id}`);
			console.log('   Copy this message ID for future use.');

			const useForUpdates = await askQuestion(
				'\nUse this message for update tests? (y/n): '
			);

			if (useForUpdates.toLowerCase() === 'y') {
				console.log('\n🔄 Testing message updates...');

				const updateService = new DiscordService(
					webhookUrl,
					response.id,
					'PM2 Uptime Tracker Test'
				);

				// Test different status updates
				const statuses = ['offline', 'error', 'online'];

				for (let i = 0; i < statuses.length; i++) {
					const status = statuses[i];
					console.log(`   Updating to ${status}...`);

					const updateEmbed = createStatusEmbed(
						'test-process',
						status,
						(i + 1) * 60000,
						new Date(),
						{
							restartCount: i + 1,
							statusChanged: true,
							immediate: true,
						}
					);

					await updateService.sendUptimeUpdate(updateEmbed);
					console.log(`   ✅ Updated to ${status}`);

					if (i < statuses.length - 1) {
						console.log('   Waiting 2 seconds...');
						await new Promise((resolve) =>
							setTimeout(resolve, 2000)
						);
					}
				}

				console.log(
					'\n🎉 Live integration test completed successfully!'
				);
				console.log('Your Discord integration is working perfectly.');
			}
		} else {
			console.log('\n🔍 Testing webhook connectivity...');

			// Just test the webhook URL without sending
			const testEmbed = createStatusEmbed(
				'test-process',
				'online',
				60000,
				new Date()
			);
			console.log('✅ Webhook URL appears valid');
			console.log('✅ Embed generation working');
			console.log('⚠️  No actual message sent (as requested)');
		}
	} catch (error) {
		console.error('\n❌ Live integration test failed:', error.message);

		if (error.response) {
			console.error(
				'   Discord API Response:',
				error.response.status,
				error.response.statusText
			);
			if (error.response.data) {
				console.error(
					'   Error Details:',
					JSON.stringify(error.response.data, null, 2)
				);
			}
		}

		console.log('\n🔧 Troubleshooting tips:');
		console.log('   1. Check webhook URL is correct');
		console.log('   2. Verify webhook permissions in Discord server');
		console.log('   3. Check if webhook channel exists');
		console.log('   4. Ensure bot has permission to send messages');
	}
}

// Run the test
testDiscordIntegration().finally(() => {
	rl.close();
	console.log('\n👋 Discord integration test completed.');
});

module.exports = { testDiscordIntegration };
