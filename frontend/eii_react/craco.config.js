const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.module.rules.forEach((rule) => {
        if (rule.enforce === 'pre' && rule.use) {
          const sourceMapLoader = rule.use.find(loader => loader.loader === 'source-map-loader');
          if (sourceMapLoader) {
            sourceMapLoader.options = {
              filterSourceMappingUrl: (url, resourcePath) => {
                if (resourcePath.includes('wgsl_reflect')) {
                  return false;
                }
                return true;
              }
            };
          }
        }
      });
      return webpackConfig;
    }
  }
};
