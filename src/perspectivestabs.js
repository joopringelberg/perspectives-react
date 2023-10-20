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

import React, { useState } from 'react';
import PropTypes from "prop-types";

import {TabDef} from "./perspectiveshape.js";

import {Tab, Container, Nav, Navbar} from "react-bootstrap";

export default function PerspectivesTabs(props)
{
  const [activeTabKey, setKey] = useState('activeTabKey');
  const component = this;
  const defaultKey = props.tabs[0] ? 0 : "";
  return (
    <Tab.Container defaultActiveKey={defaultKey} id="perspective-tabs" activeKey={activeTabKey}>
      <Navbar 
        collapseOnSelect 
        expand="md" 
        onSelect={setKey}
        className="pl-0"
        >
        <Navbar.Toggle aria-controls="tabtitles" />
        <Navbar.Collapse id="tabtitles">
          <Nav variant="tabs">
          {
            props.tabs.map((tab, index) => 
              <Nav.Item key={index}>
                <Nav.Link  eventKey={index}>{tab.title}</Nav.Link>
              </Nav.Item> 
            )
          }
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <Tab.Content>
      { props.children }
      </Tab.Content>
    </Tab.Container>
  );
}

PerspectivesTabs.propTypes =
  { tabs: PropTypes.arrayOf(TabDef)
  };
