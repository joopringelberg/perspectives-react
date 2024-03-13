// NOTE DEPENDENCIES. Code in this section is adapted from module Perspectives.Identifiers.

// deconstructSegments :: String -> String
// For type identifiers: from model://some.domain#System$any$segment, take any$segment.
export function deconstructSegments(s) {
  const typePattern = "^(model://[^/]+#[A-Z][^\\$]+)\\$?(.*)$";
  try
  {
    return s.match(typePattern)[2];
  } catch (e)
  {
    throw "deconstructSegments: no local name in '" + s + "'.";
  }
}

// From "model://some.authority#Modelname$Sometype$Subtype" return "Subtype";
export function deconstructLocalName(s){
  const localNameRegEx = new RegExp("^model://[^/]+#[A-Z][^#/]+\\$([A-Z][^\\$/]*)$");
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
  return s + "$External";
}

export function isExternalRole( s )
{
  const r = new RegExp("External$");
  return !!s.match(r);
}

export function deconstructContext( s )
{
  const matches = s.match(/(.*?)(?:\$External)/);
  if ( matches )
  {
    return matches[1];
  }
  else
  {
    return s;
  }
}

// TODO!
// From a type identifier, retrieve the name of the file of the local version of a model.
// "model://some.authority#Modelname$Sometype" should result in some_authority-Modelname.json.
// We achieve this by first capturing the part following "model://" and before the first "$",
// then replacing "." by "_" and "#" by "-".
export function deconstructModelName( s )
{
  const typeRegex = new RegExp( "^model://([^/]+#[A-Z][^\\$]+)\\$?.*$" );
  const m = s.match(typeRegex);
  if ( m )
  {
    return m[1].replace(".", "_").replace("#", "-");
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

// Is this a type identifier?
export function isQualifiedName(s)
{
  const typeRegEx = new RegExp( "^(model://[^/]+#[A-Z][^\\$]+)\\$?(.*)$" );
  return s.match(typeRegEx);
}

// Is this a resource identifier?
export function isSchemedResourceIdentifier(s)
{
  const schemedResourceRegEx = new RegExp( "^(def|loc|rem|pub|model|):(.*)$" );
  return s.match(schemedResourceRegEx);
}
