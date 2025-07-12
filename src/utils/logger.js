const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
};

function log(message, level = 'info') {
	const timestamp = new Date().toISOString();
	const prefix = `[${timestamp}]`;

	switch (level) {
		case 'error':
			console.error(
				`${colors.red}${prefix} ERROR: ${message}${colors.reset}`
			);
			break;
		case 'warn':
			console.warn(
				`${colors.yellow}${prefix} WARN: ${message}${colors.reset}`
			);
			break;
		case 'success':
			console.log(
				`${colors.green}${prefix} SUCCESS: ${message}${colors.reset}`
			);
			break;
		case 'info':
		default:
			console.log(
				`${colors.blue}${prefix} INFO: ${message}${colors.reset}`
			);
			break;
	}
}

module.exports = {
	log,
	error: (message) => log(message, 'error'),
	warn: (message) => log(message, 'warn'),
	success: (message) => log(message, 'success'),
	info: (message) => log(message, 'info'),
};
