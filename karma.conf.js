const { join } = require('path');

module.exports = config => {
  config.set({
    basePath: './',

    browsers: ['ChromeHeadless'],

    frameworks: ['jasmine'],

    reporters: ['progress', 'coverage-istanbul'],

    files: [
      { pattern: 'test/*.test.js', watched: false }
    ],

    preprocessors: {
      'test/*.test.js': ['rollup']
    },

    rollupPreprocessor: {
			format: 'es',
			sourcemap: 'inline'
		}
  });
};
