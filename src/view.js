const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
const deconstructLocalNameFromDomeinURI_ = require("./urifunctions.js").deconstructLocalNameFromDomeinURI_;
const {PSRol, PSView} = require("./reactcontexts.js");

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
        pproxy.getViewProperties(
          component.context.roltype,
          component.props.viewname,
          function(propertyNames)
          {
            // We will use the state as the value of PSView.
            // First initialize state property members, so we can check whether it is complete.
            // NOTE: React will not notice this.
            propertyNames.forEach(
              function(propertyName)
              {
                const ln = deconstructLocalNameFromDomeinURI_(propertyName);
                component.state[ln] = undefined;
              }
            );
            // Now add the viewProperties to state.
            component.setState(
              { contextinstance: component.context.contextinstance
              , contexttype: component.context.contexttype
              , rolinstance: component.context.rolinstance
              , roltype: component.context.roltype
              , viewproperties: propertyNames
              });
            // Then fetch the values of the properties, to complete the state.
            propertyNames.forEach(
              function(propertyName)
              {
                component.addUnsubscriber(
                  pproxy.getProperty(
                    component.context.rolinstance,
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
            propertyname: child.props.propertyname,
            value: component.state[child.props.propertyname],
            contexttype: component.context.contexttype,
            contextinstance: component.context.contextinstance,
            rolinstance: component.context.rolinstance,
            roltype: component.context.roltype
          });
      }
      else
      {
        // State has a member for each property, holding its value.
        return React.cloneElement(
          child,
          Object.assign(
            {
              contexttype: component.context.contexttype,
              contextinstance: component.context.contextinstance,
              rolinstance: component.context.rolinstance,
              roltype: component.context.roltype
            },
            component.state));
      }
    }

    if (!component.stateIsEmpty() && component.stateIsComplete())
    {
      return (<PSView.Provider value={component.state}>
        {component.props.children}
        </PSView.Provider>)
    }
    else
    {
      return <div />;
    }
  }

}

View.contextType = PSRol;

// View passes on a PSView:

View.propTypes = {
  viewname: PropTypes.string.isRequired
};

module.exports = View;
