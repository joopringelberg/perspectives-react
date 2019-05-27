const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("perspectivescomponent").PerspectivesComponent;

class DeleteContext extends PerspectivesComponent
{
  delete ()
  {
    const component = this;

    Perspectives.then(
      function(pproxy)
      {
        pproxy.deleteContext(
          component.props.contextinstance,
          function()
          {}
        );
      });
  }

  // Render! props.children contains the nested elements that provide input controls.
  // These should be provided these props:
  //  - delete
  render ()
  {
    const component = this;

    function cloneChild (child)
    {
      return React.cloneElement(
        child,
        {
          delete: function()
          {
            component.delete();
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

DeleteContext.propTypes = {
  contextinstance: PropTypes.string
};

module.exports = {Context: Context};
