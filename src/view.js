const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("perspectivescomponent").PerspectivesComponent;
const deconstructLocalNameFromDomeinURI_ = require("urifunctions").deconstructLocalNameFromDomeinURI_;

// NOTE. If a view contains two properties whose local names are equal (even while their qualified names are unique),
// the state of the View component will have the value of the property that was last fetched for that local name.
// To solve this problem, use the localName rolProperty of the View (however, this has not yet been implemented).
class View extends PerspectivesComponent
{
  componentDidMount ()
  {
    const component = this;
    Perspectives.then(
      function(pproxy)
      {
        let qualifiedView;
        component.state.namespace = component.props.namespace;
        component.state.rolinstance = component.props.rolinstance;
        component.state.contextinstance = component.props.contextinstance;
        // This ugly hack needs to go! The royal way is to make the type of buitenRol no longer have "Beschrijving" as part of its name.
        if (component.props.rolname === "buitenRol")
        {
          component.state.rolname = "buitenRolBeschrijving"
        }
        else if (component.props.rolname === "binnenRol")
        {
          component.state.rolname = "binnenRolBeschrijving"
        }
        else
        {
          component.state.rolname = component.props.rolname;
        }
        if (component.state.rolname)
        {
          qualifiedView = component.state.namespace + "$" + component.state.rolname + "$" + component.props.viewname;
        }
        else
        {
          qualifiedView = component.state.namespace + "$" + component.props.viewname;
        }
        pproxy.getViewProperties(
          qualifiedView,
          function(propertyNames)
          {
            // First initialize state
            // NOTE: React will not notice this.
            propertyNames.forEach(
              function(propertyName)
              {
                const ln = deconstructLocalNameFromDomeinURI_(propertyName);
                component.state[ln] = undefined;
              }
            );
            propertyNames.forEach(
              function(propertyName)
              {
                component.addUnsubscriber(
                  pproxy.getProperty(
                    component.props.rolinstance,
                    propertyName,
                    function (propertyValues)
                    {
                      const updater = {};
                      const ln = deconstructLocalNameFromDomeinURI_(propertyName);
                      updater[ln] = propertyValues;
                      component.setState(updater);
                    },
                    component.addUnsubscriber.bind(component)
                  ));
              }
            );
          },
          component.addUnsubscriber.bind(component)
        );
      }
    );
  }


  // render! props.children contains the nested elements.
  // These should be provided all property name-value pairs,
  // except when it has a prop 'propertyName'.
  // However, this can only be done after state is available.
  render ()
  {
    const component = this;

    function cloneChild (child)
    {
      // If the child has a prop 'propertyName', just provide the property value.
      if (child.props.propertyname)
      {
        return React.cloneElement(
          child,
          {
            value: component.state[child.props.propertyname],
            namespace: component.state.namespace,
            contextinstance: component.state.contextinstance,
            rolinstance: component.state.rolinstance,
            rolname: component.state.rolname
          });
      }
      else
      {
        // State has a member for each property, holding its value.
        return React.cloneElement(
          child,
          component.state);
      }
    }

    if (!component.stateIsEmpty() && component.stateIsComplete())
    {
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
    else
    {
      return <div />;
    }
  }

}
// View passes on:
// namespace
// contextinstance
// rolinstance
// rolname
// and a prop for each Property on the View.
// If a child has a value for 'propertyname' on its props,
// it will receive prop 'value' and the above.

View.propTypes = {
  namespace: PropTypes.string,
  rolinstance: PropTypes.string,
  rolname: PropTypes.string,
  viewname: PropTypes.string.isRequired
};

module.exports = {View: View};
