const path = require("path");

module.exports = {
  entry: path.join(__dirname, "src/perspectives-react-components.js" ),
  output: {
    library: "perspectives-react",
    // Type "umd" seems attractive but will break the system for react-bootstrap!
    // Desalniettemin is het nu een optie die werkt voor InPlace.
    libraryTarget: "umd",
    filename: "perspectives-react.js",
    path: path.join(__dirname, "dist")
  },
  mode: "development",
  target: "web",
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
    {
    "react": {
      amd: "react",
      commonjs: "react",
      commonjs2: "react",
      root: "react"
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
    }
    ,"prop-types": {
       amd: "prop-types",
       commonjs: "prop-types",
       commonjs2: "prop-types",
       root: "prop-types"
     }
    ,"perspectives-proxy": {
      amd: "perspectives-proxy",
      commonjs: "perspectives-proxy",
      commonjs2: "perspectives-proxy",
      root: "perspectives-proxy"
    }
    , "PerspectivesGlobals":
      { root: "PerspectivesGlobals"
      }
  }
};
