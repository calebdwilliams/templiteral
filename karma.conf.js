const { join } = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

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
      'test/*.test.js': ['webpack']
    },

    webpack: {
      output: {
        filename: 'dist/templit.min.js'
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            use: ['istanbul-instrumenter-loader', {
              loader: 'babel-loader',
              options: { presets: ['env'] }
            }],
            include: /scripts/
          }
        ]
      },
      plugins: [
        new UglifyJSPlugin()
      ]
    }

  });
};
