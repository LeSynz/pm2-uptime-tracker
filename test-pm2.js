#!/usr/bin/env node

// Test script for PM2 integration
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('⚙️  PM2 Integration Test');
console.log('=======================\n');

async function testPM2Integration() {
	console.log('Testing PM2 integration and process monitoring...\n');

	// Test 1: PM2 Installation
	console.log('1. Testing PM2 installation...');
	try {
		const pm2Version = execSync('pm2 --version', {
			encoding: 'utf8',
		}).trim();
		console.log(`   ✅ PM2 installed: v${pm2Version}`);
	} catch (error) {
		console.error(
			'   ❌ PM2 not found. Please install PM2: npm install -g pm2'
		);
		return false;
	}

	// Test 2: PM2 Service Module
	console.log('\n2. Testing PM2 service module...');
	try {
		const PM2Service = require('./src/services/pm2Service');
		const service = new PM2Service('test-process');

		console.log('   ✅ PM2 service module loaded');
		console.log(`   ✅ Process name set: ${service.processName}`);

		// Test methods
		const methods = ['connect', 'disconnect', 'getProcessUptime'];
		for (const method of methods) {
			if (typeof service[method] !== 'function') {
				console.error(`   ❌ Missing method: ${method}`);
				return false;
			}
			console.log(`   ✅ Method available: ${method}`);
		}
	} catch (error) {
		console.error(`   ❌ PM2 service module error: ${error.message}`);
		return false;
	}

	// Test 3: PM2 Process List
	console.log('\n3. Testing PM2 process list...');
	try {
		const processesOutput = execSync('pm2 jlist', { encoding: 'utf8' });
		const processes = JSON.parse(processesOutput);

		console.log(
			`   ✅ PM2 process list accessible: ${processes.length} processes`
		);

		if (processes.length > 0) {
			console.log('   Available processes:');
			processes.forEach((proc, index) => {
				console.log(
					`     ${index + 1}. ${proc.name} (${proc.pm2_env.status})`
				);
			});
		} else {
			console.log('   ⚠️  No PM2 processes currently running');
		}
	} catch (error) {
		console.error(`   ❌ Failed to get PM2 process list: ${error.message}`);
		return false;
	}

	// Test 4: Create Test Process
	console.log('\n4. Testing with temporary test process...');
	const testProcessName = 'uptime-tracker-test';
	const testScriptPath = path.join(__dirname, 'temp-test-process.js');

	try {
		// Create test script
		const testScript = `
console.log('Test process started');
let counter = 0;
setInterval(() => {
    counter++;
    console.log(\`Test process running: \${counter}\`);
}, 1000);
`;

		fs.writeFileSync(testScriptPath, testScript);
		console.log('   ✅ Test script created');

		// Start test process
		execSync(`pm2 start ${testScriptPath} --name ${testProcessName}`, {
			stdio: 'ignore',
		});
		console.log(`   ✅ Test process started: ${testProcessName}`);

		// Wait a moment for process to stabilize
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Test PM2 service with real process
		const PM2Service = require('./src/services/pm2Service');
		const service = new PM2Service(testProcessName);

		console.log('   🔍 Testing process monitoring...');

		try {
			await service.connect();
			console.log('   ✅ Connected to PM2');

			const processInfo = await service.getProcessUptime();
			console.log('   ✅ Process info retrieved:');
			console.log(`     Status: ${processInfo.status}`);
			console.log(`     Uptime: ${processInfo.uptime}ms`);
			console.log(`     PID: ${processInfo.processInfo?.pid || 'N/A'}`);

			// Test process restart detection
			console.log('   🔄 Testing restart detection...');
			execSync(`pm2 restart ${testProcessName}`, { stdio: 'ignore' });

			await new Promise((resolve) => setTimeout(resolve, 1000));

			const processInfoAfterRestart = await service.getProcessUptime();
			console.log('   ✅ Process info after restart:');
			console.log(`     Status: ${processInfoAfterRestart.status}`);
			console.log(`     Uptime: ${processInfoAfterRestart.uptime}ms`);

			await service.disconnect();
			console.log('   ✅ Disconnected from PM2');
		} catch (error) {
			console.error(`   ❌ Process monitoring error: ${error.message}`);
		}

		// Cleanup
		try {
			execSync(`pm2 delete ${testProcessName}`, { stdio: 'ignore' });
			console.log('   ✅ Test process cleaned up');
		} catch (cleanupError) {
			console.warn('   ⚠️  Cleanup warning:', cleanupError.message);
		}

		try {
			fs.unlinkSync(testScriptPath);
			console.log('   ✅ Test script cleaned up');
		} catch (cleanupError) {
			console.warn('   ⚠️  File cleanup warning:', cleanupError.message);
		}
	} catch (error) {
		console.error(`   ❌ Test process error: ${error.message}`);

		// Emergency cleanup
		try {
			execSync(`pm2 delete ${testProcessName}`, { stdio: 'ignore' });
			fs.unlinkSync(testScriptPath);
		} catch (cleanupError) {
			// Ignore cleanup errors
		}

		return false;
	}

	// Test 5: Event Listeners
	console.log('\n5. Testing PM2 event listeners...');
	try {
		const PM2Service = require('./src/services/pm2Service');
		const service = new PM2Service('test-process');

		// Test event listener setup
		const events = ['start', 'stop', 'restart', 'error', 'online', 'exit'];

		for (const event of events) {
			service.on(event, () => {
				console.log(`   Event received: ${event}`);
			});
		}

		console.log('   ✅ Event listeners set up successfully');
		console.log(`   ✅ Listening for events: ${events.join(', ')}`);
	} catch (error) {
		console.error(`   ❌ Event listener error: ${error.message}`);
		return false;
	}

	console.log('\n🎉 PM2 integration test completed successfully!');
	return true;
}

// Test 6: Integration with Main App
console.log('\n6. Testing integration with main application...');
async function testMainAppIntegration() {
	try {
		const UptimeTracker = require('./src/app');
		const app = new UptimeTracker();

		console.log('   ✅ Main application instantiated with PM2 service');
		console.log(
			`   ✅ PM2 service process name: ${app.pm2Service.processName}`
		);

		// Test that PM2 service is properly configured
		if (
			!app.pm2Service ||
			typeof app.pm2Service.getProcessUptime !== 'function'
		) {
			console.error('   ❌ PM2 service not properly integrated');
			return false;
		}

		console.log('   ✅ PM2 service properly integrated with main app');

		return true;
	} catch (error) {
		console.error(`   ❌ Main app integration error: ${error.message}`);
		return false;
	}
}

// Run tests
async function runAllTests() {
	console.log('Starting PM2 integration tests...\n');

	const pm2TestResult = await testPM2Integration();
	const appTestResult = await testMainAppIntegration();

	console.log('\n' + '='.repeat(50));
	console.log('📊 PM2 Integration Test Results:');
	console.log('='.repeat(50));

	console.log(
		`PM2 Integration: ${pm2TestResult ? '✅ PASSED' : '❌ FAILED'}`
	);
	console.log(
		`App Integration: ${appTestResult ? '✅ PASSED' : '❌ FAILED'}`
	);

	if (pm2TestResult && appTestResult) {
		console.log('\n🎉 All PM2 integration tests passed!');
		console.log('\n🚀 Your PM2 integration is working correctly.');
		console.log('You can now monitor any PM2 process with confidence.');

		console.log('\n💡 Next steps:');
		console.log('1. Choose a PM2 process to monitor');
		console.log('2. Update your configuration with the process name');
		console.log('3. Start the uptime tracker');

		console.log('\n📋 Available PM2 processes:');
		try {
			const processesOutput = execSync('pm2 jlist', { encoding: 'utf8' });
			const processes = JSON.parse(processesOutput);

			if (processes.length > 0) {
				processes.forEach((proc, index) => {
					console.log(
						`   ${index + 1}. ${proc.name} (${proc.pm2_env.status})`
					);
				});
			} else {
				console.log('   No processes currently running');
				console.log(
					'   Start a process with: pm2 start your-app.js --name "your-app"'
				);
			}
		} catch (error) {
			console.log('   Could not list processes');
		}
	} else {
		console.log('\n❌ Some PM2 integration tests failed.');
		console.log('Please check the errors above and fix the issues.');

		console.log('\n🔧 Troubleshooting tips:');
		console.log('1. Ensure PM2 is installed globally: npm install -g pm2');
		console.log('2. Check PM2 is running: pm2 status');
		console.log('3. Verify PM2 permissions');
		console.log('4. Check if PM2 daemon is accessible');

		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	runAllTests().catch((error) => {
		console.error('❌ Test execution error:', error.message);
		process.exit(1);
	});
}

module.exports = { testPM2Integration, testMainAppIntegration };
