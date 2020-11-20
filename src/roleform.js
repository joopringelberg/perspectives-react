const React = require("react");
import {deconstructLocalName, getQualifiedPropertyName} from "./urifunctions.js";
import Rol from "./rol.js";
import View from "./view.js";
import {PSView} from "./reactcontexts.js";
import ExternalRole from "./externalrole.js";
import
  { Row
  , Col
  , Form
  } from "react-bootstrap";
const PropTypes = require("prop-types");

////////////////////////////////////////////////////////////////////////////////
// ROLEFORM
////////////////////////////////////////////////////////////////////////////////

export default function RoleForm (props)
{
  function roleForm (psview)
  {
    var cardProperty;
    if (props.cardprop)
    {
      cardProperty = getQualifiedPropertyName(props.cardprop, psview.viewproperties);
    }
    return psview.viewproperties.map(
      function( propName )
        {
          const localName = deconstructLocalName (propName);
          return  <Form.Group as={Row} key={propName}>
                    <Form.Label column sm="3">{ localName }</Form.Label>
                    <Col sm="9">
                      <Form.Control aria-label={ localName } defaultValue={psview.propval(propName)} onBlur={e => psview.propset(propName, e.target.value)}/>
                    </Col>
                  </Form.Group>;
        }
    );
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
