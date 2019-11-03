const path = require('path');
const autoprefixer = require('autoprefixer');

module.exports = {
  entry: ['./src/index.ts', './src/app.scss'],
  module: {
    rules: [
      {
        test: /\.(s*)css$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'bundle.css',
            },
          },
          { loader: 'extract-loader' },
          { loader: 'css-loader' },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [autoprefixer()]
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: ['./node_modules'],
              }
            },
          }
        ],
      },
      { test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg)$/, 
        loader: 'url-loader?limit=8192'
      }
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js', '.scss', '.css' ],
  },
  output: {
    filename: '[name].js',
    chunkFilename: '[id].js',
    path: path.resolve(__dirname, 'dist'),
  },
};