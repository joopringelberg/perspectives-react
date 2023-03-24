const React = require("react");
const PDRproxy = require("perspectives-proxy").PDRproxy;

import PerspectivesComponent from "./perspectivescomponent.js";
import {PSContext} from "./reactcontexts";
const PropTypes = require("prop-types");
import {UserMessagingPromise} from "./userMessaging.js";
import i18next from "i18next";

export default class ContextInstance extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state =
      { contextinstance: this.props.contextinstance
      , contexttype: undefined
      , myroletype: undefined };
  }
  componentDidMount()
  {
    const component = this;
    PDRproxy.then(
      function (pproxy)
      {
        pproxy.getContextType(component.props.contextinstance)
          .then(
            function(contextTypeArr)
            {
              component.setState(
                { contexttype: contextTypeArr[0]
                , myroletype: component.context.myroletype } );
            })
          .catch(e => UserMessagingPromise.then( um => 
            um.addMessageForEndUser(
              { title: i18next.t("contextInstance_title", { ns: 'preact' }) 
              , message: i18next.t("contextInstance_message", {ns: 'preact'})
              , error: e.toString()
              })));
      }
    );
  }

  componentDidUpdate()
  {
    this.componentDidMount();
  }

  render ()
  {
    const component = this;
    if (component.stateIsComplete())
    {
      return (<PSContext.Provider value={component.state}>
        {component.props.children}
        </PSContext.Provider>);
    }
    else
    {
      return null;
    }
  }
}

ContextInstance.contextType = PSContext;

ContextInstance.propTypes = { contextinstance: PropTypes.string.isRequired };
