/* eslint-disable */
const webpack = require('webpack');
const { getConfig, dev } = require('./webpack.config.base');
const { join } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const postcssPresetEnv = require('postcss-preset-env');
const postcssMixins = require('postcss-mixins');
/* eslint-enable */

const PORT = 4444;

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
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                modules: true,
                camelCase: true,
                importLoaders: 1,
                localIdentName: '[name]--[local]--[hash:base64:5]',
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                plugins: () => [postcssMixins(), postcssPresetEnv()],
              },
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
