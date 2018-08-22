/* eslint-env node */
module.exports = config => {
  config.set({
    basePath: './',

    browsers: ['ChromeHeadless'],

    frameworks: ['jasmine'],

    reporters: ['coverage', 'progress'],

    files: [
      './src/templiteral.js',
      { pattern: 'test/*.test.js', watched: false }
    ],

    preprocessors: {
      'src/**/*.js': ['rollup', 'coverage'],
      'test/*.test.js': ['rollup']
    },

    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    },

    coverageIstanbulReporter: {
      reports: ['html', 'text-summary']
    },

    rollupPreprocessor: {
      format: 'iife',
      name: 'templit',
      output: {
        format: 'es',
        name: 'templit'
      }
    }, 

    singleRun: true
  });
};
