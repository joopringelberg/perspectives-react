const React = require("react");
import Loadable from 'react-loadable';
const Perspectives = require("perspectives-proxy").Perspectives;

import PerspectivesComponent from "./perspectivescomponent.js";
import ContextOfRole from "./contextofrole.js";
import {PSContext} from "./reactcontexts";
import { deconstructModelName, deconstructSegments } from "./urifunctions.js";

// TODO. Even though PerspectivesGlobals has been declared external, we cannot import it here.
// Doing so will cause a runtime error if the calling program has not put it on the global scope in time.

function importRoleScreen( roleName, useridentifier )
{
  // Make the identifier start with lowercase and replace '$' with _ (underscore).
  function mapName (s)
  {
    const regex1 = /\$/gi;
    const regex2 = /^./gi;
    return s.replace(regex1, '_').replace(regex2, s.charAt(0).toLowerCase());
  }

  // modelName = model part of the roleName
  const modelName = deconstructModelName( roleName );

  // screenName = local part of the roleName
  const screenName = mapName( deconstructSegments(roleName) );

  // PerspectivesGlobals should be available on the global scope of the program that uses this library.
  const url = PerspectivesGlobals.host + useridentifier + "_models/" + modelName + "/screens.js"

  // importModule should be available on the global scope of the program that uses this library.
  return importModule( url ).then(
    function(r)
    {
      if (!r[ screenName ])
      {
        throw "importRoleScreen: no screen is defined for '" + screenName + "' in model '" + modelName + "'!";
      }
      return r[ screenName ];
    }
  );
}

function Loading(props) {
  if (props.error) {
    return <div>Error! <button onClick={ props.retry }>Retry</button></div>;
  } else {
    return <div>Loading...</div>;
  }
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
  }

  componentDidMount ()
  {
    const component = this;
    Perspectives.then(
      function(pproxy)
      {
        pproxy.getMeForContext( component.props.rolinstance,
          function(userRoles)
          {
            component.setState({myroletype: userRoles[0]});
          })
        pproxy.getUserIdentifier(
          function(userIdentifier)
          {
            component.setState({useridentifier: userIdentifier[0]});
          }
        );
      }
    );
  }

  render ()
  {
    const component = this;

    if (component.stateIsComplete())
    {
      const LoadableScreen = Loadable({
        loader: () => importRoleScreen( component.state.myroletype, component.state.useridentifier ),
        loading: Loading,
      });
      return <ContextOfRole rolinstance={component.props.rolinstance} myroletype={component.state.myroletype}><LoadableScreen/></ContextOfRole>;
    }
    else
      return <div></div>
  }
}

Screen.contextType = PSContext;

Screen.propTypes = {};
