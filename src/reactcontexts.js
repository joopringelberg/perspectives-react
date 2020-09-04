export const React = require("react");

export const PSContext = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , myroletype: ""
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
  , bindrol: function(){console.warn("Default (no-op) bindrol called. You likely miss a PSRolBinding.Provider!")}
  , checkbinding: function(){console.warn("Default (no-op) checkbinding called. You likely miss a PSRolBinding.Provider!")}
  });

export const PSRol = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , roltype: ""
  , bindrol: function(){console.warn("Default (no-op) bindrol called. You likely miss a PSRol.Provider!")}
  , checkbinding: function(){console.warn("Default (no-op) checkbinding called. You likely miss a PSRol.Provider!")}
  , removerol: function(){console.warn("Default (no-op) removerol called. You likely miss a PSRol.Provider!")}
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
