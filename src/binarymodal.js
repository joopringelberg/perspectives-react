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

import
  { Button
  , Modal
  } from "react-bootstrap";

// import React, { useState } from 'react';
import React from 'react';

const PropTypes = require("prop-types");

export default function BinaryModal(props) {
  return (
      <Modal
        show={props.show}
        onHide={props.close}
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>{props.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{props.message}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={props.yes}>
            Yes
          </Button>
          <Button variant="primary" onClick={props.no}>
            No
          </Button>
        </Modal.Footer>
      </Modal>
  );
}
BinaryModal.propTypes =
  { title: PropTypes.string.isRequired
  , message: PropTypes.string.isRequired
  , show: PropTypes.bool.isRequired
  , yes: PropTypes.func
  , no: PropTypes.func
  , close: PropTypes.func
  };
