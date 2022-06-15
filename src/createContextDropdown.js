// BEGIN LICENSE
// Perspectives Distributed Runtime
// Copyright (C) 2019 Joop Ringelberg (joopringelberg@perspect.it), Cor Baars
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
//
// Full text of this license can be found in the LICENSE file in the projects root.
// END LICENSE

import React, { Component } from "react";
import {Dropdown} from 'react-bootstrap';
import {PlusIcon} from '@primer/octicons-react';
const PropTypes = require("prop-types");

export default class CreateContextDropDown extends Component
{
  constructor()
  {
    super();
    this.state = {actions: []};
  }

  render()
  {
    const component = this;
    if (component.props.contexts.length == 0)
    {
      return  <div
                className="ml-3 mr-3"
                tabIndex="0"
                onClick={ () => component.props.create() }
                onKeyDown={ ev => component.handleKeyDown(ev)}
              >
                <PlusIcon alt="Add a row" aria-label="Click to add a row" size='medium'/>
              </div>
    }
    else
    {
      return  <Dropdown
                id="dropdown-createContext"
                title="Contexts to create"
                focusFirstItemOnShow={false}
                variant="secondary"
                size="sm"
                onSelect={ component.props.create }>
                <Dropdown.Toggle as={CustomToggle} id="CreateContext_Toggle" disabled={component.props.contexts.length == 0}>
                  <PlusIcon alt="Contexts to create" aria-label="Contexts to create" size="medium"/>
                </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {
                      component.props.contexts.map(
                        function(contextName)
                        {
                          return    <Dropdown.Item
                                      key={contextName}
                                      eventKey={contextName}
                                    >{
                                      contextName // TODO This must be a displayname.
                                    }</Dropdown.Item>;
                        }
                      )
                    }
                  </Dropdown.Menu>
              </Dropdown>;
    }
  }
}

CreateContextDropDown.propTypes =
  { create: PropTypes.func
  , contexts: PropTypes.arrayOf(PropTypes.string)
  };

// eslint-disable-next-line react/display-name, react/prop-types
const CustomToggle = React.forwardRef(({ children, onClick, disabled }, ref) => (
  <a
    href=""
    ref={ref}
    className={disabled ? "disabledIconStyle" : "iconStyle"}
    onClick={(e) => {
      e.preventDefault();
      if (!disabled)
      {
        onClick(e);
      }
    }}
  >
    {children}
    &#x25bc;
  </a>
));
