#!/usr/bin/env node

// Test script to verify configuration system
const path = require('path');
const fs = require('fs');

console.log('🧪 Testing PM2 Uptime Tracker Configuration System');
console.log('==================================================\n');

// Test 1: Load configuration module
console.log('1. Testing configuration module loading...');
try {
	const { config, fullConfig, validateConfig } = require('./src/config');
	console.log('✅ Configuration module loaded successfully');
	console.log('   - Legacy config available:', !!config);
	console.log('   - Full config available:', !!fullConfig);
	console.log('   - Validation function available:', !!validateConfig);
} catch (error) {
	console.error('❌ Failed to load configuration module:', error.message);
	process.exit(1);
}

// Test 2: Test default configuration
console.log('\n2. Testing default configuration...');
try {
	const { fullConfig } = require('./src/config');
	console.log('✅ Default configuration loaded');
	console.log('   - Discord section:', !!fullConfig.discord);
	console.log('   - Monitoring section:', !!fullConfig.monitoring);
	console.log('   - Notifications section:', !!fullConfig.notifications);
	console.log('   - Embeds section:', !!fullConfig.embeds);
	console.log('   - Logging section:', !!fullConfig.logging);
	console.log('   - Advanced section:', !!fullConfig.advanced);
	console.log('   - Features section:', !!fullConfig.features);
} catch (error) {
	console.error('❌ Failed to load default configuration:', error.message);
	process.exit(1);
}

// Test 3: Test JSON configuration loading
console.log('\n3. Testing JSON configuration loading...');
const testConfig = {
	discord: {
		webhookUrl: 'https://test.webhook.url',
		messageId: '123456789',
	},
	monitoring: {
		processName: 'test-process',
	},
};

const testConfigPath = path.join(__dirname, 'test-config.json');
try {
	fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
	console.log('✅ Test configuration file created');

	// Move it to config.json temporarily
	const configPath = path.join(__dirname, 'config.json');
	const configExists = fs.existsSync(configPath);
	let originalConfig = null;

	if (configExists) {
		originalConfig = fs.readFileSync(configPath, 'utf8');
	}

	fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

	// Clear require cache and reload
	delete require.cache[require.resolve('./src/config')];
	const { fullConfig } = require('./src/config');

	if (fullConfig.discord.webhookUrl === 'https://test.webhook.url') {
		console.log('✅ JSON configuration loaded correctly');
	} else {
		console.log('❌ JSON configuration not loaded correctly');
	}

	// Restore original config
	if (originalConfig) {
		fs.writeFileSync(configPath, originalConfig);
	} else {
		fs.unlinkSync(configPath);
	}

	fs.unlinkSync(testConfigPath);
} catch (error) {
	console.error('❌ Failed to test JSON configuration:', error.message);

	// Cleanup
	try {
		if (fs.existsSync(testConfigPath)) fs.unlinkSync(testConfigPath);
	} catch (cleanupError) {
		console.error('Failed to cleanup test files:', cleanupError.message);
	}
}

// Test 4: Test embed loading
console.log('\n4. Testing embed system...');
try {
	const { loadEmbeds } = require('./src/services/uptimeService');
	const embeds = loadEmbeds();
	console.log('✅ Embeds loaded successfully');
	console.log('   - Available embed types:', Object.keys(embeds).join(', '));

	// Test embed creation
	const { createStatusEmbed } = require('./src/services/uptimeService');
	const embed = createStatusEmbed(
		'test-process',
		'online',
		60000,
		new Date()
	);
	console.log('✅ Embed creation successful');
	console.log('   - Embed title:', embed.title);
} catch (error) {
	console.error('❌ Failed to test embed system:', error.message);
}

// Test 5: Test logger
console.log('\n5. Testing logger system...');
try {
	const logger = require('./src/utils/logger');
	logger.info('Test log message');
	logger.success('Test success message');
	logger.warn('Test warning message');
	console.log('✅ Logger system working');
} catch (error) {
	console.error('❌ Failed to test logger:', error.message);
}

console.log('\n🎉 Configuration system tests completed!');
console.log('\nNext steps:');
console.log('1. Run `npm run setup` to configure your tracker');
console.log('2. Or manually create config.json with your settings');
console.log('3. Run `npm start` to start monitoring');
console.log('\nFor help, see CONFIG.md or README.md');
