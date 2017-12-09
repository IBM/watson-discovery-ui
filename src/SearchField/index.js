/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Input } from 'semantic-ui-react';

/**
 * This object renders a search field at the bottom of the web page.
 * This object must determine when the user has entered a new
 * search value and then propogate it to the parent.
 */
export default class SearchField extends React.Component {
  constructor(...props) {
    super(...props);
    this.state = {
      searchQuery: this.props.searchQuery || ''
    };
  }

  /**
   * handleKeyPress - user has entered a new search value. 
   * Pass on to the parent object.
   */
  handleKeyPress(event) {
    const searchValue = event.target.value;
    if (event.key === 'Enter') {
      this.props.onSearchQueryChange({
        searchQuery: searchValue
      });
    }
  }

  /**
   * render - return the input field to render.
   */
  render() {
    return (
      <div>
        <Input
          className='searchinput'
          icon='search'
          placeholder='Enter search string...'
          onKeyPress={this.handleKeyPress.bind(this)}
          defaultValue={this.state.searchQuery}
        />
      </div>
    );
  }
}

// type check to ensure we are called correctly
SearchField.propTypes = {
  onSearchQueryChange: PropTypes.func.isRequired,
  searchQuery: PropTypes.string
};
