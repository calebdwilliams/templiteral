const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: './scripts/templit.js',
  output: {
    filename: 'dist/templit.min.js'
  },
  plugins: [
    new UglifyJSPlugin()
  ]
};
