import webpack from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyPlugin from "copy-webpack-plugin";

export default {
  entry: new URL("src/perspectives-react-components.js", import.meta.url).pathname,
  output: {
    filename: "perspectives-react.jsm",
    path: new URL("dist", import.meta.url).pathname,
    library: {
      type: "module" 
    },
    sourceMapFilename: "perspectives-react.jsm.map" // Ensure this line is included
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
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      __PPSTORAGELIMIT__: 10,
      __PPWARNINGLEVEL__: 5,
      __PPSTORAGEURL__: '"https://mycontexts.com/ppsfs/uploadfile"'
    }),
    new CopyPlugin({
      patterns: [
        {
          from: new URL("src/perspectives-react-components.d.ts", import.meta.url).pathname,
          to: new URL("dist/perspectives-react.jsm.d.ts", import.meta.url).pathname
        }
      ]})
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
  },
  resolve: {
    mainFields: ["module", "main"]
  }
};
