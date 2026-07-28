// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the whole monorepo so changes in packages/* trigger reloads.
config.watchFolders = [monorepoRoot];

// 2. Resolve modules from the app first, then the monorepo root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force a single React copy — this app's React 19 — even though `react-native`
//    is hoisted to the monorepo root next to the web app's React 18. Without this,
//    the hoisted react-native would resolve React 18 → invalid-hook / renderer
//    mismatch. Only React needs pinning; react-native has a single (correct) copy.
const reactSingletons = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
};
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const [name, dir] of Object.entries(reactSingletons)) {
    if (moduleName === name || moduleName.startsWith(name + '/')) {
      return context.resolveRequest(
        context,
        dir + moduleName.slice(name.length),
        platform,
      );
    }
  }
  return (defaultResolveRequest ?? context.resolveRequest)(
    context,
    moduleName,
    platform,
  );
};

module.exports = config;
