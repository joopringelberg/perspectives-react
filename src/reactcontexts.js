const React = require("react");

const PSContext = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  });

const PSRol = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , rolinstance: ""
  , roltype: ""
  });

const PSView = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , rolinstance: ""
  , roltype: ""
  , viewproperties: []
  // And there will be a member for each property, holding its values.
  });

module.exports =
  {
    PSContext: PSContext,
    PSRol: PSRol,
    PSView: PSView
  }
