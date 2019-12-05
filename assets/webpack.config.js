const path = require('path');
const glob = require('glob');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
// const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = (env, options) => ({
  optimization: {
    minimizer: [
      new UglifyJsPlugin({ cache: true, parallel: true, sourceMap: false }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  entry: {
    '/app': glob.sync('./vendor/**/*.js').concat(['./js/app.js']),
    // Package each language's worker and give these filenames in `getWorkerUrl`
    "/editor.worker": './node_modules/monaco-editor/esm/vs/editor/editor.worker.js',
    "/json.worker": './node_modules/monaco-editor/esm/vs/language/json/json.worker',
    "/css.worker": './node_modules/monaco-editor/esm/vs/language/css/css.worker',
    "/html.worker": './node_modules/monaco-editor/esm/vs/language/html/html.worker',
    "/ts.worker": './node_modules/monaco-editor/esm/vs/language/typescript/ts.worker',

    // './js/app.js': glob.sync('./vendor/**/*.js').concat(['./js/app.js']),
    // // Package each language's worker and give these filenames in `getWorkerUrl`
    // "./js/editor.worker": './node_modules/monaco-editor/esm/vs/editor/editor.worker.js',
    // "./js/json.worker": './node_modules/monaco-editor/esm/vs/language/json/json.worker',
    // "./js/css.worker": './node_modules/monaco-editor/esm/vs/language/css/css.worker',
    // "./js/html.worker": './node_modules/monaco-editor/esm/vs/language/html/html.worker',
    // "./js/ts.worker": './node_modules/monaco-editor/esm/vs/language/typescript/ts.worker',
  },
  output: {
    chunkFilename: '[name].[chunkHash].js',
    filename: '[name].js',
    path: path.resolve(__dirname, '../priv/static/js'),
    publicPath: '/js/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: '../css/[name].css' }),
    new CopyWebpackPlugin([{ from: 'static/', to: '../' }]),
    // new MonacoWebpackPlugin()
  ]
});
