const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
const getQualifiedPropertyName = require("./urifunctions.js").getQualifiedPropertyName
const {PSView, PSProperty} = require("./reactcontexts.js");

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
    const childProps = {
      defaultvalue: component.context[getQualifiedPropertyName(component.props.propertyname, component.context.viewproperties)],
      setvalue: function(val)
      {
        component.changeValue(val);
      }
    }
    let children;
    if (Array.isArray(component.props.children))
    {
      children = component.props.children;
    }
    else
    {
      children = [component.props.children];
    }
    // We provide the children with props, AND we give them a React Context with the same props.
    // Hence for a child we can choose to use a Consumer, or a function with an argument to receive the props.
    return <PSProperty.Provider value={childProps}>
            { React.Children.map( children, child => React.cloneElement( child, childProps) ) }
          </PSProperty.Provider>
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
