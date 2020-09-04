const Perspectives = require("perspectives-proxy").Perspectives;

export default function importContexts(fileList)
{
  // A slight check.
  function isTransaction (t)
  {
    if ( !t.contents ) { return false; }
    if ( !t.contents.timeStamp ) { return false; }
    if ( !t.contents.deltas ) { return false; }
    return true;
  }
  const theFile = fileList.item(0)
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
          Perspectives.then(
            function(pproxy)
            {
              pproxy.importTransaction( json,
                  function( buitenRolId )
                  {
                   // nothing to do here.
                 } );
            });
        }
        else
        {
          alert("Not a valid Perspectives serialisation!")
        }
      });
    }
    else
    {
      alert("Not JSON!")
    }
  }
  else
  {
    alert("No file present!")
  }
}
