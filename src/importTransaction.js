const PDRproxy = require("perspectives-proxy").PDRproxy;
import {UserMessagingPromise} from "./userMessaging.js";
import i18next from "i18next";

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
          PDRproxy
            .then( pproxy => pproxy.importTransaction( json ) )
            .catch(e => UserMessagingPromise.then( um => 
              um.addMessageForEndUser(
                { title: i18next.t("importTransaction_title", { ns: 'preact' }) 
                , message: i18next.t("importTransaction_message", {ns: 'preact'})
                , error: e.toString()
                })));
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
