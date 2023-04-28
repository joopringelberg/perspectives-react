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

import React from 'react';
const PropTypes = require("prop-types");

import PerspectivesComponent from "./perspectivescomponent.js";
import {LinkExternalIcon} from '@primer/octicons-react';
import i18next from "i18next";

import {OverlayTrigger, Tooltip} from "react-bootstrap";

export default class OpenPublicResource extends PerspectivesComponent
{
  constructor( props )
  {
    super(props);
  }

  handleKeyDown(e)
  {
    const component = this;
    switch (e.keyCode){
      case 13: // Return
      case 32: // space
        component.openPublicResource(e);
        break;
    }
  }

  openPublicResource(e)
  {
    const component = this;
    e.stopPropagation();
    e.preventDefault();
    if (component.props.rolekind == "ContextRole" || component.props.rolekind == "ExternalRole")
    {
      window.open("/?" + component.props.publicurl);
    }
    else
    {
      // TODO. RoleForm openen werkt niet meer.
      window.open("/?openroleform=" + component.props.publicurl
        // + "&viewname=" + viewname +
        // (component.props.cardprop ? "&cardprop=" + component.props.cardprop : "")
        );
    }
  }

  render()
  {
    const component = this;
    const renderTooltip = (props) => (
    <Tooltip id="openPublicResource-tooltip" {...props} show={
       // eslint-disable-next-line react/prop-types
      props.show.toString()}>
      { i18next.t("openPublicResource", {ns: "preact"}) }
    </Tooltip> );

    const eventDiv = React.createRef();

    return  <OverlayTrigger
                      placement="left"
                      delay={{ show: 250, hide: 400 }}
                      overlay={renderTooltip}
                    >
                    <div
                        ref={eventDiv}
                        className="ml-3 mr-3"
                        aria-describedby="openPublicResource-tooltip"
                        tabIndex="0"
                        onKeyDown={ e => component.handleKeyDown(e) }
                        onClick={ e => component.openPublicResource(e)}
                    >
                    <LinkExternalIcon
                      alt={ i18next.t("openPublicResource", {ns: "preact"}) }
                      aria-label={ i18next.t("openPublicResource", {ns: "preact"}) }
                      className="iconStyle"
                      size="medium"
                    />
                    </div>
              </OverlayTrigger>;
  }
}

OpenPublicResource.propTypes = 
  { publicurl: PropTypes.string.isRequired 
  , rolekind: PropTypes.string.isRequired
  };
