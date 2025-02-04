import React from "react";
import {PDRproxy} from "perspectives-proxy";

import PerspectivesComponent from "./perspectivescomponent.js";
import {externalRole} from "./urifunctions.js";
import {PSRol, PSContext} from "./reactcontexts.js";
import {UserMessagingPromise} from "./userMessaging.js";
import i18next from "i18next";

export default class ExternalRole extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state.value = undefined;
  }
  componentDidMount()
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
        pproxy.getRolType(externalRole( component.context.contextinstance ))
          .then(
            function(rolType)
            {
              const updater = {value:
                { contextinstance: component.context.contextinstance
                , contexttype: component.context.contexttype
                , roltype: rolType[0]
                , roleKind: "ExternalRole"
                , rolinstance: externalRole( component.context.contextinstance)
                , bind_: function(){}
                , bind: function(){}
                , checkbinding: function(ignore, callback){ callback(true);}
                , removerol: function(){}
                , removecontext: function(){}
                , isselected: false
                }};
              component.setState( updater );
            })
          .catch(e => UserMessagingPromise.then( um => 
            um.addMessageForEndUser(
              { title: i18next.t("role_title", { ns: 'preact' }) 
              , message: i18next.t("role_message", {ns: 'preact', role: externalRole( component.context.contextinstance )})
              , error: e.toString()
              })));
      });
  }

  render ()
  {
    const component = this;
    if (component.stateIsComplete())
    {
      return (<PSRol.Provider value={component.state.value}>
        {component.props.children}
        </PSRol.Provider>);
    }
    else
    {
      return null;
    }
  }
}

ExternalRole.contextType = PSContext;

// ExternalRole passes on a PSRol ReactContext.
