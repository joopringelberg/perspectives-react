const React = require("react");
const PropTypes = require("prop-types");
const PDRproxy = require("perspectives-proxy").PDRproxy;

import PerspectivesComponent from "./perspectivescomponent.js";
import {getQualifiedPropertyName} from "./urifunctions.js";
import {PSRol, PSView, PSContext} from "./reactcontexts.js";
import {UserMessagingPromise} from "./userMessaging.js";
import i18next from "i18next";

export default function View (props)
{
  return <PSContext.Consumer>{ pscontext =>
      <View_
        myroletype = { pscontext.myroletype }
        viewname = { props.viewname }
      >
      { props.children}
      </View_>
    }</PSContext.Consumer>;
}

// NOTE. If a view contains two properties whose local names are equal (even while their qualified names are unique),
// the state of the View component will have the value of the property that was last fetched for that local name.
// To solve this problem, use the localName rolProperty of the View (however, this has not yet been implemented).
class View_ extends PerspectivesComponent
{
  changeValue (ln, val)
  {
    const component = this;
    const qualifiedPropertyName = getQualifiedPropertyName(ln, component.state.viewproperties);
    const oldValue = component.state[qualifiedPropertyName];
    if (oldValue.length != 1 || oldValue[0] != val)
    {
      PDRproxy.then(
        function(pproxy)
        {
          pproxy.setProperty(
            component.state.rolinstance,
            qualifiedPropertyName,
            val,
            component.props.myroletype );
        });
    }
  }

  deleteProperty (ln)
  {
    const component = this;
    const qualifiedPropertyName = getQualifiedPropertyName(ln, component.state.viewproperties);
    PDRproxy.then(
      function(pproxy)
      {
        pproxy.deleteProperty(
          component.state.rolinstance,
          qualifiedPropertyName,
          component.props.myroletype);
      }
    );
  }

  componentDidMount ()
  {
    const component = this;
    PDRproxy.then(
      function(pproxy)
      {
        if (component.props.viewname == "allproperties")
        {
          console.warn( "Warning: View receives prop viewname=`allproperties`. Do you mean 'allProperties'?");
        }
        pproxy.getViewProperties(
            component.context.roltype,
            component.props.viewname)
          .then(
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
                , propval: ln => component.state[ getQualifiedPropertyName(ln, propertyNames) ]
                , propset: function(ln, val)
                    {
                      if ( Array.isArray( val ) )
                      {
                        throw "Perspectives-react, View: supply a single string value to the function 'setvalue'.";
                      }
                      else
                      {
                        component.changeValue(ln, val);
                      }
                    }
                , propdel: (ln) => component.deleteProperty( ln )
                });
              // Then fetch the values of the properties, to complete the state.
              propertyNames.forEach(
                function(propertyName)
                {
                  component.addUnsubscriber(
                    pproxy.getProperty(
                      component.context.rolinstance,
                      propertyName,
                      component.context.roltype,
                      function (propertyValues)
                      {
                        const updater = {};
                        updater[propertyName] = propertyValues;
                        component.setState(updater);
                      }));
                }
              );
            })
          .catch(e => UserMessagingPromise.then( um => 
            um.addMessageForEndUser(
              { title: i18next.t("view_viewproperties_title", { ns: 'preact' }) 
              , message: i18next.t("view_viewproperties_message", {role: component.context.roltype, ns: 'preact'})
              , error: e.toString()
            })));
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
        </PSView.Provider>);
    }
    else
    {
      return null;
    }
  }

}

View_.contextType = PSRol;

// View passes on a PSView:

View.propTypes = {
  viewname: PropTypes.string.isRequired
};
