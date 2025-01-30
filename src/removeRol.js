import React, { Children, cloneElement } from "react";
import {PDRproxy} from "perspectives-proxy";
import {PSContext} from "./reactcontexts.js";

import PerspectivesComponent from "./perspectivescomponent.js";
import {UserMessagingPromise} from "./userMessaging.js";
import i18next from "i18next";

export default function RemoveRol (props)
{
  return <PSContext.Consumer>{ pscontext => <RemoveRol_
      myroletype={pscontext.myroletype}
    >{props.children}</RemoveRol_> }</PSContext.Consumer>;
}

class RemoveRol_ extends PerspectivesComponent
{
  render ()
  {
    const component = this;
    return Children.map(
      component.props.children,
      function(child)
      {
        return cloneElement(
          child,
          {
            // Should be applied to a PSRol object.
            removerol: function({roltype, rolinstance})
            {
              PDRproxy.then(
                function (pproxy)
                {
                  pproxy
                    .removeRol( roltype, rolinstance, component.props.myroletype )
                    .catch(e => UserMessagingPromise.then( um => 
                      um.addMessageForEndUser(
                        { title: i18next.t("removeRole_title", { ns: 'preact' }) 
                        , message: i18next.t("removeRole_message", {ns: 'preact' })
                        , error: e.toString()
                        })));              
                }
              );
            }
          });
      });
  }
}
