const PDRproxy = require("perspectives-proxy").PDRproxy;

export default function importTransaction(theFile)
{
  // A slight check.
  function isTransaction (t)
  {
    if ( !t.contents ) { return false; }
    if ( !t.contents.timeStamp ) { return false; }
    if ( !t.contents.deltas ) { return false; }
    return true;
  }
  if (theFile)
  {
    if (theFile.type == "application/json")
    {
      theFile.text().then( function(t)
      {
        const json = JSON.parse(t);
        if (isTransaction( json ))
        {
          // debugger;
          // Now send to the PDR.
          PDRproxy.then(
            function(pproxy)
            {
              pproxy.importTransaction( json,
                  function( /*buitenRolId*/ )
                  {
                   // nothing to do here.
                   // if an error arises in the PDR, the proxy for the Api will handle it.
                 } );
            });
        }
        else
        {
          alert("Not a valid Perspectives serialisation!");
        }
      });
    }
    else
    {
      alert("Not JSON!");
    }
  }
  else
  {
    alert("No file present!");
  }
}
