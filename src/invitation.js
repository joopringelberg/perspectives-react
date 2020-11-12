import React from "react";

import
  { Button
  , Form
  , Row
  , Col
  } from "react-bootstrap";

import {PSView} from "./reactcontexts.js";
import {ViewOnExternalRole} from "./views.js";
import SetBoolAsCheckbox from "./setboolascheckbox.js";

export default function Invitation()
{
  function InvitationCard(props)
  {
    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    if ( props.required )
    {
      return  <>
                <Form.Group as={Row}>
                  <Form.Label column sm="3" id="MessageId">Message:</Form.Label>
                  <Col sm="9">
                    <PSView.Consumer>
                      {props => <Form.Control aria-labelledby="MessageId" aria-describedby="messageDescriptionID" defaultValue={props.propval("Message")} onBlur={e => props.propset("Message", e.target.value)} />}
                    </PSView.Consumer>
                  </Col>
                  <Col sm="9">
                    <Form.Text className="text-muted" id="messageDescriptionID">
                      Enter a text message to invite your contact with.
                    </Form.Text>
                  </Col>
                </Form.Group>
                <Row>
                  <Col>
                    <Button
                      variant="primary"
                      onClick={ () => download("invitation.json", props.serialisation) }
                      disabled={props.serialisation[0] ? null : true}
                      >Download invitation file</Button>
                  </Col>
                  <Col><p>Click the button to download an invitation file. An invitation file is personal! Send it to the person you want to invite to connect, through a secure channel.</p></Col>
                </Row>
              </>;
    }
    else
    {
      return <div/>;
      }
  }

  return  <ViewOnExternalRole viewname="allProperties">
            <PSView.Consumer>
              {value => (
                  <>
                    <SetBoolAsCheckbox
                      propertyname="IWantToInviteAnUnconnectedUser"
                      label="I want to invite someone I have no contact card for"
                    />
                    <InvitationCard required={value.propval("IWantToInviteAnUnconnectedUser")[0] == ["true"]} serialisation={value.propval("SerialisedInvitation") }/>
                  </>)}
            </PSView.Consumer>
          </ViewOnExternalRole>;

}
