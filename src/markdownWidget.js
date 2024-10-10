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

import { Component } from "react";
import PropTypes from "prop-types";
import {PDRproxy} from "perspectives-proxy";

import markdownit from 'markdown-it'
const md = markdownit();

const markdownPerspectives = require('./perspectives-markdown');
// https://www.npmjs.com/package/markdown-it-link-attributes
var mila = require("markdown-it-link-attributes");

md.use(markdownPerspectives);
// All hyperlinks will open in a new tab or window.
md.use(mila, {
  attrs: {
    target: "_blank"
  },
});


if (!window.$perspectives_entry_point_for_markdown$)
{
  window.$perspectives_entry_point_for_markdown$ = 
    { opencontext: function(event, roleIdentifier)
        {
          event.preventDefault();
          event.stopPropagation();
          // NOTICE dependency on MyContexts App.js! Instead, put handlers in the screen component.
          (document.getElementById('__MyContextsContainer__')).dispatchEvent( new CustomEvent('OpenContext', { detail: roleIdentifier, bubbles: true }) );
        }
    , runaction: function(event, actionName, contextid, myroletype)
        {
          event.preventDefault();
          event.stopPropagation();

          PDRproxy.then(
            function (pproxy)
            {
                pproxy.contextAction(
                  contextid
                  , myroletype  // authoringRole
                  , actionName)
                .catch(e => UserMessagingPromise.then( um => 
                  um.addMessageForEndUser(
                    { title: i18next.t("action_title", { ns: 'preact' }) 
                    , message: i18next.t("action_message", {ns: 'preact', action: actionName})
                    , error: e.toString()
                    })));  
              });
        }

    }
}

export class MarkDownWidget extends Component
{
  constructor(props)
  {
    super(props);
  }
  render()
  {
    const component = this;
    const htmlString = md.render( component.props.markdown );
    const htmlString_ = htmlString.replace(/__contextid__/g, component.props.contextid).replace( /__myroletype__/g, component.props.myroletype);

    return <div dangerouslySetInnerHTML={{ __html: htmlString_ }} />
  }

}
MarkDownWidget.propTypes = 
  { markdown: PropTypes.string.isRequired
  , contextid: PropTypes.string.isRequired
  , myroletype: PropTypes.string.isRequired
  };

// Use this component to create html from markdown that is provided as a property of the component itself, in the page.
// It may use the link instruction, but cannot use the action instruction.
export class UnboundMarkDownWidget extends Component
{
  constructor(props)
  {
    super(props);
  }
  render()
  {
    const component = this;
    return <div dangerouslySetInnerHTML={{ __html: md.render( component.props.markdown ) }} />
  }
}

UnboundMarkDownWidget.propTypes = 
  { markdown: PropTypes.string.isRequired
  };