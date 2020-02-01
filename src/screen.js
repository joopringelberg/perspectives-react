import { deconstructModelName, deconstructSegments } from "./urifunctions.js";
import Loadable from 'react-loadable';
const Perspectives = require("perspectives-proxy").Perspectives;
const PerspectivesComponent = require("./perspectivescomponent.js");
const ContextOfRole = require("./contextofrole.js");
import {PSContext} from "./reactcontexts";

// TODO. Even though PerspectivesGlobals has been declared external, we cannot import it here.
// Doing so will cause a runtime error if the calling program has not put it on the global scope in time.

function importRoleScreen( roleName )
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
  const url = PerspectivesGlobals.host + "perspect_models/" + modelName + "/screens.js"

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

class Screen extends PerspectivesComponent
{
  constructor (props)
  {
    super(props);
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
      }
    );
  }

  render ()
  {
    const component = this;

    if (component.stateIsComplete())
    {
      const LoadableScreen = Loadable({
        loader: () => importRoleScreen( component.state.myroletype ),
        loading: Loading,
      });
      return <ContextOfRole rolinstance={component.props.rolinstance}><LoadableScreen/></ContextOfRole>;
    }
    else
      return <div></div>
  }
}

Screen.contextType = PSContext;

Screen.propTypes = {};

module.exports = Screen;
