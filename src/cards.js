import React from "react";

import View from "./view.js";

import {PSView} from "./reactcontexts.js";

import RolBinding from "./rolbinding.js"

import roleInstance from "./roleinstance.js"

import {Card} from "react-bootstrap";

///////////////////////////////////////////////////////////////////////////////
// ROLEBINDINGCARDHOLDER
////////////////////////////////////////////////////////////////////////////////
// CardComponent should be constructed with React.forwardRef.
// The Card will be coupled to the *binding* of the Role rather than its instance itself.
export function roleBindingCardHolder( CardComponent )
{
  return React.forwardRef((props, ref) =>
    (<RolBinding>
      <CardComponent ref={ref}/>
    </RolBinding>));
}

///////////////////////////////////////////////////////////////////////////////
// EMPTYCARD
// Bind the result of emptyCard to a name, then use that name as a component:
//   const ContactCard = emptyCard( "allProperties", value => <p>Contact card of {value.propval("Voornaam")}.</p>);
//   <ContactCard/>
// Use roleInstance to make it draggable:
//   const ContactCard = roleInstance( emptyCard( "allProperties", value => <p>Contact card of {value.propval("Voornaam")}.</p>) );
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
// <CardList rol="User"><ContactCard/></CardList>
////////////////////////////////////////////////////////////////////////////////
export const SimpleCard = emptyCard( "allProperties",
  props => <div>
            <p>{props.propval("Name")}</p>
            <p>{props.propval("Description")}</p>
          </div> )

export const SimpleCardForRoleBinding = roleInstance ( roleBindingCardHolder( SimpleCard ) );

export const SimpleCardForRole = roleInstance ( SimpleCard );
