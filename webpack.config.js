const path = require('path');

module.exports = {
  target: 'node',
  entry: './src/compiler.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'compiler.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development',
};
