// NOTE DEPENDENCIES. Code in this section is adapted from module Perspectives.Identifiers.
// Returns "localName" from "model:ModelName$localName" or Nothing

// deconstructSegments :: String -> String
// NOTE DEPENDENCY. This code is adapted from module Perspectives.Identifiers.
export function deconstructSegments(s) {
  const localPartsRegEx = new RegExp("^model:\\w*\\$(.*)$");
  try
  {
    return s.match(localPartsRegEx)[1];
  } catch (e)
  {
    throw "deconstructSegments: no local name in '" + s + "'.";
  }
}

export function deconstructLocalName(s){
  const localNameRegEx = new RegExp(".*\\$(\\w+)");
  try
  {
    return s.match(localNameRegEx)[1];
  } catch (e)
  {
    throw "deconstructLocalName: no local name in '" + s + "'.";
  }
}

// A Namespace has the form "model:Name"
export function externalRole( s )
{
  const modelRegEx = new RegExp("^model:(\\w*)$");
  if (s.match(modelRegEx))
  {
    return s + "$_External";
  }
  else
  {
    return s + "$External";
  }
}

export function isExternalRole( s )
{
  const r = new RegExp("External$");
  return !!s.match(r);
}

export function deconstructContext( s )
{
  const matches = s.match(/(.*?)(?:\$_External|\$External)/);
  if ( matches )
  {
    return matches[1];
  }
  else
  {
    return s;
  }
}

// Construct a directoryname from a modelname.
// Each modelname must be unique.
// It is the composition of "model:" and the name proper.
// So all we need do to create a directoryname is to get the first fragment, i.e.
// the part after "model:" and before the first "$".
export function deconstructModelName( s )
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

export function getQualifiedPropertyName (localName, qualifiedNames)
{
    // Match the local propertyname given as a prop with the qualified names in context.
    const r = new RegExp(".*" + localName + "$");
    const n = qualifiedNames.filter( qn => qn.match(r));
    if (qualifiedNames.indexOf(localName) > -1)
    {
      return localName;
    }
    if (n.length > 1) {
      throw "PROGRAMMER WARNING: '" + localName + "' does not uniquely identify a property. Choose one of: " + n;
      }
    else if (n == undefined || n.length == 0) {
      throw "PROGRAMMER WARNING: '" + localName + "' does not match of the properties " + qualifiedNames;
    }
    else {
      return n[0];
    }
}

// Is the identifier of the form `model:Domain$atLeastOneSegment`?
export function isQualifiedName(s)
{
  const qualifiedNameRegex = new RegExp( "^model:(\\w*)\\$(.*)$" );
  return s.match(qualifiedNameRegex);
}
