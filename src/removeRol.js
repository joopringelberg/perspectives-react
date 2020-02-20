const React = require("react");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");

class RemoveRol extends PerspectivesComponent
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
            removeRol: function({contextinstance, roltype, rolinstance})
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

module.exports = RemoveRol;
