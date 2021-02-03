const React = require("react");
import {deconstructLocalName} from "./urifunctions.js";
import Rol from "./rol.js";
import View from "./view.js";
import {PSView} from "./reactcontexts.js";
import ExternalRole from "./externalrole.js";
import BindDropZone from "./binddropzone.js";
import roleInstance from "./roleinstance.js";

import
  { Row
  , Col
  , Form
  , Card
  } from "react-bootstrap";
const PropTypes = require("prop-types");

////////////////////////////////////////////////////////////////////////////////
// ROLEFORM
////////////////////////////////////////////////////////////////////////////////

export default function RoleForm (props)
{
  function roleForm (psview)
  {
    var DraggableCard;
    const cardProp = props.cardprop;
    if (cardProp)
    {
      DraggableCard = roleInstance(
        React.forwardRef((props, ref) =>
          <PSView.Consumer>
            {
              value => <Card ref={ref} aria-label={value.propval(cardProp)}>
                <Card.Body>
                  <p>{value.propval(cardProp)}</p>
                </Card.Body>
              </Card>
          }
          </PSView.Consumer>));
    }
    return  <BindDropZone ariaLabel="To set this contract to a particular user, drag his or her card over here and drop it.">
              {
                psview.viewproperties.map(
                  function( propName )
                    {
                      const localName = deconstructLocalName (propName);
                      return  <Form.Group as={Row} key={propName}>
                                <Form.Label column sm="3">{ localName }</Form.Label>
                                <Col sm="9">
                                  <Form.Control aria-label={ localName } defaultValue={psview.propval(propName)} onBlur={e => psview.propset(propName, e.target.value)}/>
                                </Col>
                              </Form.Group>;
                    })
                }
                {
                  cardProp !== undefined ? <Row><DraggableCard labelProperty={cardProp}/></Row> : <div/>
                }

            </BindDropZone>;
  }
  if (props.rolename == "External")
  {
    return  <ExternalRole>
              <View viewname={props.viewname}>
                <PSView.Consumer>
                { roleForm }
                </PSView.Consumer>
              </View>
            </ExternalRole>;
  }
  else
  {
    return  <Rol rol={props.rolename}>
              <View viewname={props.viewname}>
                <PSView.Consumer>
                { roleForm }
                </PSView.Consumer>
              </View>
            </Rol>;
  }
}

RoleForm.propTypes =
  { viewname: PropTypes.string.isRequired
  , rolename: PropTypes.string.isRequired
  , cardprop: PropTypes.string
};
