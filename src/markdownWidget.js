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

import markdownit from 'markdown-it'
const md = markdownit();

export default class MarkDownWidget extends Component
{
  constructor(props)
  {
    super(props);
  }
  render()
  {
    const component = this;
    const htmlString = md.render( component.props.markdown );
    return <div dangerouslySetInnerHTML={{ __html: htmlString }} />
  }
}

MarkDownWidget.propTypes = 
  {
    markdown: PropTypes.string
  };