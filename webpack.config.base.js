/* eslint-disable */
const { resolve } = require('path');
const merge = require('webpack-merge');
const createStyledComponentsTransformer = require('typescript-plugin-styled-components').default;
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
/* eslint-enable */

const INCLUDE = resolve(__dirname, 'src');

const dev = process.env.ENV === 'dev';

const styledComponentsTransformer = createStyledComponentsTransformer({
  minify: true,
  displayName: dev,
});

function getExternals(externals) {
  const res = {};
  for (const e of externals) {
    res[e] = `require('${e}')`;
  }
  return res;
}

const config = {
  mode: dev ? 'development' : 'production',

  devtool: dev ? 'eval-source-map' : 'none',

  plugins: [],

  output: {
    path: resolve(__dirname, 'build'),
    filename: '[name].bundle.js',
    libraryTarget: 'var',
  },

  module: {
    rules: [
      {
        test: /\.tsx|ts$/,
        use: [
          'cache-loader',
          {
            loader: 'ts-loader',
            options: {
              experimentalWatchApi: true,
              transpileOnly: true,
              getCustomTransformers: () => ({
                before: [styledComponentsTransformer],
              }),
            },
          },
        ],

        include: INCLUDE,
      },
      {
        test: /\.node$/,
        loader: 'awesome-node-loader',
        options: {
          name: '[contenthash].[ext]',
        },
      },
    ],
  },

  node: {
    __dirname: false,
    __filename: false,
  },

  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx', '.tsx', '.ts', '.json'],
    alias: {
      '~': INCLUDE,
    },
  },

  externals: getExternals(['iohook']),
};

if (dev) {
  config.plugins.push(new ForkTsCheckerWebpackPlugin());
}

function getConfig(...cfg) {
  return merge(config, ...cfg);
}

module.exports = { getConfig, dev };
