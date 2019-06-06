// NOTE DEPENDENCIES. Code in this section is adapted from module Perspectives.Identifiers.
// Returns "localName" from "model:ModelName$localName" or Nothing

// deconstructLocalNameFromDomeinURI_ :: String -> String
// NOTE DEPENDENCY. This code is adapted from module Perspectives.Identifiers.
function deconstructLocalNameFromDomeinURI_(s) {
  // domeinURIRegex :: Regex
  const domeinURIRegex = new RegExp("^(model:\\w*.*)\\$(\\w*)");
  try
  {
    return s.match(domeinURIRegex)[2];
  } catch (e)
  {
    throw "deconstructLocalNameFromDomeinURI_: no local name in '" + s + "'.";
  }
}

// A Namespace has the form "model:Name"
function buitenRol( s )
{
  const modelRegEx = new RegExp("^model:(\\w*)$");
  if (s.match(modelRegEx))
  {
    return s + "$_buitenRol";
  }
  else
  {
    return s + "_buitenRol";
  }
}

function binnenRol( s )
{
  const modelRegEx = new RegExp("^model:(\\w*)$");
  if (s.match(modelRegEx))
  {
    return s + "$_binnenRol";
  }
  else
  {
    return s + "_binnenRol";
  }
}

function deconstructNamespace( s )
{
  const domeinURIRegex = new RegExp("^(model:\\w*.*)\\$(\\w*)");
  const m = s.match(domeinURIRegex);
  if ( m )
  {
    return m[1];
  }
  else {
    throw "deconstructNamespace: the string '" + s + "' is not a well-formed domeinURI";
  }
}

// Construct a directoryname from a modelname.
// Each modelname must be unique.
// It is the composition of "model:" and the name proper.
// So all we need do to create a directoryname is to get the first fragment, i.e.
// the part after "model:" and before the first "$".
function getModelName( s )
{
  const modelRegExp = new RegExp("^(model:)(\\w*).*");
  const m = s.match(modelRegExp);
  if ( m )
  {
    return m[2];
  }
  else {
    throw "getModelName: the string '" + s + "' is not a well-formed domeinURI";
  }
}

module.exports =
  {
      deconstructLocalNameFromDomeinURI_: deconstructLocalNameFromDomeinURI_,
      buitenRol: buitenRol,
      binnenRol: binnenRol,
      deconstructNamespace: deconstructNamespace,
      getModelName: getModelName
  }
