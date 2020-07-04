const path = require("path");

module.exports = {
  entry: path.join(__dirname, "src/perspectives-react-components.js" ),
  output: {
    library: "perspectives-react",
    libraryTarget: "commonjs2",
    filename: "perspectives-react.js",
    path: path.join(__dirname, "dist")
  },
  mode: "development",
  target: "electron-renderer",
  module: {
    rules: [{
        test: /.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                "env",
                "react"
              ]
            }
          }
        ]
      }]
  },
  externals: {
    "react":
      { commonjs: "react"
      , commonjs2: "react"
    }
    , "prop-types":
      {
        commonjs: "prop-types"
      , commonjs2: "prop-types"
      }
    , "perspectives-proxy":
      { commonjs: 'perspectives-proxy'
      , commonjs2: 'perspectives-proxy'
      , amd: 'perspectives-proxy'
      , root: "perspectivesProxy"
      }
    , "PerspectivesGlobals": "PerspectivesGlobals"
  }
};
