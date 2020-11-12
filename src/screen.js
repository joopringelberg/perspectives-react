import React, { Suspense } from 'react';

const PropTypes = require("prop-types");
const Perspectives = require("perspectives-proxy").Perspectives;
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

// Returns a promise that resolves to a module with a default export containing a React component.
function importScreens( roleName, useridentifier )
{
  // modelName = model part of the roleName
  const modelName = deconstructModelName( roleName );

  // PerspectivesGlobals should be available on the global scope of the program that uses this library.
  const url = PerspectivesGlobals.host + useridentifier + "_models/" + modelName + "/screens.js";

  // importModule should be available on the global scope of the program that uses this library.
  return importModule( url );
}

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
    this.state.myroletype = undefined;
    this.state.rolinstance = undefined;
  }

  componentDidMount ()
  {
    const component = this;
    Perspectives.then(
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
                      component.setState(
                        { myroletype: userRoles[0]
                        , useridentifier: userIdentifier[0]
                        , rolinstance: component.props.rolinstance
                        });
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
                      component.addUnsubscriber(
                        pproxy.getMeForContext( externalRole[0],
                          function(userRoles)
                          {
                            component.setState(
                              { myroletype: userRoles[0]
                              , useridentifier: userIdentifier[0]
                              , rolinstance: externalRole[0]
                              });
                          }
                        ));
                      }));
              }
            }));
      });
  }

  render ()
  {
    const component = this;
    var Screens;

    if (component.stateIsComplete())
    {
      Screens = React.lazy(() => importScreens( component.state.myroletype, component.state.useridentifier ) );
      return  <Suspense fallback={<div>Loading...</div>}>
                <ContextOfRole rolinstance={component.state.rolinstance} myroletype={component.state.myroletype}>
                  <Screens screenName={ computeScreenName( component.state.myroletype ) }/>
                </ContextOfRole>
              </Suspense>;
    }
    else
      return  <PerspectivesContainer>
                <Row>
                  <Col>
                  <Card>
                    <Card.Body>
                      <Card.Title>No access</Card.Title>
                      <Card.Text>
                        You have no role in this context. Please move back!
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
