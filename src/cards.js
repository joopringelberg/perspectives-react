import React from "react";

import View from "./view.js";

import {PSView} from "./reactcontexts.js";

import RolBinding from "./rolbinding.js"

import roleInstance from "./roleinstance.js"

import {Card} from "react-bootstrap";

window.ReactCards = React;

console.log( "Does react-dom import the same react as perspectives-react? " + (window.ReactOfReactDom === window.ReactCards));

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
// SIMPLECARD
////////////////////////////////////////////////////////////////////////////////
export const SimpleCard = React.forwardRef((props, ref) =>
  <View viewname="allProperties">
    <PSView.Consumer>
      {value => <Card ref={ref}>
        <Card.Body>
          <p>{value.propval("Name")}</p>
          <p>{value.propval("Description")}</p>
        </Card.Body>
      </Card>}
    </PSView.Consumer>
  </View>);

export const SimpleCardForRoleBinding = roleInstance ( roleBindingCardHolder( SimpleCard ) );

export const SimpleCardForRole = roleInstance ( SimpleCard );
