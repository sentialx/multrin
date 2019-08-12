/* eslint-disable */
const webpack = require('webpack');
const { getConfig, dev } = require('./webpack.config.base');
const { join, resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
/* eslint-enable */

const PORT = 4444;
const INCLUDE = join(__dirname, 'src');

const getHtml = (scope, name) => {
  return new HtmlWebpackPlugin({
    title: 'Multrin',
    template: 'static/pages/app.html',
    filename: `${name}.html`,
    chunks: [`vendor.${scope}`, name],
  });
};

const applyEntries = (scope, config, entries) => {
  for (const entry of entries) {
    config.entry[entry] = [`./src/renderer/${entry}`];
    config.plugins.push(getHtml(scope, entry));

    if (dev) {
      config.entry[entry].unshift('react-hot-loader/patch');
    }
  }
};

const getBaseConfig = name => {
  const config = {
    plugins: [
      new HardSourceWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
    ],

    output: {},
    entry: {},

    module: {
      rules: [
        {
          test: /\.(png|gif|jpg|woff2|ttf|svg)$/,
          include: INCLUDE,
          use: ['file-loader'],
        },
        {
          test: /\.scss$/,
          use: [
            'css-hot-loader',
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: dev,
                localsConvention: 'camelCase',
                modules: {
                  localIdentName: '[local]--[hash:base64:5]',
                },
              },
            },
            {
              loader: 'sass-loader',
            },
          ],
        },
      ],
    },

    optimization: {
      splitChunks: {
        cacheGroups: {
          vendor: {
            chunks: 'initial',
            name: `vendor.${name}`,
            test: `vendor.${name}`,
            enforce: true,
          },
        },
      },
    },
  };

  config.entry[`vendor.${name}`] = [
    'react',
    'react-dom',
    'mobx',
    'mobx-react-lite',
    'styled-components',
  ];

  return config;
};

const appConfig = getConfig(getBaseConfig('app'), {
  target: 'electron-renderer',

  devServer: {
    contentBase: join(__dirname, 'build'),
    port: PORT,
    hot: true,
    inline: true,
    disableHostCheck: true,
  },
});

applyEntries('app', appConfig, ['app']);

module.exports = [appConfig];
