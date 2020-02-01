// NOTE DEPENDENCIES. Code in this section is adapted from module Perspectives.Identifiers.
// Returns "localName" from "model:ModelName$localName" or Nothing

// deconstructSegments :: String -> String
// NOTE DEPENDENCY. This code is adapted from module Perspectives.Identifiers.
function deconstructSegments(s) {
  const localPartsRegEx = new RegExp("^model:\\w*\\$(.*)$");
  try
  {
    return s.match(localPartsRegEx)[1];
  } catch (e)
  {
    throw "deconstructSegments: no local name in '" + s + "'.";
  }
}

// A Namespace has the form "model:Name"
function externalRole( s )
{
  const modelRegEx = new RegExp("^model:(\\w*)$");
  if (s.match(modelRegEx))
  {
    return s + "$_External";
  }
  else
  {
    return s + "_External";
  }
}

// Construct a directoryname from a modelname.
// Each modelname must be unique.
// It is the composition of "model:" and the name proper.
// So all we need do to create a directoryname is to get the first fragment, i.e.
// the part after "model:" and before the first "$".
function deconstructModelName( s )
{
  const namespaceRegex = new RegExp("^(model:\\w*)");
  const m = s.match(namespaceRegex);
  if ( m )
  {
    return m[1];
  }
  else {
    throw "deconstructModelName: the string '" + s + "' is not a well-formed domeinURI";
  }
}

function getQualifiedPropertyName (localName, qualifiedNames)
{
    // Match the local propertyname given as a prop with the qualified names in context.
    const r = new RegExp(".*" + localName + "$");
    const n = qualifiedNames.filter( qn => qn.match(r));
    if (n.length > 1) {
      throw "PROGRAMMER WARNING: '" + localName + "' does not uniquely identify a property. Choose one of: " + n;
      }
    else if (n == undefined) {
      throw "PROGRAMMER WARNING: '" + localName + "' does not match of the properties " + qualifiedNames;
    }
    else {
      return n[0];
    }
}


module.exports =
  {
      deconstructSegments: deconstructSegments,
      externalRole: externalRole,
      deconstructModelName: deconstructModelName,
      getQualifiedPropertyName: getQualifiedPropertyName
  }
