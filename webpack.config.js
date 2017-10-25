const { join } = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const { isProd, noop } = require('./utils');

module.exports = {
  entry: './src/templit.js',
  output: {
    filename: 'dist/templit.min.js'
  },
  devServer: {
    contentBase: join(__dirname, 'dist'),
    compress: true,
    hot: true,
    port: 4321
  },
  plugins: [
    new UglifyJSPlugin(),
    ifProd(noop, new HtmlWebpackPlugin({
      template: './index.html',
      filename: './index.html',
      hash: false,
      inject: true,
      compile: true,
      favicon: false,
      minify: false,
      cache: true,
      showErrors: true,
      chunks: 'all',
      excludeChunks: [],
      title: 'Templit test',
      xhtml: true
    }))
  ]
};
