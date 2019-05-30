const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
const {PSView} = require("./reactcontexts.js");

class SetProperty extends PerspectivesComponent
{
  changeValue (val)
  {
    const component = this;
    Perspectives.then(
      function(pproxy)
      {
        pproxy.setProperty(
          component.context.rolinstance,
          component.getQualifiedPropertyName(),
          val);
      });
  }

  getQualifiedPropertyName ()
  {
      // Match the local propertyname given as a prop with the qualified names in context.
      const r = new RegExp(".*" + this.props.propertyname + "$");
      return this.context.viewproperties.find( qn => qn.match(r));
  }

  render ()
  {
    const component = this;

    function cloneChild (child)
    {
      return React.cloneElement(
        child,
        {
          defaultvalue: component.context[component.props.propertyname],
          setvalue: function(val)
          {
            component.changeValue(val);
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

SetProperty.contextType = PSView;

SetProperty.propTypes = {
  propertyname: PropTypes.string.isRequired,
  value: PropTypes.array
};

// SetProperty passes on:
// defaultvalue
// setvalue

module.exports = SetProperty
