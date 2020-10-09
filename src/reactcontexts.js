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
  , createRole: function(){ console.warn("Default (no-op) createRole called. You likely miss a PSRoleInstances.Provider!")}
  });

export const PSRolBinding = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , bind: function(){console.warn("Default (no-op) bind called. You likely miss a PSRolBinding.Provider!")}
  , checkbinding: function(){console.warn("Default (no-op) checkbinding called. You likely miss a PSRol.Provider or PSRolBinding.Provider!")}
  , getUnqualifiedRoleBinders: function(){ console.warn("Default (no-op) getUnqualifiedRoleBinders called. You likely miss a PSRolBinding.Provider!")}
  });

export const PSRol = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , roltype: ""
  , bind_: function(){console.warn("Default (no-op) bind_ called. You likely miss a PSRol.Provider!")}
  , checkbinding: function(){console.warn("Default (no-op) checkbinding called. You likely miss a PSRolBinding.Provider or PSRol.Provider!")}
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
  , propset: function(){}
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
