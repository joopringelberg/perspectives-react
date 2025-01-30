const path = require("path");
const webpack = require('webpack');

module.exports = {
  entry: path.join(__dirname, "src/perspectives-react-components.js"),
  output: {
    library: {
      type: "module" 
    },
    filename: "perspectives-react.js",
    path: path.join(__dirname, "dist"),
    sourceMapFilename: "perspectives-react.js.map" // Ensure this line is included
  },
  experiments: {
    outputModule: true // Enable output as a module
  },
  mode: "development",
  target: "web",
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ['@babel/preset-env', "@babel/preset-react"],
              plugins: [
                '@babel/plugin-syntax-dynamic-import'
              ],
              sourceMaps: true
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      __PPSTORAGELIMIT__: 10,
      __PPWARNINGLEVEL__: 5,
      __PPSTORAGEURL__: '"https://mycontexts.com/ppsfs/uploadfile"'
    })
  ],
  externals: {
    "react": "react",
    "react-dom": "react-dom",
    "react-bootstrap": "react-bootstrap",
    "@primer/octicons-react": "@primer/octicons-react",
    "prop-types": "prop-types",
    "perspectives-proxy": "perspectives-proxy",
    "pouchdb-browser": "commonjs pouchdb-browser",
    "i18next": "i18next",
  }
};
