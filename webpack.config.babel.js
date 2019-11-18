/* eslint-env node */
/* eslint-disable import/no-extraneous-dependencies */

import path from 'path';
import dotenv from 'dotenv-safe';
import webpack from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import HtmlPlugin from 'html-webpack-plugin';

dotenv.load({ allowEmptyValues: true });

const DEBUG = process.env.NODE_ENV !== 'production';
const HUSKAR_API_URL = process.env.HUSKAR_API_URL || '';
const HUSKAR_PUBLIC_HOST = process.env.HUSKAR_PUBLIC_HOST || undefined;

export default {
  mode: DEBUG ? 'development' : 'production',
  entry: {
    index: ['./src/index.jsx'],
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name]-[hash:6].js',
    publicPath: process.env.HUSKAR_CDN_URL || '/',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: ['babel-loader'],
        include: [
          path.resolve(__dirname, './src'),
          path.resolve(__dirname, './node_modules/thrift-parser'),
        ],
      },
      {
        test: /\.s[ca]ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader?sourceMap&modules=global',
          'postcss-loader?sourceMap',
          'sass-loader?sourceMap',
        ],
        include: path.resolve(__dirname, './src'),
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.(otf|eot|svg|ttf|woff|woff2).*$/,
        use: ['url-loader?limit=8192&name=font-[hash:6].[ext]'],
      },
    ],
  },
  resolve: {
    modules: [
      path.resolve(__dirname, './src'),
      'node_modules',
    ],
    extensions: ['.js', '.jsx'],
  },
  optimization: {
    minimize: !DEBUG,
    minimizer: [
      new TerserPlugin(),
      new OptimizeCssAssetsPlugin(),
    ],
    splitChunks: {
      chunks: 'async',
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'commons',
          chunks: 'all',
          priority: -10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
      HUSKAR_SENTRY_DSN: '',
      HUSKAR_RELEASE_ID: '',
      HUSKAR_MONITOR_URL: '',
      HUSKAR_AMPQ_DASHBOARD_URL: '',
      HUSKAR_ES_DASHBOARD_URL: '',
      HUSKAR_FEATURE_LIST: 'stateswitch',
      HUSKAR_EZONE_LIST: 'global,alta1,altb1',
      HUSKAR_DEFAULT_CLUSTER: '',
      HUSKAR_CLUSTER_SPEC_URL: '',
      HUSKAR_ROUTE_EZONE_CLUSTER_LIST: ' ',
      HUSKAR_READ_ONLY_EXCLUSIVE_PATHS: '',
      HUSKAR_ROUTE_ADMIN_ONLY_EZONE: '',
    }),
    new MiniCssExtractPlugin({
      filename: '[name]-[hash:6].css',
      chunkFilename: '[id]-[hash:6].css',
    }),
    new HtmlPlugin({
      filename: 'index.html',
      template: './src/index.html',
      favicon: './src/favicon.png',
      inject: 'body',
    }),
  ].filter(x => x),
  devtool: 'source-map',
  devServer: {
    contentBase: path.resolve(__dirname, './dist'),
    historyApiFallback: {
      disableDotRule: true,
    },
    public: HUSKAR_PUBLIC_HOST,
    allowedHosts: ['.test', '.local'],
    overlay: true,
    proxy: {
      '/api': {
        target: HUSKAR_API_URL,
        changeOrigin: true,
        onProxyReq: (proxyReq) => {
          proxyReq.setHeader('X-FrontEnd-Name', 'huskar.console');
        },
      },
    },
  },
};
