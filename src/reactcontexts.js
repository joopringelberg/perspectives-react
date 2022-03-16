const React = require("react");

export const PSContext = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  // use this as value for authoringRole in calls to the PDR.
  , myroletype: ""
  });

  export const AppContext = React.createContext(
    { systemExternalRole: undefined
    , externalRoleId: undefined
    , myRoleType: undefined
    // The user identifier (his GUID).
    , systemUser: undefined
    , setEventDispatcher: function(){}
    , couchdbUrl: undefined
    });

export const PSRoleInstances = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , rol: ""
  , roltype: ""
  , roleKind: ""
  , instances: []
  , cursor: ""
  , createRole: function(){ console.warn("Default (no-op) createRole called. You likely miss a PSRoleInstances.Provider!");}
  , bind: function(){console.warn("Default (no-op) bind called. You likely miss a PSRoleInstances.Provider!");}
  , checkbinding: function(){console.warn("Default (no-op) checkbinding called. You likely miss a PSRol.Provider or PSRoleInstances.Provider!");}
  });

export const PSRol = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  , roltype: ""
  , roleKind: "" // RoleInContext | ContextRole | ExternalRole | UserRole | BotRole
  , bind_: function(){console.warn("Default (no-op) bind_ called. You likely miss a PSRol.Provider!");}
  , bind:  function(){console.warn("Default (no-op) bind called. You likely miss a PSRol.Provider!");}
  , checkbinding: function(){console.warn("Default (no-op) checkbinding called. You likely miss a PSRoleInstances.Provider or PSRol.Provider!");}
  , removerol: function(){console.warn("Default (no-op) removerol called. You likely miss a PSRol.Provider!");}
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
  , propdel: function(){}
  // And there will be a member for each property, holding its values.
  });

export const PSProperty = React.createContext(
  { defaultValue: ""
  , setvalue: function(){}
  }
);
