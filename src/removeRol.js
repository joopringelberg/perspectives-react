const React = require("react");
const Perspectives = require("perspectives-proxy").Perspectives;

import PerspectivesComponent from "./perspectivescomponent.js";

export default class RemoveRol extends PerspectivesComponent
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
            removerol: function({contextinstance, roltype, rolinstance})
            {
              Perspectives.then(
                function (pproxy)
                {
                  pproxy.removeRol( contextinstance, roltype, rolinstance );
                }
              );
            }
          });
      });
  }
}

// RemoveBinding passes on to the props of its children:
// removeBinding
