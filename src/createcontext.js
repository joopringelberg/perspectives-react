const React = require("react");
const PropTypes = require("prop-types");
const PDRproxy = require("perspectives-proxy").PDRproxy;

import PerspectivesComponent from "./perspectivescomponent.js";
import {PSContext} from "./reactcontexts";
import {UserMessagingPromise} from "./userMessaging.js";
import i18next from "i18next";

export default class CreateContext extends PerspectivesComponent
{
  // This function returns a promise that will resolve to the identifier of the external role of the new context.
  create (contextDescription)
  {
    const component = this;
    const defaultContextDescription = {
      id: "", // will be set in the core.
      prototype : undefined,
      ctype: component.props.contextname,
      rollen: {},
      interneProperties: {},
      externeProperties: {}
    };
    // Move all properties to the default context description to ensure we send a complete description.
    Object.assign(defaultContextDescription, contextDescription);

    return PDRproxy
      .then( pproxy => pproxy.createContext(
        defaultContextDescription,
        component.props.rolname, // local role name
        component.context.contextinstance,
        component.context.contexttype,
        component.context.myroletype ))
      .then( contextIds => contextIds[0] )
      .catch(e => UserMessagingPromise.then( um => 
        um.addMessageForEndUser(
          { title: i18next.t("createContext_title", { ns: 'preact' }) 
          , message: i18next.t("createContext_message", {ns: 'preact', type: contexttype})
          , error: e.toString()
          })));
;
  }

  // Render! props.children contains the nested elements that provide input controls.
  // These should be provided these props:
  //  - create
  render ()
  {
    const component = this;

    function cloneChild (child)
    {
      return React.cloneElement(
        child,
        {
          create: function(contextDescription)
          {
            return component.create(contextDescription);
          }
        });
    }

    if (Array.isArray(component.props.children))
    {
      return React.Children.map(
        component.props.children,
        cloneChild);
    }
    else
    {
      return cloneChild(component.props.children);
    }
  }
}

CreateContext.contextType = PSContext;

CreateContext.propTypes = {
  // fully qualified name: the type of Context to create.
  // The core loads the model that defines this type, if it is not locally available.
  contextname: PropTypes.string.isRequired,
  // (local) name of the role type the context should be bound in.
  rolname: PropTypes.string.isRequired
};

// CreateContext passes on:
// create
