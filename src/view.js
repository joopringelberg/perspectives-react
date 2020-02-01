const React = require("react");
const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
const getQualifiedPropertyName = require("./urifunctions.js").getQualifiedPropertyName;
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
        component.addUnsubscriber(
          pproxy.getViewProperties(
            component.context.roltype,
            component.props.viewname,
            function(propertyNames)
            {
              // TODO. Dit is inefficient.
              // Als er een Property bij komt of vanaf gaat, wordt voor elke Property de waarde opnieuw opgehaald.
              // Als er één af gaat is dat al helemaal niet nodig.
              // Komt er één bij, dan hoeven we alleen voor die nieuwe Property de waarde op te halen.

              // We will use the state as the value of PSView.
              // First initialize state property members, so we can check whether it is complete.
              // NOTE: React will not notice this.
              propertyNames.forEach(
                function(propertyName)
                {
                  component.state[propertyName] = undefined;
                }
              );
              // Now add the viewProperties to state.
              component.setState(
                { contextinstance: component.context.contextinstance
                , contexttype: component.context.contexttype
                , rolinstance: component.context.rolinstance
                , roltype: component.context.roltype
                , viewproperties: propertyNames
                , propval: function(ln){ return component.state[ getQualifiedPropertyName(ln, propertyNames) ]; }
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
                        updater[propertyName] = propertyValues;
                        component.setState(updater);
                      }));
                }
              );
            })
        );
      }
    );
  }

  render ()
  {
    const component = this;
    
    if (!component.stateIsEmpty() && component.stateIsComplete())
    {
      return (<PSView.Provider value={component.state}>
        {component.props.children}
        </PSView.Provider>)
    }
    else
    {
      return null;
    }
  }

}

View.contextType = PSRol;

// View passes on a PSView:

View.propTypes = {
  viewname: PropTypes.string.isRequired
};

module.exports = View;
