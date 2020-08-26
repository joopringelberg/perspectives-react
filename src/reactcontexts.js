const React = require("react");

const PSContext = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  });

const PSRoleInstances = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , rol: ""
  , roltype: ""
  , instances: []
  , cursor: ""
  , setcursor: function(){}
  });

const PSRolBinding = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , roltype: ""
  , bindrol: function(){}
  , checkbinding: function(){}
  });

const PSRol = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , roltype: ""
  , bindrol: function(){}
  , checkbinding: function(){}
  , removerol: function(){}
  , rolinstance: ""
  , isselected: false
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

const PSProperty = React.createContext(
  { defaultValue: ""
  , setvalue: function(val){}
  }
);

const AppContext = React.createContext(
  { setSelectedCard: function(val){}
  , selectedCard: undefined
  , selectedRole: undefined  
  });

module.exports =
  {
    PSContext: PSContext,
    PSRol: PSRol,
    PSRoleInstances: PSRoleInstances,
    PSView: PSView,
    PSRolBinding: PSRolBinding,
    PSProperty: PSProperty,
    AppContext: AppContext
  }
