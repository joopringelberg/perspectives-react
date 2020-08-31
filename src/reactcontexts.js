export const React = require("react");

export const PSContext = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  });

export const PSRoleInstances = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , rol: ""
  , roltype: ""
  , instances: []
  , cursor: ""
  , setcursor: function(){}
  });

export const PSRolBinding = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , roltype: ""
  , bindrol: function(){}
  , checkbinding: function(){}
  });

export const PSRol = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , roltype: ""
  , bindrol: function(){}
  , checkbinding: function(){}
  , removerol: function(){}
  , rolinstance: ""
  , isselected: false
  });

export const PSView = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , rolinstance: ""
  , roltype: ""
  , viewproperties: []
  , propval: function(){}
  // And there will be a member for each property, holding its values.
  });

export const PSProperty = React.createContext(
  { defaultValue: ""
  , setvalue: function(val){}
  }
);

export const AppContext = React.createContext(
  { setSelectedCard: function(val){}
  , selectedCard: undefined
  , selectedRole: undefined
  });
