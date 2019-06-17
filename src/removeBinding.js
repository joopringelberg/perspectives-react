const React = require("react");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");

class RemoveBinding extends PerspectivesComponent
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
                  pproxy.removeBinding( rolinstance );
                }
              );
            }
          });
      });
  }
}

// RemoveBinding passes on to the props of its children:
// removeBinding

module.exports = RemoveBinding;
