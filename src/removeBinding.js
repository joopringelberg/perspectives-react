const React = require("react");
const PDRproxy = require("perspectives-proxy").PDRproxy;

import PerspectivesComponent from "./perspectivescomponent.js";

import {PSContext} from "./reactcontexts.js"

export default function RemoveBinding (props)
{
  return <PSContext.Consumer>{ pscontext => <RemoveBinding_ myroletype={pscontext.myroletype}>{props.children}</RemoveBinding_> }</PSContext.Consumer>;
}

class RemoveBinding_ extends PerspectivesComponent
{
  render ()
  {
    const component = this;
    return React.Children.map(
      component.props.children,
      function(child)
      {
        return React.cloneElement(
          child,
          {
            // Can be applied to a PSRol context type.
            removeBinding: function({rolinstance})
            {
              PDRproxy.then(
                function (pproxy)
                {
                  pproxy
                    .removeBinding( rolinstance, component.props.myroletype )
                    .catch(e => UserMessagingPromise.then( um => 
                      um.addMessageForEndUser(
                        { title: i18next.t("unfill_title", { ns: 'preact' }) 
                        , message: i18next.t("unfill_message", {ns: 'preact' })
                        , error: e.toString()
                        })));              
                }
              );
            }
          });
      });
  }
}

// RemoveBinding passes on to the props of its children:
// removeBinding
