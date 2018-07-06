# perspectives-react

React components to build a GUI based on the perspectives-protocol (hides connection to perspectives-core).

## Installation
Install with npm:

```
$ npm install perspectives-react
```
## Dependencies
This package depends on React. JSX is used in the source. It also depends on `perpectives-proxy`. However, this module is declared external in order to be able to share it with `perspectives-core` (the core also depends on the proxy, but react and core need to share the same instance of proxy).

## Build
Create `dist/perspectives-react.js` by evaluating on the command line:

```
$ npm run build
```
This is equivalent to:
```
$ npx webpack
```
## Watch
Have Webpack watch the sources and update `dist/perspectives-react.js` by evaluating on the command line:

```
$ npm run watch
```
This is equivalent to:
```
$ npx webpack --watch
```
