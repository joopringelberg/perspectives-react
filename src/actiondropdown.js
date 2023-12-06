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
import {ZapIcon} from '@primer/octicons-react';
import PropTypes from "prop-types";

export default class ActionDropDown extends Component
{
  constructor()
  {
    super();
    this.state = {actions: []};
  }

  render()
  {
    const component = this;
    return  <Dropdown
              id="dropdown-action"
              title="Actions"
              focusFirstItemOnShow={false}
              variant="secondary"
              size="sm"
              onSelect={ component.props.runaction }>
              <Dropdown.Toggle as={CustomToggle} id="Actions_Toggle" disabled={component.props.actions.length == 0}>
                <ZapIcon alt="Actions to execute" aria-label="Actions to execute" size="medium"/>
              </Dropdown.Toggle>
                <Dropdown.Menu>
                  {
                    component.props.actions.map(
                      function(actionName)
                      {
                        return    <Dropdown.Item
                                    key={actionName}
                                    eventKey={actionName}
                                  >{
                                    actionName
                                  }</Dropdown.Item>;
                      }
                    )
                  }
                </Dropdown.Menu>
            </Dropdown>;
  }
}

ActionDropDown.propTypes =
  { runaction: PropTypes.func
  , actions: PropTypes.arrayOf(PropTypes.string)
  };

// eslint-disable-next-line react/display-name, react/prop-types
const CustomToggle = React.forwardRef(({ children, onClick, disabled }, ref) => (
  <a
    href=""
    ref={ref}
    className={disabled ? "text-muted" : "text-secondary"}
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
