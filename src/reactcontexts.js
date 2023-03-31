const React = require("react");

// Two contexts, PSRol and PSRoleInstances, have the functions bind, bind_ and checkBinding. 
// All return promises.
// Their implementation is built along these decisions:
//    * each calls a proxy function and handles its errors by itself, displaying a message for the end user;
//    * bind and bind_ do NOT check whether the binding is allowed.
// Hence, in all situations where the bind and bind_ functions from these contexts are applied, 
// the programmer should make sure that the binding is actually allowed. 
// He can use checkBinding for that purpose. It returns a promise for a Boolean value.
// If the result is `false`, the situation might require that a message for the end user is displayed.

export const PSContext = React.createContext(
  { contextinstance: ""
  , contexttype: ""
  // use this as value for authoringRole in calls to the PDR.
  , myroletype: ""
  });

  export const AppContext = React.createContext(
    { systemExternalRole: undefined
    // for contexts that are opened
    , externalRoleId: undefined
    // for roles that are opened
    , roleId: undefined
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
  // Handles its own errors and returns a promise.
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
