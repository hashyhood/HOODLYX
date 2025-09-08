const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = getDefaultConfig(__dirname);

const customConfig = {
  resolver: {
    sourceExts: [...config.resolver.sourceExts, 'cjs'],
  },
};

module.exports = mergeConfig(config, customConfig);
