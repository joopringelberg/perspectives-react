const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("perspectivescomponent").PerspectivesComponent;


class SetProperty extends PerspectivesComponent
{
  changeValue (val)
  {
    const component = this,
      roleInstance = component.props.rolinstance,
      propertyname = component.props.namespace + "$" + component.props.rolname + "$" + component.props.propertyname;
    Perspectives.then(
      function(pproxy)
      {
        pproxy.setProperty(roleInstance, propertyname, val);
      });
  }

  // Render! props.children contains the nested elements that provide input controls.
  // These should be provided these props:
  //  - value
  //  - setvalue
  render ()
  {
    const component = this;
    // component.props.propertyname
    // component.props.value

    function cloneChild (child)
    {
      return React.cloneElement(
        child,
        {
          defaultvalue: component.props.value,
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

SetProperty.propTypes = {
  namespace: PropTypes.string,
  propertyname: PropTypes.string.isRequired,
  rolinstance: PropTypes.string,
  rolname: PropTypes.string,
  value: PropTypes.array
};

// SetProperty passes on:
// defaultvalue
// setvalue

module.exports = {PerspectivesComponent: PerspectivesComponent}
