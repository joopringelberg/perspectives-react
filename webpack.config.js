const path = require("path");

module.exports = {
  entry: path.join(__dirname, "src/perspectives-react-components.js" ),
  output: {
    library: "perspectives-react",
    // Type "umd" seems attractive but will break the system for perspectives-proxy!
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
      , root: "React"
    }
    , "prop-types":
      {
        commonjs: "prop-types"
      , commonjs2: "prop-types"
      , root: "PropTypes"
      }
    , "perspectives-proxy":
      { commonjs: 'perspectives-proxy'
      , commonjs2: 'perspectives-proxy'
      , amd: 'perspectives-proxy'
      , root: "perspectivesProxy"
      }
    , "PerspectivesGlobals":
      { root: "PerspectivesGlobals"
      }

    , "react-dom":
      { commonjs: "react-dom"
      , commonjs2: "react-dom"
      , amd: "react-dom"
      , root: "ReactDOM"
      }
    , "react-bootstrap":
      { commonjs: "react-bootstrap"
      , commonjs2: "react-bootstrap"
      , amd: "react-bootstrap"
      , root: "ReactBootstrap"
      }
    , "@primer/octicons-react":
      { commonjs: "@primer/octicons-react"
      , commonjs2: "@primer/octicons-react"
      , amd: "@primer/octicons-react"
      , root: "PrimerOcticonsReact"
      }
  }
};
