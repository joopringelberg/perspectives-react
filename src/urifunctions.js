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

module.exports =
  {
      deconstructLocalNameFromDomeinURI_: deconstructLocalNameFromDomeinURI_,
      buitenRol: buitenRol,
      binnenRol, binnenRol,
      deconstructNamespace: deconstructNamespace
  }
