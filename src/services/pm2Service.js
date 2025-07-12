const pm2 = require('pm2');
const logger = require('../utils/logger');

class PM2Service {
	constructor(processName) {
		this.processName = processName;
	}

	async getProcessUptime() {
		return new Promise((resolve, reject) => {
			pm2.connect((err) => {
				if (err) {
					logger.error(`Error connecting to PM2: ${err.message}`);
					reject(err);
					return;
				}

				pm2.describe(this.processName, (err, processDescription) => {
					if (err) {
						logger.error(
							`Error describing process: ${err.message}`
						);
						pm2.disconnect();
						reject(err);
						return;
					}

					if (processDescription.length === 0) {
						const error = new Error(
							`Process ${this.processName} not found.`
						);
						logger.error(error.message);
						pm2.disconnect();
						reject(error);
						return;
					}

					const processInfo = processDescription[0];
					const startTime =
						processInfo.pm2_env.pm_uptime ||
						processInfo.pm2_env.created_at;
					const uptime = startTime ? Date.now() - startTime : 0;
					const lastRestart = startTime ? new Date(startTime) : null;

					pm2.disconnect();
					resolve({
						uptime,
						status: processInfo.pm2_env.status,
						lastRestart,
						processInfo: processInfo,
					});
				});
			});
		});
	}
}

module.exports = PM2Service;
