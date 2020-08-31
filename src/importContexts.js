const Perspectives = require("perspectives-proxy").Perspectives;

export default function importContexts(fileList)
{
  function isContextSerialisation (t)
  {
    const firstContext = t[0];
    if (firstContext)
    {
      return firstContext.rollen && firstContext.id && firstContext.ctype;
    }
  }
  const theFile = fileList.item(0)
  if (theFile)
  {
    if (theFile.type == "application/json")
    {
      theFile.text().then( function(t)
      {
        const json = JSON.parse(t);
        if (isContextSerialisation( json ))
        {
          // debugger;
          // Now send to the PDR.
          Perspectives.then(
            function(pproxy)
            {
              pproxy.importContexts( json,
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
