const React = require("react");
const Perspectives = require("perspectives-proxy").Perspectives;

import PerspectivesComponent from "./perspectivescomponent.js";

export default RemoveRol (props)
{
  return <PSContext.Consumer>{ pscontext => <RemoveBinding_ myroletype={pscontext.myroletype}/> }</PSContext.Consumer>;
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
              Perspectives.then(
                function (pproxy)
                {
                  pproxy.removeBinding( rolinstance, component.props.myroletype );
                }
              );
            }
          });
      });
  }
}

// RemoveBinding passes on to the props of its children:
// removeBinding
