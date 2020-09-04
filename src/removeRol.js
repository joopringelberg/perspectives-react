const React = require("react");
const Perspectives = require("perspectives-proxy").Perspectives;

import PerspectivesComponent from "./perspectivescomponent.js";

export default RemoveRol (props)
{
  return <PSContext.Consumer>{ pscontext => <RemoveRol_ myroletype={pscontext.myroletype}/> }</PSContext.Consumer>;
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
            // Can be applied to a PSRol context type.
            removerol: function({contextinstance, roltype, rolinstance})
            {
              Perspectives.then(
                function (pproxy)
                {
                  pproxy.removeRol( contextinstance, roltype, rolinstance, component.props.myroletype );
                }
              );
            }
          });
      });
  }
}
