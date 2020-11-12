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
              presets: ['@babel/preset-env', "@babel/preset-react"],
              plugins: [
                '@babel/plugin-proposal-object-rest-spread',
                '@babel/plugin-syntax-dynamic-import'
              ]
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      }]
  },
  externals:
    { "react": "commonjs2 react"
    , "react-dom": "commonjs2 react-dom"
    , "react-bootstrap": "commonjs2 react-bootstrap"
    , "@primer/octicons-react": "commonjs2 @primer/octicons-react"
    , "prop-types": "commonjs2 prop-types"
    , "perspectives-proxy": "commonjs2 perspectives-proxy"
    , "PerspectivesGlobals":
      { root: "PerspectivesGlobals"
      }
  }
};
