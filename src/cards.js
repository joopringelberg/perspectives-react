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
export function roleBindingCardHolder( CardComponent )
{
  return React.forwardRef((props, ref) =>
    (<RolBinding>
      <CardComponent ref={ref}/>
    </RolBinding>));
}

///////////////////////////////////////////////////////////////////////////////
// EMPTYCARD
////////////////////////////////////////////////////////////////////////////////
export function emptyCard (viewname, Content)
  {
    return React.forwardRef((props, ref) =>
            <View viewname={viewname}>
              <PSView.Consumer>
                {value => <Card ref={ref}>
                  <Card.Body>
                    {Content(value)}
                  </Card.Body>
                </Card>}
              </PSView.Consumer>
            </View>);
}

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
