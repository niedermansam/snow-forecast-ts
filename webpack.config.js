const path = require('path');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
          test:/\.(s*)css$/,
          use:['style-loader','css-loader', 'sass-loader']
       },
      {
        test: /\.tsx?$/,
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
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};