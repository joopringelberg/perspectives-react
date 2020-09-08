import PropTypes from "prop-types";

import {PSView} from "./reactcontexts.js";

import {Form, Row, Col, } from "react-bootstrap";

export default function SetBoolAsCheckbox ({propertyname, label})
{
  return  <PSView.Consumer>
            {sprops => {
              const val = sprops.propval(propertyname)[0] == ["true"];
              return <Form.Group as={Row}>
                <Col>
                  <Form.Check
                    inline
                    aria-labelledby={propertyname + "_BoolAsCheckbox"}
                    checked={val ? "checked" : null}
                    aria-checked={!!val}
                    disabled={val ? "disabled" : null}
                    // We start out with false and only allow changing once, so that must be to "true"!
                    onChange={e => sprops.propset(propertyname, "true" )} />
                </Col>
                <Form.Label id={propertyname + "_BoolAsCheckbox"}>{label}</Form.Label>
              </Form.Group>}}
          </PSView.Consumer>

}

SetBoolAsCheckbox.propTypes =
  { propertyname: PropTypes.string
  , label: PropTypes.string
  , val: PropTypes.bool
  };
