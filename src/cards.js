import React from "react";

import View from "./view.js";

import {PSView} from "./reactcontexts.js";

import roleInstance from "./roleinstance.js";

import {Card} from "react-bootstrap";

///////////////////////////////////////////////////////////////////////////////
// EMPTYCARD
// Bind the result of emptyCard to a name, then use that name as a component:
//   const ContactCard = emptyCard( "allProperties", value => <p>Contact card of {value.propval("Voornaam")}.</p>);
//   <ContactCard labelProperty="Voornaam"/>
// Use roleInstance to make it draggable:
//   const ContactCard = roleInstance( emptyCard( "allProperties", value => <p>Contact card of {value.propval("Voornaam")}.</p>) );
// This component should supply a prop `labelProperty` that will be read as property value from the view, functioning as the ARIA-label.
////////////////////////////////////////////////////////////////////////////////
export function emptyCard (viewname, Content)
  {
    return React.forwardRef((props, ref) =>
            <View viewname={viewname}>
              <PSView.Consumer>
                {value => <Card ref={ref} aria-label={value.propval(props.labelProperty)}>
                  <Card.Body>
                    {Content(value)}
                  </Card.Body>
                </Card>}
              </PSView.Consumer>
            </View>);
}
// TODO. Onderzoek de mogelijkheid om propTypes te gebruiken voor het resultaat van emptyCard.

///////////////////////////////////////////////////////////////////////////////
// SIMPLECARD
// Use like this:
// const ContactCard = PR.emptyCard( "allProperties", value => <p>{value.propval("Voornaam")}</p>);
// <Rol rol="User"><ContactCard/></Rol>
////////////////////////////////////////////////////////////////////////////////
export const SimpleCard = emptyCard( "allProperties",
  props => <div>
            <p>{props.propval("Name")}</p>
            <p>{props.propval("Description")}</p>
          </div> );

export const SimpleCardForRole = roleInstance ( SimpleCard );
