const React = require("react");

const PropTypes = require("prop-types");
const PDRproxy = require("perspectives-proxy").PDRproxy;

import PerspectivesComponent from "./perspectivescomponent.js";
import {getQualifiedPropertyName} from "./urifunctions.js";
import {PSView, PSProperty, PSContext} from "./reactcontexts.js";

/////// THIS COMPONENT IS NEVER USED.

export default function SetProperty (props)
{
  return <PSContext.Consumer>{ pscontext =>
      <SetProperty_
        id={props.id}
        propertyname={props.propertyname}
        myroletype={pscontext.myroletype}>
          {props.children}
      </SetProperty_>
        }</PSContext.Consumer>
}

SetProperty.propTypes = {
  propertyname: PropTypes.string.isRequired,
  value: PropTypes.array
};

class SetProperty_ extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.state = { defaultvalue: undefined, setvalue: undefined };
  }

  changeValue (val)
  {
    const component = this;
    const oldValue = component.context[getQualifiedPropertyName(component.props.propertyname, component.context.viewproperties)];
    if (oldValue.length != 1 || oldValue[0] != val)
    {
      PDRproxy.then(
        function(pproxy)
        {
          pproxy.setProperty(
            component.context.rolinstance,
            getQualifiedPropertyName(component.props.propertyname, component.context.viewproperties),
            val,
            component.props.myroletype );
        });
    }
  }

  componentDidMount ()
  {
    const component = this;
    const updater = {
      defaultvalue: component.context[getQualifiedPropertyName(component.props.propertyname, component.context.viewproperties)],
      setvalue: function(val)
      {
        if ( Array.isArray( val ) )
        {
          throw "Perspectives-react, SetProperty: supply a single string value to the function 'setvalue'."
        }
        else
        {
          component.changeValue(val);
        }
      }
    };
    component.setState(updater);
  }

  componentDidUpdate ()
  {
    const component = this;
    const updater = {
      defaultvalue: component.context[getQualifiedPropertyName(component.props.propertyname, component.context.viewproperties)]
    };
    component.setState( updater );
  }

  render ()
  {
    const component = this;
    let children;
    if ( component.stateIsComplete() )
    {
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
      return <PSProperty.Provider value={component.state}>
              { React.Children.map( children, child => React.cloneElement( child, component.state) ) }
            </PSProperty.Provider>
    }
    else
    {
      return <div/>;
    }
  }
}

SetProperty_.contextType = PSView;

SetProperty_.propTypes = {
  propertyname: PropTypes.string.isRequired,
  value: PropTypes.array
};

// SetProperty passes on:
// defaultvalue
// setvalue
