const path = require('path')
const webpack = require('webpack')
const { VueLoaderPlugin } = require('vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')

// Production webpack build → bundled + minified (Terser). The nested API is not obvious from the
// minified bundle; you discover it by using the app or reading the bundle.
module.exports = {
  mode: 'production',
  entry: './src/main.js',
  output: { path: path.resolve(__dirname, 'dist'), filename: 'assets/app.[contenthash].js', publicPath: '/', clean: true },
  resolve: { extensions: ['.js', '.vue'], alias: { vue$: 'vue/dist/vue.runtime.esm-bundler.js' } },
  module: {
    rules: [
      { test: /\.vue$/, loader: 'vue-loader' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({ template: './index.html' }),
    new webpack.DefinePlugin({ __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false' }),
  ],
  performance: { hints: false },
}
