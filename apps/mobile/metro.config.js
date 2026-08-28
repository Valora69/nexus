// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch every workspace package (needed for @repo/shared live edits).
config.watchFolders = [workspaceRoot];

// Resolve project node_modules FIRST — mobile must pick up its own React
// (RN pins) and never accidentally hoist web's React 18.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
