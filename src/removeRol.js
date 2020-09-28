const React = require("react");
const Perspectives = require("perspectives-proxy").Perspectives;
import {PSContext} from "./reactcontexts.js";

import PerspectivesComponent from "./perspectivescomponent.js";

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
    return React.Children.map(
      component.props.children,
      function(child)
      {
        return React.cloneElement(
          child,
          {
            // Should be applied to a PSRol object.
            removerol: function({contexttype, roltype, rolinstance})
            {
              Perspectives.then(
                function (pproxy)
                {
                  pproxy.removeRol( contexttype, roltype, rolinstance, component.props.myroletype );
                }
              );
            }
          });
      });
  }
}
