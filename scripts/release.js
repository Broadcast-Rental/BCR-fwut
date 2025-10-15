#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const releaseType = process.argv[2]; // 'patch', 'minor', 'major'

if (!['patch', 'minor', 'major'].includes(releaseType)) {
  console.error('Usage: node scripts/release.js <patch|minor|major>');
  console.error('  patch: Bug fixes (1.0.0 -> 1.0.1)');
  console.error('  minor: New features (1.0.0 -> 1.1.0)');
  console.error('  major: Breaking changes (1.0.0 -> 2.0.0)');
  process.exit(1);
}

try {
  console.log(`🚀 Creating ${releaseType} release...`);
  
  // Update version in package.json
  execSync(`npm version ${releaseType}`, { stdio: 'inherit' });
  
  // Read the new version
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const newVersion = packageJson.version;
  
  console.log(`✅ Version updated to ${newVersion}`);
  
  // Create git tag
  const tagName = `v${newVersion}`;
  execSync(`git tag ${tagName}`, { stdio: 'inherit' });
  
  console.log(`✅ Git tag created: ${tagName}`);
  
  // Push changes and tags
  execSync('git push origin main', { stdio: 'inherit' });
  execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
  
  console.log(`✅ Changes and tag pushed to GitHub`);
  console.log(`🎉 Release ${tagName} triggered!`);
  console.log(`📋 Check the Actions tab in GitHub to monitor the build progress.`);
  
} catch (error) {
  console.error('❌ Release failed:', error.message);
  process.exit(1);
}
