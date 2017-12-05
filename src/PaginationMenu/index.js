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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Menu } from 'semantic-ui-react';

export default class PaginationMenu extends React.Component {
  constructor(...props) {
    super(...props);
    this.state = {
      currentPage: this.props.currentPage || '1'
    };
  }

  handleItemClick(event, { name }) {
    console.log('page number = ' + name);
    this.setState({ currentPage: name });
  }

  render() {
    const { currentPage } = this.state;

    return (
      <div>
        <Menu pagination>
          <Menu.Item 
            name='1'
            active={currentPage === '1'}
            onClick={this.handleItemClick.bind(this)}
          />
          <Menu.Item 
            name='2'
            active={currentPage === '2'}
            onClick={this.handleItemClick.bind(this)}
          />
          <Menu.Item 
            name='3'
            active={currentPage === '3'}
            onClick={this.handleItemClick.bind(this)}
          />
          <Menu.Item 
            name='4'
            active={currentPage === '4'}
            onClick={this.handleItemClick.bind(this)}
          />
          <Menu.Item 
            name='5'
            active={currentPage === '5'}
            onClick={this.handleItemClick.bind(this)}
          />
        </Menu>
      </div>
    );
  }
}

PaginationMenu.propTypes = {
  // onSearchQueryChange: PropTypes.func.isRequired,
  // searchQuery: PropTypes.string
};
