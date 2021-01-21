import React from 'react'; 

const PropTypes = require("prop-types");
const PDRproxy = require("perspectives-proxy").PDRproxy;
import PerspectivesComponent from "./perspectivescomponent.js";
import ContextOfRole from "./contextofrole.js";
import {PSContext} from "./reactcontexts";
import { deconstructModelName, deconstructSegments, isExternalRole } from "./urifunctions.js";
import {PerspectivesContainer, BackButton} from "./perspectivescontainer.js";

import
  { Col
  , Row
  , Card
  } from "react-bootstrap";


// TODO. Even though PerspectivesGlobals has been declared external, we cannot import it here.
// Doing so will cause a runtime error if the calling program has not put it on the global scope in time.

// Returns a promise that resolves to an array of modules with a default export containing a React component.
// function importScreens( roleNames, useridentifier )
// {
//   // modelName = model part of the roleName
//   const modelName = deconstructModelName( roleName );
//
//   // PerspectivesGlobals should be available on the global scope of the program that uses this library.
//   const url = PerspectivesGlobals.host + useridentifier + "_models/" + modelName + "/screens.js";
//
//   // importModule should be available on the global scope of the program that uses this library.
//   return importModule( url );
// }

// Returns a promise that resolves to an array, possibly empty, of objects of the form {roleName :: String, module :: <A React Component> }.
function importScreens( roleNames, useridentifier )
{
  const promises = roleNames.map( function(roleName)
    {
      // modelName = model part of the roleName
      const modelName = deconstructModelName( roleName );

      // PerspectivesGlobals should be available on the global scope of the program that uses this library.
      // eslint-disable-next-line no-undef
      const url = PerspectivesGlobals.host + useridentifier + "_models/" + modelName + "/screens.js";

      // importModule should be available on the global scope of the program that uses this library.
      // return importModule( url ).then( result => {result.roleName = roleName; return result; });
      // eslint-disable-next-line no-undef
      return importModule (url ).then( function(module)
        {
          return {module: module, roleName: roleName }; // this will be bound to the "value" key of the Promise.allSettled result.
        });
    });
  return Promise.allSettled(promises).then(
      function (outcomes)
      {
        return outcomes.filter( ({status, value}) => status == "fulfilled" && value.module[computeScreenName( value.roleName )]);
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

  // screenName = local part of the roleName
  return mapName( deconstructSegments(roleName) );

}
// Screen loads the component in the context of the role `rolinstance` that it receives on its props.
export default class Screen extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
    // This represents 'me': the 'own' user.
    this.state.useridentifier = undefined;
    // The role that 'me' plays in the current context. We pass it on to ContextOfRole
    // and that component includes it in the PSContext it provides to descendants.
    this.state.myroletypes = undefined;
    this.state.rolinstance = undefined;
    this.state.modules = undefined;
    // Will become true if building the child component tree fails.
    this.state.hasError = false;
  }

  componentDidMount ()
  {
    const component = this;
    PDRproxy.then(
      function(pproxy)
      {
        component.addUnsubscriber(
          pproxy.getUserIdentifier(
            function(userIdentifier)
            {
              if ( isExternalRole (component.props.rolinstance ))
              {
                component.addUnsubscriber(
                  pproxy.getMeForContext( component.props.rolinstance,
                    function(userRoles)
                    {
                      importScreens( userRoles, userIdentifier[0]).then( screenModules =>
                        component.setState(
                          { myroletypes: userRoles
                          , useridentifier: userIdentifier[0]
                          , rolinstance: component.props.rolinstance
                          , modules: screenModules
                          }));
                    }
                  ));
              }
              else
              {
                component.addUnsubscriber(
                  pproxy.getBinding(
                    component.props.rolinstance,
                    function( externalRole )
                    {
                      // If no externalRole, there is no binding.
                      // Leave the state incomplete.
                      if (externalRole[0])
                      {
                        component.addUnsubscriber(
                          pproxy.getMeForContext( externalRole[0],
                            function(userRoles)
                            {
                              importScreens( userRoles, userIdentifier[0]).then( screenModules =>
                                component.setState(
                                  { myroletypes: userRoles
                                  , useridentifier: userIdentifier[0]
                                  , rolinstance: externalRole[0]
                                  , modules: screenModules
                                  }));
                            }
                          ));
                      }
                    }));
              }
            }));
      });
  }

  static getDerivedStateFromError(/*error*/) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  render ()
  {
    const component = this;
    var Screen, myroletype;

    if (component.state.hasError)
    {
      return  <PerspectivesContainer>
                <Row>
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
                </Row>
              </PerspectivesContainer>;
    }
    else if (component.stateIsComplete())
    {
      if (component.state.modules.length == 1)
      {
        Screen = component.state.modules[0]["module"];
        myroletype = component.state.modules[0]["roleName"];
        return  <ContextOfRole rolinstance={component.state.rolinstance} myroletype={myroletype}>
                  <Screen/>
                </ContextOfRole>;
      }
      else
      {
        return <p>You must choose a role from {component.state.modules.map( ({roleName}) => roleName ).toString()}</p>;
      }
    }
    else
      return  <PerspectivesContainer>
                <Row>
                  <Col>
                  <Card>
                    <Card.Body>
                      <Card.Title>No access</Card.Title>
                      <Card.Text>
                        Either there is no context, or you have no role in it. Please move back!
                      </Card.Text>
                      <BackButton buttontext="Back"/>
                    </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </PerspectivesContainer>;
  }
}

Screen.contextType = PSContext;

Screen.propTypes = {rolinstance: PropTypes.string.isRequired};
