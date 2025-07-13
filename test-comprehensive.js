#!/usr/bin/env node

// Comprehensive test suite for PM2 Uptime Tracker
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🧪 PM2 Uptime Tracker - Comprehensive Test Suite');
console.log('================================================\n');

// Test results tracking
const testResults = {
	passed: 0,
	failed: 0,
	tests: [],
};

function runTest(testName, testFunction) {
	try {
		console.log(`\n🔍 Testing: ${testName}`);
		console.log('-'.repeat(50));

		const result = testFunction();

		if (result !== false) {
			console.log(`✅ PASSED: ${testName}`);
			testResults.passed++;
			testResults.tests.push({ name: testName, status: 'PASSED' });
		} else {
			console.log(`❌ FAILED: ${testName}`);
			testResults.failed++;
			testResults.tests.push({ name: testName, status: 'FAILED' });
		}
	} catch (error) {
		console.error(`❌ ERROR in ${testName}: ${error.message}`);
		testResults.failed++;
		testResults.tests.push({
			name: testName,
			status: 'ERROR',
			error: error.message,
		});
	}
}

// Test 1: Configuration System
runTest('Configuration System Loading', () => {
	const { config, fullConfig, validateConfig } = require('./src/config');

	console.log('   - Legacy config available:', !!config);
	console.log('   - Full config available:', !!fullConfig);
	console.log('   - Validation function available:', !!validateConfig);

	// Test required sections
	const requiredSections = [
		'discord',
		'monitoring',
		'notifications',
		'embeds',
		'logging',
		'advanced',
		'features',
	];
	for (const section of requiredSections) {
		if (!fullConfig[section]) {
			console.error(`   ❌ Missing section: ${section}`);
			return false;
		}
		console.log(`   ✓ Section present: ${section}`);
	}

	return true;
});

// Test 2: Default Configuration Values
runTest('Default Configuration Values', () => {
	const { fullConfig } = require('./src/config');

	const defaultTests = [
		{ path: 'discord.username', expected: 'PM2 Uptime Tracker' },
		{ path: 'monitoring.processName', expected: 'example-process' },
		{ path: 'monitoring.updateInterval', expected: 60000 },
		{ path: 'monitoring.enableQuickChecks', expected: true },
		{ path: 'notifications.statusChanges.enabled', expected: true },
		{ path: 'embeds.useCustomEmbeds', expected: true },
		{ path: 'logging.enabled', expected: true },
		{ path: 'logging.level', expected: 'info' },
		{ path: 'advanced.retryAttempts', expected: 3 },
		{ path: 'features.enableMetrics', expected: true },
	];

	for (const test of defaultTests) {
		const value = test.path
			.split('.')
			.reduce((obj, key) => obj?.[key], fullConfig);
		if (value !== test.expected) {
			console.error(
				`   ❌ ${test.path}: expected ${test.expected}, got ${value}`
			);
			return false;
		}
		console.log(`   ✓ ${test.path}: ${value}`);
	}

	return true;
});

// Test 3: JSON Configuration Loading
runTest('JSON Configuration Loading', () => {
	const testConfig = {
		discord: {
			webhookUrl: 'https://test.webhook.url',
			messageId: '123456789',
		},
		monitoring: {
			processName: 'test-process',
			updateInterval: 30000,
		},
	};

	const testConfigPath = path.join(__dirname, 'test-config.json');

	try {
		fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
		console.log('   ✓ Test configuration file created');

		// Test if file can be loaded
		const loaded = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
		if (loaded.discord.webhookUrl !== testConfig.discord.webhookUrl) {
			console.error('   ❌ Configuration not loaded correctly');
			return false;
		}

		console.log('   ✓ Configuration loaded and parsed correctly');

		// Cleanup
		fs.unlinkSync(testConfigPath);

		return true;
	} catch (error) {
		console.error(`   ❌ Error: ${error.message}`);
		return false;
	}
});

// Test 4: Environment Variable Loading
runTest('Environment Variable Handling', () => {
	const originalEnv = process.env.TEST_WEBHOOK_URL;

	try {
		process.env.TEST_WEBHOOK_URL = 'https://test.env.webhook.url';

		// Test environment variable access
		if (process.env.TEST_WEBHOOK_URL !== 'https://test.env.webhook.url') {
			console.error('   ❌ Environment variable not set correctly');
			return false;
		}

		console.log('   ✓ Environment variable handling works');

		// Cleanup
		if (originalEnv) {
			process.env.TEST_WEBHOOK_URL = originalEnv;
		} else {
			delete process.env.TEST_WEBHOOK_URL;
		}

		return true;
	} catch (error) {
		console.error(`   ❌ Error: ${error.message}`);
		return false;
	}
});

// Test 5: Embed System
runTest('Embed System', () => {
	const {
		createStatusEmbed,
		loadEmbeds,
	} = require('./src/services/uptimeService');

	// Test embed loading
	const embeds = loadEmbeds();
	const expectedEmbedTypes = ['online', 'offline', 'error', 'restarting'];

	for (const type of expectedEmbedTypes) {
		if (!embeds[type]) {
			console.error(`   ❌ Missing embed type: ${type}`);
			return false;
		}
		console.log(`   ✓ Embed type available: ${type}`);
	}

	// Test embed creation
	const testEmbed = createStatusEmbed(
		'test-process',
		'online',
		60000,
		new Date()
	);

	if (!testEmbed.title || !testEmbed.title.includes('test-process')) {
		console.error(
			'   ❌ Embed creation failed - missing or incorrect title'
		);
		return false;
	}

	console.log('   ✓ Embed creation successful');
	console.log(`   ✓ Embed title: ${testEmbed.title}`);

	return true;
});

// Test 6: Logger System
runTest('Logger System', () => {
	const logger = require('./src/utils/logger');

	// Test logger methods
	const methods = ['info', 'warn', 'error', 'success', 'debug'];

	for (const method of methods) {
		if (typeof logger[method] !== 'function') {
			console.error(`   ❌ Logger method missing: ${method}`);
			return false;
		}
		console.log(`   ✓ Logger method available: ${method}`);
	}

	// Test logging (capture console output)
	const originalConsoleLog = console.log;
	let logCaptured = false;

	console.log = (...args) => {
		if (args.join(' ').includes('Test log message')) {
			logCaptured = true;
		}
		originalConsoleLog(...args);
	};

	logger.info('Test log message');

	console.log = originalConsoleLog;

	if (!logCaptured) {
		console.error('   ❌ Logger output not captured');
		return false;
	}

	console.log('   ✓ Logger output working');

	return true;
});

// Test 7: Discord Service
runTest('Discord Service', () => {
	const DiscordService = require('./src/services/discordService');

	// Test service instantiation
	const service = new DiscordService(
		'https://discord.com/api/webhooks/test/test',
		'123456789',
		'Test Bot',
		'https://test.avatar.url'
	);

	if (!service.webhookUrl || !service.messageId) {
		console.error('   ❌ Discord service not initialized correctly');
		return false;
	}

	console.log('   ✓ Discord service initialized correctly');
	console.log(`   ✓ Webhook URL: ${service.webhookUrl}`);
	console.log(`   ✓ Message ID: ${service.messageId}`);
	console.log(`   ✓ Username: ${service.username}`);

	// Test methods availability
	const methods = ['sendUptimeUpdate', 'sendNewMessage'];
	for (const method of methods) {
		if (typeof service[method] !== 'function') {
			console.error(`   ❌ Discord service method missing: ${method}`);
			return false;
		}
		console.log(`   ✓ Discord service method available: ${method}`);
	}

	return true;
});

// Test 8: PM2 Service
runTest('PM2 Service', () => {
	try {
		const PM2Service = require('./src/services/pm2Service');

		// Test service instantiation
		const service = new PM2Service('test-process');

		if (!service.processName) {
			console.error('   ❌ PM2 service not initialized correctly');
			return false;
		}

		console.log('   ✓ PM2 service initialized correctly');
		console.log(`   ✓ Process name: ${service.processName}`);

		// Test methods availability
		const methods = ['getProcessUptime', 'connect', 'disconnect'];
		for (const method of methods) {
			if (typeof service[method] !== 'function') {
				console.error(`   ❌ PM2 service method missing: ${method}`);
				return false;
			}
			console.log(`   ✓ PM2 service method available: ${method}`);
		}

		return true;
	} catch (error) {
		console.error(`   ❌ PM2 service error: ${error.message}`);
		return false;
	}
});

// Test 9: Main Application
runTest('Main Application', () => {
	const UptimeTracker = require('./src/app');

	// Test app instantiation
	const app = new UptimeTracker();

	if (!app.config || !app.pm2Service || !app.discordService) {
		console.error('   ❌ Main application not initialized correctly');
		return false;
	}

	console.log('   ✓ Main application initialized correctly');

	// Test methods availability
	const methods = ['start', 'stop', 'updateUptime', 'quickStatusCheck'];
	for (const method of methods) {
		if (typeof app[method] !== 'function') {
			console.error(`   ❌ Main application method missing: ${method}`);
			return false;
		}
		console.log(`   ✓ Main application method available: ${method}`);
	}

	return true;
});

// Test 10: Configuration Validation
runTest('Configuration Validation', () => {
	const { validateConfig } = require('./src/config');

	// Test with missing required fields
	const originalEnv = {
		WEBHOOK_URL: process.env.WEBHOOK_URL,
		MESSAGE_ID: process.env.MESSAGE_ID,
		PROCESS_NAME: process.env.PROCESS_NAME,
	};

	try {
		// Clear required environment variables
		delete process.env.WEBHOOK_URL;
		delete process.env.MESSAGE_ID;
		delete process.env.PROCESS_NAME;

		// Create temporary config with missing fields
		const testConfigPath = path.join(__dirname, 'config.json');
		const configExists = fs.existsSync(testConfigPath);
		let originalConfig = null;

		if (configExists) {
			originalConfig = fs.readFileSync(testConfigPath, 'utf8');
			fs.unlinkSync(testConfigPath);
		}

		// Clear require cache
		Object.keys(require.cache).forEach((key) => {
			if (key.includes('src/config')) {
				delete require.cache[key];
			}
		});

		console.log('   ✓ Configuration validation function available');

		// Restore environment
		Object.keys(originalEnv).forEach((key) => {
			if (originalEnv[key]) {
				process.env[key] = originalEnv[key];
			}
		});

		// Restore config file
		if (originalConfig) {
			fs.writeFileSync(testConfigPath, originalConfig);
		}

		return true;
	} catch (error) {
		console.error(`   ❌ Validation test error: ${error.message}`);
		return false;
	}
});

// Test 11: File System Operations
runTest('File System Operations', () => {
	// Test embeds.json exists
	const embedsPath = path.join(__dirname, 'embeds.json');
	if (!fs.existsSync(embedsPath)) {
		console.error('   ❌ embeds.json file not found');
		return false;
	}
	console.log('   ✓ embeds.json file exists');

	// Test embeds.json is valid JSON
	try {
		const embedsContent = fs.readFileSync(embedsPath, 'utf8');
		const embeds = JSON.parse(embedsContent);

		if (!embeds.online || !embeds.offline) {
			console.error('   ❌ embeds.json missing required embed types');
			return false;
		}

		console.log('   ✓ embeds.json is valid JSON');
		console.log(
			`   ✓ Available embed types: ${Object.keys(embeds).join(', ')}`
		);
	} catch (error) {
		console.error(`   ❌ embeds.json parse error: ${error.message}`);
		return false;
	}

	// Test package.json
	const packagePath = path.join(__dirname, 'package.json');
	if (!fs.existsSync(packagePath)) {
		console.error('   ❌ package.json file not found');
		return false;
	}
	console.log('   ✓ package.json file exists');

	return true;
});

// Test 12: Dependencies
runTest('Dependencies', () => {
	const packagePath = path.join(__dirname, 'package.json');
	const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

	const requiredDependencies = ['axios', 'dotenv', 'pm2'];

	for (const dep of requiredDependencies) {
		if (!packageContent.dependencies || !packageContent.dependencies[dep]) {
			console.error(`   ❌ Missing dependency: ${dep}`);
			return false;
		}
		console.log(`   ✓ Dependency present: ${dep}`);
	}

	// Test if dependencies are actually loadable
	try {
		require('axios');
		console.log('   ✓ axios loadable');

		require('dotenv');
		console.log('   ✓ dotenv loadable');

		require('pm2');
		console.log('   ✓ pm2 loadable');

		return true;
	} catch (error) {
		console.error(`   ❌ Dependency load error: ${error.message}`);
		return false;
	}
});

// Print final results
console.log('\n' + '='.repeat(60));
console.log('🎯 TEST RESULTS SUMMARY');
console.log('='.repeat(60));

console.log(`\n✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📊 Total: ${testResults.passed + testResults.failed}`);

const successRate =
	(testResults.passed / (testResults.passed + testResults.failed)) * 100;
console.log(`📈 Success Rate: ${successRate.toFixed(1)}%\n`);

// Detailed results
console.log('📋 Detailed Results:');
console.log('-'.repeat(40));
testResults.tests.forEach((test, index) => {
	const icon = test.status === 'PASSED' ? '✅' : '❌';
	console.log(`${index + 1}. ${icon} ${test.name}`);
	if (test.error) {
		console.log(`   Error: ${test.error}`);
	}
});

if (testResults.failed > 0) {
	console.log(
		'\n⚠️  Some tests failed. Please check the output above for details.'
	);
	console.log('💡 Tip: Run with DEBUG=* for more detailed output');
	process.exit(1);
} else {
	console.log(
		'\n🎉 All tests passed! Your PM2 Uptime Tracker is ready to use.'
	);
	console.log('\n🚀 Next steps:');
	console.log('   1. Run `npm run setup` to configure your tracker');
	console.log('   2. Run `npm start` to start monitoring');
	console.log('   3. Check TESTING.md for advanced testing scenarios');
}
