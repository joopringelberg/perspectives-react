import "regenerator-runtime/runtime";

import React from 'react';

const PropTypes = require("prop-types");
import { PDRproxy, FIREANDFORGET } from 'perspectives-proxy';
import PerspectivesComponent from "./perspectivescomponent.js";
import {PSContext, AppContext} from "./reactcontexts.js";
import { deconstructModelName, deconstructSegments/*, isExternalRole*/ } from "./urifunctions.js";
import {BackButton} from "./perspectivescontainer.js";
import ScreenDefinitionInterpreter from "./screendefinitioninterpreter.js";
import { default as ModelDependencies } from "./modelDependencies.js";
import {UserMessagingPromise} from "./userMessaging.js";
import Pouchdb from "pouchdb-browser";
import i18next from "i18next";

import
  { Col
  , Row
  , Card
  } from "react-bootstrap";

import lifecycle from '../node_modules/page-lifecycle/dist/lifecycle.es5.js';

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
  { externalroleinstance: PropTypes.string.isRequired
  , setMyRoleType: PropTypes.func.isRequired
  };

// Screen_ loads the component in the context of the role `externalroleinstance` that it receives on its props.
class Screen_ extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    const component = this;
    component.resetState();
    // component.beforeUnloadListener = function(event)
    //   {
    //     event.preventDefault();
    //     return event.returnValue = "Are you sure you want to exit?";
    //   };
    // window.addEventListener( "beforeUnload", component.beforeUnloadListener, {capture: true} );
    lifecycle.addUnsavedChanges("Context");
    window.addEventListener( "visibilitychange", 
      function()
      {
        // See: https://blog.bitsrc.io/page-lifecycle-api-a-browser-api-every-frontend-developer-should-know-b1c74948bd74
        // See: https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
        if (document.visibilityState == "hidden" || document.visibilityState == "visible")
        {
          // Set to true if page is visible, false when hidden.
          component.setIsOnScreen( component.props.externalroleinstance, (document.visibilityState == "visible").toString() );
        }
      });
    }

  setIsOnScreen (roleInstance, value, callback)
  {
    const component = this;
    PDRproxy.then(
      function(pproxy)
      {
        console.log("Setting IsOnScreen of " + roleInstance + " to `" + value +"`.")
        pproxy.setProperty(
          roleInstance
          , ModelDependencies.isOnScreen
          , value
          , component.state.myroletype
          , callback);
      });
  }

  resetState()
  {
    // The role that 'me' plays in the current context. We pass it on to ContextOfRole
    // and that component includes it in the PSContext it provides to descendants.
    this.state.myroletype = undefined;
    this.state.contextinstance = undefined;
    this.state.contexttype = undefined;
    this.state.modules = undefined;
    // Will become true if building the child component tree fails.
    this.state.hasError = false;
  }

  computeState ()
  {
    const component = this;
    const externalRole = component.props.externalroleinstance;
    const userIdentifier = component.props.systemUser;
    PDRproxy.then(
      function(pproxy)
      {
        pproxy.getRolContext(
          externalRole,
          function (contextIds)
          {
            pproxy.getContextType( contextIds[0] )
              .then(
                function (contextTypes)
                {
                  component.addUnsubscriber(
                    pproxy.getMeForContext(
                      externalRole,
                      // userRoles includes roles from aspects.
                      function(userRoles)
                      {
                        component.setIsOnScreen( 
                          component.props.externalroleinstance,
                          "true", 
                          function()
                          {
                            importScreens( userRoles, userIdentifier, component.props.couchdbUrl)
                            .then( screenModules =>
                              {
                                component.setState(
                                  { myroletype: userRoles[0]
                                  , contextinstance: contextIds[0]
                                  , contexttype: contextTypes[0]
                                  , modules: screenModules
                                  });
                                component.props.setMyRoleType( userRoles[0]);
                              });
                            });
                      }));
                })
              .catch(e => UserMessagingPromise.then( um => 
                um.addMessageForEndUser(
                  { title: i18next.t("screen_computestate_title", { ns: 'preact' }) 
                  , message: i18next.t("screen_computestate_message", {ns: 'preact'})
                  , error: e.toString()
                  })));
          }, 
          FIREANDFORGET,
          function(e)
          {
            UserMessagingPromise.then( um => um.addMessageForEndUser(
              { title: i18next.t("screen_clipboard_title", { ns: 'preact' })
              , message: i18next.t("screen_clipboard_message", {ns: 'preact', erole: externalRole})
              , error: e.toString()}));
          });
      });
  }

  componentDidMount ()
  {
    const component = this;
    component.computeState();
  }

  // We ensure this method is called when the user navigates away from the InPlace page. Otherwise, 
  // screen state will persist in Perspectives. 
  componentWillUnmount ()
  {
    // Modify the external role so we know the screen will close.
    const component = this;
    // window.removeEventListener( "beforeUnload", component.beforeUnloadListener, {capture: true} );
    lifecycle.removeUnsavedChanges("Context");
    component.setIsOnScreen( component.props.externalroleinstance, "false")
}

  componentDidUpdate (prevProps)
  {
    const component = this;
    if ( component.props.externalroleinstance !== prevProps.externalroleinstance)
    {
      component.unsubscribeAll().then(
        function()
        {
          component.resetState();
          // Set IsOnScreen to false
         component.setIsOnScreen( 
                prevProps.externalroleinstance, 
                "false", 
                function()
                {
                  component.computeState();
                });
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
      pscontext =
        { contextinstance: component.state.contextinstance
        , contexttype: component.state.contexttype
        , myroletype: component.state.myroletype};
      if (component.state.modules.length == 1)
      {
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
        return  <PSContext.Provider value={pscontext}>
                  <ScreenDefinitionInterpreter
                    contextinstance={component.state.contextinstance}
                    contexttype={component.state.contexttype}
                    myroletype={component.state.myroletype}
                  />
                </PSContext.Provider>;
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
  {
  // Inherited from Screen:
    externalroleinstance: PropTypes.string.isRequired
  , setMyRoleType: PropTypes.func.isRequired
  // Own props (values come from AppContext).
  , couchdbUrl: PropTypes.string.isRequired
  , systemUser: PropTypes.string.isRequired
  };
