const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
const getQualifiedPropertyName = require("./urifunctions.js").getQualifiedPropertyName
const {PSView} = require("./reactcontexts.js");

class SetProperty extends PerspectivesComponent
{
  changeValue (val)
  {
    const component = this;
    const oldValue = component.context[getQualifiedPropertyName(component.props.propertyname, component.context.viewproperties)];
    if ( val != oldValue)
    {
      Perspectives.then(
        function(pproxy)
        {
          pproxy.setProperty(
            component.context.rolinstance,
            getQualifiedPropertyName(component.props.propertyname, component.context.viewproperties),
            val);
        });
    }
  }

  render ()
  {
    const component = this;

    function cloneChild (child)
    {
      return React.cloneElement(
        child,
        {
          defaultvalue: component.context[getQualifiedPropertyName(component.props.propertyname, component.context.viewproperties)],
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
