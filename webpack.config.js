const path = require("path");
const webpack = require('webpack');

module.exports = {
  entry: path.join(__dirname, "src/perspectives-react-components.js"),
  output: {
    library: "perspectives-react",
    libraryTarget: "umd",
    filename: "perspectives-react.js",
    path: path.join(__dirname, "dist"),
    sourceMapFilename: "perspectives-react.js.map" // Ensure this line is included
  },
  mode: "development",
  target: "web",
  devtool: 'source-map', // Ensure this line is included
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
              sourceMaps: true // Ensure this line is included
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
    "react": {
      amd: "react",
      commonjs: "react",
      commonjs2: "react",
      root: "react"
    },
    "react-dom": {
      amd: "react-dom",
      commonjs: "react-dom",
      commonjs2: "react-dom",
      root: "react-dom"
    },
    "react-bootstrap": {
      amd: "react-bootstrap",
      commonjs: "react-bootstrap",
      commonjs2: "react-bootstrap",
      root: "react-bootstrap"
    },
    "@primer/octicons-react": {
      amd: "@primer/octicons-react",
      commonjs: "@primer/octicons-react",
      commonjs2: "@primer/octicons-react",
      root: "@primer/octicons-react"
    },
    "prop-types": {
      amd: "prop-types",
      commonjs: "prop-types",
      commonjs2: "prop-types",
      root: "prop-types"
    },
    "perspectives-proxy": {
      amd: "perspectives-proxy",
      commonjs: "perspectives-proxy",
      commonjs2: "perspectives-proxy",
      root: "perspectives-proxy"
    },
    "pouchdb-browser": "commonjs pouchdb-browser",
    "i18next": {
      amd: "i18next",
      commonjs: "i18next",
      commonjs2: "i18next",
      root: "i18next"
    }
  }
};
