const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
const deconstructLocalNameFromDomeinURI_ = require("./urifunctions.js").deconstructLocalNameFromDomeinURI_;
const PSRol = require("./reactcontexts.js").PSRol;

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
          component.context.roltype, // De context is hier niet beschikbaar. Toch is de manier van gebruik goed.
          component.props.viewname,
          function(propertyNames)
          {
            // First initialize state, so we can check whether it is complete.
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

View.contextType = PSRol;

// View passes on:
// namespace
// contextinstance
// rolinstance
// rolname
// and a prop for each Property on the View.
// If a child has a value for 'propertyname' on its props,
// it will receive prop 'value' and the above.

View.propTypes = {
  viewname: PropTypes.string.isRequired
};

module.exports = View;
