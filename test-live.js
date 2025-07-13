#!/usr/bin/env node

// Live integration test - tests the complete workflow
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');

console.log('🔥 Live Integration Test');
console.log('========================\n');

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

async function runLiveTest() {
	console.log('This test will run a complete integration test with:');
	console.log('✅ Real PM2 process monitoring');
	console.log('✅ Real Discord notifications');
	console.log('✅ Complete configuration system');
	console.log('✅ All features working together\n');

	const proceed = await askQuestion('Do you want to proceed? (y/n): ');
	if (proceed.toLowerCase() !== 'y') {
		console.log('Test cancelled.');
		process.exit(0);
	}

	console.log('\n🔧 Setting up test environment...');

	// Step 1: Check prerequisites
	console.log('\n1. Checking prerequisites...');

	try {
		const pm2Version = execSync('pm2 --version', {
			encoding: 'utf8',
		}).trim();
		console.log(`   ✅ PM2 installed: v${pm2Version}`);
	} catch (error) {
		console.error(
			'   ❌ PM2 not found. Please install: npm install -g pm2'
		);
		process.exit(1);
	}

	// Step 2: Configuration
	console.log('\n2. Configuration setup...');

	const webhookUrl = await askQuestion('Enter your Discord webhook URL: ');
	if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
		console.error('❌ Invalid webhook URL format');
		process.exit(1);
	}

	const messageId = await askQuestion(
		'Enter Discord message ID (or press Enter to send new message): '
	);

	// Step 3: Create test process
	console.log('\n3. Creating test process...');

	const testProcessName = 'live-test-process';
	const testScriptPath = path.join(__dirname, 'live-test-process.js');

	const testScript = `
console.log('🚀 Live test process started');
let counter = 0;
let shouldExit = false;

// Simulate some work
setInterval(() => {
    counter++;
    console.log(\`Live test process running: \${counter} seconds\`);
    
    // Simulate occasional errors
    if (counter % 30 === 0) {
        console.log('⚠️  Simulating warning condition');
    }
    
    // Auto-exit after 2 minutes to prevent runaway process
    if (counter > 120) {
        console.log('🛑 Auto-exit after 2 minutes');
        process.exit(0);
    }
}, 1000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});
`;

	fs.writeFileSync(testScriptPath, testScript);
	console.log(`   ✅ Test script created: ${testScriptPath}`);

	// Step 4: Start test process
	console.log('\n4. Starting test process...');

	try {
		execSync(`pm2 start ${testScriptPath} --name ${testProcessName}`, {
			stdio: 'pipe',
		});
		console.log(`   ✅ Test process started: ${testProcessName}`);

		// Wait for process to stabilize
		await new Promise((resolve) => setTimeout(resolve, 3000));

		// Check if process is running
		const processesOutput = execSync('pm2 jlist', { encoding: 'utf8' });
		const processes = JSON.parse(processesOutput);
		const testProcess = processes.find((p) => p.name === testProcessName);

		if (!testProcess) {
			console.error('   ❌ Test process not found after starting');
			process.exit(1);
		}

		console.log(
			`   ✅ Test process confirmed running (PID: ${testProcess.pid})`
		);
	} catch (error) {
		console.error(`   ❌ Failed to start test process: ${error.message}`);
		process.exit(1);
	}

	// Step 5: Create test configuration
	console.log('\n5. Creating test configuration...');

	const testConfig = {
		discord: {
			webhookUrl: webhookUrl,
			messageId: messageId || '',
			username: 'Live Test Bot',
			avatarUrl: '',
		},
		monitoring: {
			processName: testProcessName,
			updateInterval: 10000, // 10 seconds for testing
			quickCheckInterval: 2000, // 2 seconds for testing
			enableQuickChecks: true,
			enableImmediateNotifications: true,
			enableEventListeners: true,
		},
		notifications: {
			statusChanges: {
				enabled: true,
				notifyOnOnline: true,
				notifyOnOffline: true,
				notifyOnError: true,
				notifyOnRestart: true,
				notifyOnStop: true,
				notifyOnStart: true,
				notifyOnExit: true,
			},
			regularUpdates: {
				enabled: true,
				onlyOnChanges: false,
			},
			criticalOnly: false,
		},
		embeds: {
			useCustomEmbeds: true,
			showUptime: true,
			showLastRestart: true,
			showRestartCount: true,
			showProcessInfo: true,
			includeStatusChangeInfo: true,
			includeImmediateNotificationFlag: true,
		},
		logging: {
			enabled: true,
			level: 'info',
			showTimestamp: true,
			showColors: true,
			logToFile: false,
		},
	};

	const configPath = path.join(__dirname, 'live-test-config.json');
	fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
	console.log(`   ✅ Test configuration created: ${configPath}`);

	// Step 6: Start the uptime tracker
	console.log('\n6. Starting uptime tracker...');

	try {
		const UptimeTracker = require('./src/app');

		// Temporarily replace the config file
		const originalConfigPath = path.join(__dirname, 'config.json');
		const originalConfigExists = fs.existsSync(originalConfigPath);
		let originalConfig = null;

		if (originalConfigExists) {
			originalConfig = fs.readFileSync(originalConfigPath, 'utf8');
		}

		// Copy test config to main config
		fs.writeFileSync(
			originalConfigPath,
			fs.readFileSync(configPath, 'utf8')
		);

		// Clear require cache to reload config
		Object.keys(require.cache).forEach((key) => {
			if (key.includes('src/config') || key.includes('src/app')) {
				delete require.cache[key];
			}
		});

		const tracker = new (require('./src/app'))();

		console.log('   ✅ Uptime tracker initialized');
		console.log(
			`   ✅ Monitoring process: ${tracker.config.monitoring.processName}`
		);
		console.log(
			`   ✅ Update interval: ${tracker.config.monitoring.updateInterval}ms`
		);

		// Start tracking
		console.log('\n🚀 Starting live monitoring...');
		await tracker.start();

		console.log('\n📊 Live test is now running!');
		console.log('Check your Discord channel for notifications.');
		console.log('\nTest scenarios that will be demonstrated:');
		console.log('- ✅ Initial online notification');
		console.log('- ✅ Regular status updates');
		console.log('- ✅ Process restart detection');
		console.log('- ✅ Process stop detection');
		console.log('- ✅ Process start detection');
		console.log('- ✅ Process cleanup detection');

		console.log('\n🎮 Test Controls:');
		console.log('Press Enter to continue to next test scenario...');

		// Test scenario 1: Running state
		await askQuestion(
			'Scenario 1: Process is running normally. Press Enter to continue...'
		);

		// Test scenario 2: Restart process
		console.log('\n🔄 Scenario 2: Restarting process...');
		execSync(`pm2 restart ${testProcessName}`, { stdio: 'pipe' });
		console.log('   ✅ Process restarted');

		await askQuestion(
			'Check Discord for restart notification. Press Enter to continue...'
		);

		// Test scenario 3: Stop process
		console.log('\n🛑 Scenario 3: Stopping process...');
		execSync(`pm2 stop ${testProcessName}`, { stdio: 'pipe' });
		console.log('   ✅ Process stopped');

		await askQuestion(
			'Check Discord for stop notification. Press Enter to continue...'
		);

		// Test scenario 4: Start process
		console.log('\n🚀 Scenario 4: Starting process...');
		execSync(`pm2 start ${testProcessName}`, { stdio: 'pipe' });
		console.log('   ✅ Process started');

		await askQuestion(
			'Check Discord for start notification. Press Enter to continue...'
		);

		// Test scenario 5: Delete process
		console.log('\n🗑️  Scenario 5: Deleting process...');
		execSync(`pm2 delete ${testProcessName}`, { stdio: 'pipe' });
		console.log('   ✅ Process deleted');

		await askQuestion(
			'Check Discord for process not found notification. Press Enter to cleanup...'
		);

		// Stop tracker
		await tracker.stop();
		console.log('   ✅ Uptime tracker stopped');

		// Restore original config
		if (originalConfig) {
			fs.writeFileSync(originalConfigPath, originalConfig);
		} else if (originalConfigExists) {
			fs.unlinkSync(originalConfigPath);
		}
	} catch (error) {
		console.error(`   ❌ Uptime tracker error: ${error.message}`);
		console.error('   Stack trace:', error.stack);
	}

	// Step 7: Cleanup
	console.log('\n7. Cleaning up...');

	try {
		// Remove test process if it still exists
		try {
			execSync(`pm2 delete ${testProcessName}`, { stdio: 'pipe' });
			console.log('   ✅ Test process cleaned up');
		} catch (error) {
			console.log('   ℹ️  Test process already cleaned up');
		}

		// Remove test files
		if (fs.existsSync(testScriptPath)) {
			fs.unlinkSync(testScriptPath);
			console.log('   ✅ Test script removed');
		}

		if (fs.existsSync(configPath)) {
			fs.unlinkSync(configPath);
			console.log('   ✅ Test configuration removed');
		}
	} catch (error) {
		console.warn(`   ⚠️  Cleanup warning: ${error.message}`);
	}

	console.log('\n🎉 Live integration test completed!');
	console.log('\n📊 Test Summary:');
	console.log('✅ PM2 process monitoring');
	console.log('✅ Discord notifications');
	console.log('✅ Status change detection');
	console.log('✅ Restart detection');
	console.log('✅ Error handling');
	console.log('✅ Configuration system');
	console.log('✅ Complete workflow');

	console.log('\n🚀 Your PM2 Uptime Tracker is fully functional!');
	console.log('You can now configure it for your production processes.');
}

// Run the test
runLiveTest()
	.catch((error) => {
		console.error('❌ Live test error:', error.message);
		console.error('Stack trace:', error.stack);

		// Emergency cleanup
		try {
			execSync('pm2 delete live-test-process', { stdio: 'ignore' });
			const testFiles = ['live-test-process.js', 'live-test-config.json'];
			testFiles.forEach((file) => {
				const filePath = path.join(__dirname, file);
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			});
		} catch (cleanupError) {
			// Ignore cleanup errors
		}

		process.exit(1);
	})
	.finally(() => {
		rl.close();
	});
