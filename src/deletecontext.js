const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
import {PSContext} from "./reactcontexts";

class DeleteContext extends PerspectivesComponent
{
  delete ()
  {
    const component = this;

    Perspectives.then(
      function(pproxy)
      {
        var c;
        if (component.props.contextinstance) {c = component.props.contextinstance} else {c = component.context.contextinstance}
        pproxy.deleteContext(
          c,
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

DeleteContext.contextType = PSContext;

DeleteContext.propTypes = { contextinstance: PropTypes.string }

module.exports = DeleteContext;
