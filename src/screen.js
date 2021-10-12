import React from 'react';

const PropTypes = require("prop-types");
const PDRproxy = require("perspectives-proxy").PDRproxy;
import PerspectivesComponent from "./perspectivescomponent.js";
import {PSContext, AppContext} from "./reactcontexts";
import { deconstructModelName, deconstructSegments/*, isExternalRole*/ } from "./urifunctions.js";
import {BackButton} from "./perspectivescontainer.js";
import StandardScreen from "./standardscreen.js";
import Pouchdb from "pouchdb-browser";

import
  { Col
  , Row
  , Card
  } from "react-bootstrap";

// TODO. Even though PerspectivesGlobals has been declared external, we cannot import it here.
// Doing so will cause a runtime error if the calling program has not put it on the global scope in time.

// This function fetches an attachment "screens.js" from the model file that is passed in as an argument.
// It expects that model file to be in the models database. This might be a local db (IndexedDB) or a remote Couchdb.
// Pouchdb will handle both.
// Returns a promise for a module.
// WHEN the explicitly stored value for 'me' in the context instance changes, the screen is recomputed.
function fetchModuleFromPouchdb( modelName, systemUser, couchdbUrl )
{
  // The IndexedDB database "localUsers"
  const modelsDatabaseName = couchdbUrl ? couchdbUrl + systemUser + "_models" : systemUser + "_models";
  const modelsDatabase = new Pouchdb( modelsDatabaseName );

  return modelsDatabase.getAttachment( modelName, "screens.js").then(
    function(jstext)
    {
      return jstext.text().then( function(t)
      {
        /* The module text, as produces by Webpack using "var" as libraryTarget
        (see: https://webpack.js.org/guides/author-libraries/#expose-the-library)
        ends on export statements.
        By removing those lines, we obtain a text that can actually be constructed into a function
        and then applied to obtain the module!
        */
        return Function('"use strict";' + t.match(/^(.*)export \{/ms)[1] + "\nreturn perspectivesScreens;")();
      });
    }).catch( e => console.log( e ));
}

// Returns a promise that resolves to an array, possibly empty, of objects of the form {roleName :: String, module :: <A React Component> }.
function importScreens( roleNames, userIdentifier, couchdbUrl )
{
  // We map over roles the user plays. These can be context roles or aspect roles.
  const promises = roleNames.map( function(roleName)
    {
      // modelName = model part of the roleName.
      const modelName = deconstructModelName( roleName );

      // importModule should be available on the global scope of the program that uses this library.
      // return importModule( url ).then( result => {result.roleName = roleName; return result; });
      // eslint-disable-next-line no-undef
      return fetchModuleFromPouchdb( modelName, userIdentifier, couchdbUrl).then( function(module)
      // return importModule (url ).then( function(module)
        {
          return {module: module, roleName: roleName }; // this will be bound to the "value" key of the Promise.allSettled result.
        });
    });
  return Promise.allSettled(promises).then(
      function (outcomes)
      {
        return outcomes.filter( ({status, value}) => status == "fulfilled" && value.module && value.module[computeScreenName( value.roleName )]);
      }
    ).then(function (outcomesWithScreen)
    {
      return outcomesWithScreen.map( function({value})
      {
        return {"roleName": value.roleName, "module": value.module[computeScreenName( value.roleName )]};
      });
    });
}

// > Object { status: "fulfilled", value: 3 }
// > Object { status: "rejected", reason: "foo" }

function computeScreenName( roleName )
{
  // Make the identifier start with lowercase and replace '$' with _ (underscore).
  function mapName (s)
  {
    const regex1 = /\$/gi;
    const regex2 = /^./gi;
    return s.replace(regex1, '_').replace(regex2, s.charAt(0).toLowerCase());
  }

  // screenName = local part of the roleName (all segments).
  return mapName( deconstructSegments(roleName) );

}

export default function Screen(props)
{
  return  <AppContext.Consumer>
          {
            ({couchdbUrl, systemUser}) => <Screen_ couchdbUrl={couchdbUrl} systemUser={systemUser} {...props}/>
          }
          </AppContext.Consumer>;
}

Screen.propTypes =
  { rolinstance: PropTypes.string.isRequired
  };

// Screen_ loads the component in the context of the role `rolinstance` that it receives on its props.
class Screen_ extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    this.resetState();
  }

  resetState()
  {
    // This represents 'me': the 'own' user.
    this.state.useridentifier = undefined;
    // The role that 'me' plays in the current context. We pass it on to ContextOfRole
    // and that component includes it in the PSContext it provides to descendants.
    this.state.myroletype = undefined;
    this.state.externalrole = undefined;
    this.state.contextinstance = undefined;
    this.state.contexttype = undefined;
    this.state.modules = undefined;
    // Will become true if building the child component tree fails.
    this.state.hasError = false;
  }

  computeState ()
  {
    const component = this;
    PDRproxy.then(
      function(pproxy)
      {
        function completeState(externalRole, userIdentifier)
        {
          pproxy.getRolContext(
            externalRole,
            function (contextIds)
            {
              pproxy.getContextType(
                contextIds[0],
                function (contextTypes)
                {
                  component.addUnsubscriber(
                    pproxy.getMeForContext(
                      externalRole,
                      // userRoles includes roles from aspects.
                      function(userRoles)
                      {
                        importScreens( userRoles, userIdentifier[0], component.props.couchdbUrl).then( screenModules =>
                          {
                            component.setState(
                              { useridentifier: userIdentifier[0]
                              , myroletype: userRoles[0]
                              , externalrole: externalRole
                              , contextinstance: contextIds[0]
                              , contexttype: contextTypes[0]
                              , modules: screenModules
                              });
                            component.props.setMyRoleType( userRoles[0]);
                          });
                      }));
                }, true); // fireandforget: context type will never change.
            }, true); // fireandforget: context will never change.

        }
        pproxy.getUserIdentifier(
          function(userIdentifier)
          {
            completeState(component.props.rolinstance, userIdentifier);
            // TODO. De code hieronder zou niet meer nodig zijn.
            // if ( isExternalRole ( component.props.rolinstance ))
            // {
            //   completeState(component.props.rolinstance, userIdentifier);
            // }
            // else
            // {
            //   component.addUnsubscriber(
            //     pproxy.getBinding(
            //       component.props.rolinstance,
            //       function( binding )
            //       {
            //         // If no binding, Leave the state incomplete.
            //         if (binding[0])
            //         {
            //           completeState( binding[0], userIdentifier);
            //         }
            //       }));
            // }
          },
          true);
      });
  }

  componentDidMount ()
  {
    this.computeState();
  }

  componentDidUpdate (prevProps)
  {
    const component = this;
    if ( component.props.rolinstance !== prevProps.rolinstance)
    {
      component.unsubscribeAll().then(
        function()
        {
          component.resetState();
          component.computeState();
        }
      );
    }
  }

  static getDerivedStateFromError(/*error*/) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  render ()
  {
    const component = this;
    let TheScreen, pscontext;

    if (component.state.hasError)
    {
      return    <Row>
                  <Col>
                  <Card>
                    <Card.Body>
                      <Card.Title>An error condition occurred</Card.Title>
                      <Card.Text>
                        Due to some error, InPlace could not build the screen that shows the context you requested. More information may be available on the console.
                      </Card.Text>
                      <BackButton buttontext="Back"/>
                    </Card.Body>
                    </Card>
                  </Col>
                </Row>;
    }
    else if (component.stateIsComplete())
    {
      if (component.state.modules.length == 1)
      {
        pscontext =
          { contextinstance: component.state.contextinstance
          , contexttype: component.state.contexttype
          , myroletype: component.state.myroletype};
        TheScreen = component.state.modules[0]["module"];
        return  <PSContext.Provider value={pscontext}>
                  <TheScreen/>
                </PSContext.Provider>;
      }
      else if (component.state.modules.length > 0)
      {
        return <p>You must choose a role from {component.state.modules.map( ({roleName}) => roleName ).toString()}</p>;
      }
      else
      {
        return  <StandardScreen
                  contextinstance={component.state.contextinstance}
                  contexttype={component.state.contexttype}
                  myroletype={component.state.myroletype}/>;
      }
    }
    else
      return    <Row>
                  <Col>
                  <Card>
                    <Card.Body>
                      <Card.Title>No access</Card.Title>
                      <Card.Text>
                        You seem to have no role in this context. Please move back!
                      </Card.Text>
                      <BackButton buttontext="Back"/>
                    </Card.Body>
                    </Card>
                  </Col>
                </Row>;
  }
}

Screen_.contextType = PSContext;

Screen_.propTypes =
  { rolinstance: PropTypes.string.isRequired
  , couchdbUrl: PropTypes.string
  , systemUser: PropTypes.string.isRequired
  , setMyRoleType: PropTypes.func.isRequired
  };
