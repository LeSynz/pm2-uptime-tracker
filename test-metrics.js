#!/usr/bin/env node

const axios = require('axios');
const logger = require('./src/utils/logger');

console.log('🎯 PM2 Uptime Tracker - Metrics Test');
console.log('====================================');

async function testMetricsEndpoints() {
	const baseUrl = 'http://localhost:3000';

	const endpoints = [
		{ path: '/', name: 'Service Info' },
		{ path: '/health', name: 'Health Check' },
		{ path: '/metrics/json', name: 'JSON Metrics' },
		{ path: '/metrics/summary', name: 'Summary Metrics' },
		{ path: '/metrics/process', name: 'Process Metrics' },
	];

	console.log('\n📊 Testing Metrics Endpoints:');
	console.log('------------------------------');

	for (const endpoint of endpoints) {
		try {
			console.log(`\n🔍 Testing ${endpoint.name} (${endpoint.path})`);
			const response = await axios.get(`${baseUrl}${endpoint.path}`, {
				timeout: 5000,
			});

			console.log(`   ✅ Status: ${response.status}`);
			console.log(
				`   📄 Response:`,
				JSON.stringify(response.data, null, 2)
			);
		} catch (error) {
			if (error.code === 'ECONNREFUSED') {
				console.log(
					`   ❌ Connection refused - metrics server not running`
				);
				console.log(
					`   💡 Enable metrics in config and restart the tracker`
				);
			} else {
				console.log(`   ❌ Error: ${error.message}`);
			}
		}
	}

	// Test Prometheus endpoint
	console.log('\n🔍 Testing Prometheus Metrics (/metrics)');
	try {
		const response = await axios.get(`${baseUrl}/metrics`, {
			timeout: 5000,
		});

		console.log(`   ✅ Status: ${response.status}`);
		console.log(`   📄 Content-Type: ${response.headers['content-type']}`);
		console.log(`   📊 Sample metrics:`);

		// Show first 10 lines of Prometheus format
		const lines = response.data.split('\n').slice(0, 10);
		lines.forEach((line) => {
			if (line.trim()) {
				console.log(`      ${line}`);
			}
		});

		if (response.data.split('\n').length > 10) {
			console.log(
				`      ... and ${
					response.data.split('\n').length - 10
				} more lines`
			);
		}
	} catch (error) {
		if (error.code === 'ECONNREFUSED') {
			console.log(
				`   ❌ Connection refused - metrics server not running`
			);
		} else {
			console.log(`   ❌ Error: ${error.message}`);
		}
	}
}

async function demonstrateMetrics() {
	console.log('\n🚀 Metrics Server Demo');
	console.log('======================');

	console.log('\n📋 How to enable metrics:');
	console.log('1. Run: npm run setup');
	console.log('2. Enable metrics endpoint when prompted');
	console.log('3. Choose port (default: 3000)');
	console.log('4. Start tracker: npm start');
	console.log('5. Visit: http://localhost:3000');

	console.log('\n🎯 Available Endpoints:');
	console.log('- http://localhost:3000/          - Service information');
	console.log('- http://localhost:3000/health    - Health check (JSON)');
	console.log('- http://localhost:3000/metrics   - Prometheus format');
	console.log('- http://localhost:3000/metrics/json - JSON metrics');
	console.log('- http://localhost:3000/metrics/summary - Summary stats');
	console.log('- http://localhost:3000/metrics/process - Process details');

	console.log('\n📊 Use Cases:');
	console.log('- Grafana dashboards');
	console.log('- Prometheus monitoring');
	console.log('- Custom integrations');
	console.log('- Health checks');
	console.log('- API monitoring');

	console.log('\n🔍 Testing current metrics server...');
	await testMetricsEndpoints();
}

async function showConfiguration() {
	console.log('\n⚙️  Current Configuration:');
	console.log('---------------------------');

	try {
		const { fullConfig } = require('./src/config');

		console.log(`📊 Metrics Enabled: ${fullConfig.features.enableMetrics}`);
		console.log(`🔌 Metrics Port: ${fullConfig.features.metricsPort}`);
		console.log(
			`🏥 Health Check Enabled: ${fullConfig.features.enableHealthcheck}`
		);
		console.log(
			`🔌 Health Check Port: ${fullConfig.features.healthcheckPort}`
		);

		if (fullConfig.features.enableMetrics) {
			console.log(`\n✅ Metrics are enabled!`);
			console.log(
				`   Visit: http://localhost:${fullConfig.features.metricsPort}`
			);
		} else {
			console.log(`\n❌ Metrics are disabled`);
			console.log(`   Run 'npm run setup' to enable them`);
		}
	} catch (error) {
		console.log(`Error loading configuration: ${error.message}`);
	}
}

async function main() {
	await showConfiguration();
	await demonstrateMetrics();

	console.log('\n🎉 Metrics test completed!');
	console.log('💡 For live testing, start the tracker with: npm start');
}

if (require.main === module) {
	main().catch(console.error);
}

module.exports = { testMetricsEndpoints };
