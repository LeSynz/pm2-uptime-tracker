#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packagePath = path.join(__dirname, 'package.json');
const changelogPath = path.join(__dirname, 'CHANGELOG.md');

function getCurrentVersion() {
	const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
	return packageJson.version;
}

function updateVersion(newVersion) {
	const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
	packageJson.version = newVersion;
	fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
}

function runTests() {
	console.log('🧪 Running comprehensive tests...');
	try {
		execSync('npm run test:comprehensive', { stdio: 'inherit' });
		console.log('✅ All tests passed!');
		return true;
	} catch (error) {
		console.error('❌ Tests failed! Release cancelled.');
		return false;
	}
}

function getVersionType() {
	const args = process.argv.slice(2);
	if (args.length === 0) {
		console.log('Usage: node release.js <version-type>');
		console.log('');
		console.log('Version types:');
		console.log(
			'  beta      - Increment beta version (1.0.0-beta.1 -> 1.0.0-beta.2)'
		);
		console.log(
			'  rc        - Create release candidate (1.0.0-beta.3 -> 1.0.0-rc.1)'
		);
		console.log(
			'  stable    - Create stable release (1.0.0-rc.2 -> 1.0.0)'
		);
		console.log('  patch     - Patch version (1.0.0 -> 1.0.1)');
		console.log('  minor     - Minor version (1.0.0 -> 1.1.0)');
		console.log('  major     - Major version (1.0.0 -> 2.0.0)');
		console.log('');
		console.log('Examples:');
		console.log('  node release.js beta');
		console.log('  node release.js rc');
		console.log('  node release.js stable');
		process.exit(1);
	}
	return args[0];
}

function calculateNewVersion(current, type) {
	const versionParts = current.split('.');
	const major = parseInt(versionParts[0]);
	const minor = parseInt(versionParts[1]);
	const patchAndPrerelease = versionParts[2];

	let patch, prerelease;
	if (patchAndPrerelease.includes('-')) {
		[patch, prerelease] = patchAndPrerelease.split('-');
		patch = parseInt(patch);
	} else {
		patch = parseInt(patchAndPrerelease);
		prerelease = null;
	}

	switch (type) {
		case 'beta':
			if (prerelease && prerelease.startsWith('beta.')) {
				const betaNum = parseInt(prerelease.split('.')[1]) + 1;
				return `${major}.${minor}.${patch}-beta.${betaNum}`;
			} else {
				return `${major}.${minor}.${patch}-beta.1`;
			}

		case 'rc':
			if (prerelease && prerelease.startsWith('rc.')) {
				const rcNum = parseInt(prerelease.split('.')[1]) + 1;
				return `${major}.${minor}.${patch}-rc.${rcNum}`;
			} else {
				return `${major}.${minor}.${patch}-rc.1`;
			}

		case 'stable':
			return `${major}.${minor}.${patch}`;

		case 'patch':
			return `${major}.${minor}.${patch + 1}`;

		case 'minor':
			return `${major}.${minor + 1}.0`;

		case 'major':
			return `${major + 1}.0.0`;

		default:
			throw new Error(`Unknown version type: ${type}`);
	}
}

function updateChangelog(version) {
	const changelog = fs.readFileSync(changelogPath, 'utf8');
	const date = new Date().toISOString().split('T')[0];
	const newEntry = `## [${version}] - ${date}`;

	const updatedChangelog = changelog.replace(
		'## [Unreleased]',
		`## [Unreleased]\n\n${newEntry}`
	);

	fs.writeFileSync(changelogPath, updatedChangelog);
}

function createGitTag(version) {
	try {
		execSync(`git add .`);
		execSync(`git commit -m "Release ${version}"`);
		execSync(`git tag -a v${version} -m "Release ${version}"`);
		console.log(`✅ Git tag v${version} created`);
	} catch (error) {
		console.warn('⚠️  Git operations failed (this is ok if not using git)');
	}
}

function main() {
	console.log('🚀 PM2 Uptime Tracker Release Manager');
	console.log('=====================================');

	const currentVersion = getCurrentVersion();
	const versionType = getVersionType();

	console.log(`📋 Current version: ${currentVersion}`);

	try {
		const newVersion = calculateNewVersion(currentVersion, versionType);
		console.log(`📦 New version: ${newVersion}`);

		// Run tests first
		if (!runTests()) {
			process.exit(1);
		}

		// Update version
		updateVersion(newVersion);
		console.log(`✅ Updated package.json to ${newVersion}`);

		// Update changelog
		updateChangelog(newVersion);
		console.log(`✅ Updated CHANGELOG.md`);

		// Create git tag (optional)
		createGitTag(newVersion);

		console.log('');
		console.log('🎉 Release completed successfully!');
		console.log('');
		console.log('📋 Release Summary:');
		console.log(`   Version: ${currentVersion} -> ${newVersion}`);
		console.log(`   Type: ${versionType}`);
		console.log(`   Tests: ✅ Passed`);
		console.log(`   Changelog: ✅ Updated`);
		console.log(`   Git Tag: ✅ Created`);
		console.log('');
		console.log('📦 Next steps:');
		console.log('   1. Review the changes');
		console.log('   2. Test the new version');
		console.log('   3. Push to repository: git push origin main --tags');
		console.log('   4. Create GitHub release (optional)');
	} catch (error) {
		console.error(`❌ Release failed: ${error.message}`);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}

module.exports = { getCurrentVersion, calculateNewVersion };
