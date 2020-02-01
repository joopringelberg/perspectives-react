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

const PSRolBinding = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , roltype: ""
  , bindrol: function(){}
  });

const PSView = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , rolinstance: ""
  , roltype: ""
  , viewproperties: []
  , propval: function(){}
  // And there will be a member for each property, holding its values.
  });

module.exports =
  {
    PSContext: PSContext,
    PSRol: PSRol,
    PSView: PSView,
    PSRolBinding: PSRolBinding
  }
