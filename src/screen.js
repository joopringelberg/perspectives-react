import { getModelName, deconstructLocalNameFromDomeinURI_ } from "./urifunctions.js";
import Loadable from 'react-loadable';

// TODO. Even though PerspectivesGlobals has been declared external, we cannot import it here.
// Doing so will cause a runtime error if the calling program has not put it on the global scope in time.

function importRoleScreen( roleName )
{
  // modelName = model part of the roleName
  const modelName = "model:" + getModelName( roleName );

  // screenName = local part of the roleName
  const screenName = deconstructLocalNameFromDomeinURI_(roleName);

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

function Screen(props)
{
  const LoadableScreen = Loadable({
    loader: () => importRoleScreen( props.roltype ),
    loading: Loading,
  });
  return <LoadableScreen/>;
}

module.exports = Screen;
