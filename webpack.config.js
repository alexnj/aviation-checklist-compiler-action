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
      { test: /\.afm$/, loader: 'raw-loader'}
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
			fs: 'pdfkit/js/virtual-fs.js'
		}
  },
  output: {
    filename: 'compiler.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development',
};
