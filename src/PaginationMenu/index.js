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
import { Menu, Icon } from 'semantic-ui-react';
const utils = require('../utils');
const MAX_MENU_ITEMS = 9;

export default class PaginationMenu extends React.Component {
  constructor(...props) {
    super(...props);
    const {
      currentPage,
      numMatches
    } = this.props;

    this.state = {
      currentPage: currentPage || '1',
      numMatches: numMatches
    };
  }

  // inform parent that page has changed
  handleItemClick(event, { name }) {
    console.log('page number = ' + name);
    this.setState({ currentPage: name });
    
    this.props.onPageChange({
      currentPage: name
    })
  }

  getMenuItemValues() {
    const { currentPage, numMatches } = this.state;
    var numPages = Math.ceil(numMatches / utils.ITEMS_PER_PAGE);
    var pageItems = [];
    var curPageInt = parseInt(currentPage);
    
    // handle case where we don't need to scroll menu items
    if (numPages <= MAX_MENU_ITEMS) {
      for (var i=1; i<=numPages; i++) {
        pageItems.push(i.toString());        
      }
      return pageItems;
    } 
    
    if (curPageInt == 1) {
      // we are on first page - so no 'prev' menu item needed
      for (var i=1; i<=MAX_MENU_ITEMS-3; i++) {
        pageItems.push(i.toString());        
      }
      pageItems.push('...');
      pageItems.push(numPages.toString());
      pageItems.push('next');
    } else if (curPageInt == numPages) {
      // we are on last page - so no 'next' menu item needed
      pageItems.push('prev');
      pageItems.push('1');
      pageItems.push('...');
      for (var i=numPages-MAX_MENU_ITEMS+3; i<=numPages; i++) {
        pageItems.push(i.toString());        
      }
    } else if (curPageInt <= 3) {
      // we are close to first page - so no '...' menu item at front needed
      pageItems.push('prev');
      pageItems.push('1');
      for (var i=2; i<=MAX_MENU_ITEMS-4; i++) {
        pageItems.push(i.toString());        
      }
      pageItems.push('...');
      pageItems.push(numPages.toString());
      pageItems.push('next');
    } else if (curPageInt >= numPages - 3) {
      // we are close to last page - so no '...' menu item at end needed
      pageItems.push('prev');
      pageItems.push('1');
      pageItems.push('...');
      for (var i=numPages-MAX_MENU_ITEMS+4; i<=numPages; i++) {
        pageItems.push(i.toString());        
      }
      pageItems.push('next');
    } else {
      // we are somewhere in the middle
      // NOTE: add extra int to make each '...' item have a unique key
      pageItems.push('prev');
      pageItems.push('1');
      pageItems.push('...1');
      pageItems.push((curPageInt - 1).toString());
      pageItems.push(currentPage);
      pageItems.push((curPageInt + 1).toString());
      pageItems.push('...2');
      pageItems.push(numPages.toString());
      pageItems.push('next');
    }    

    console.log('currentPage: ' + currentPage + '  array[' + pageItems[0] + ',' +
                pageItems[1] + ',' + pageItems[2] + ',' + pageItems[3] + ',' + pageItems[4] + ',' +
                pageItems[5] + ',' + pageItems[6] + ',' + pageItems[7] + ',' + pageItems[8] + ']');
    return pageItems;
  }

  getMenuItem(item) {
    const { currentPage } = this.state;
    if (item === 'prev') {
      // NOTE: needed to add 'key' to following menu items to avoid React warning 
      // about each child in array or iterator having a unique key
      return (
        <Menu.Item
          key={item} 
          name={item}
          active={false}
          onClick={this.handleItemClick.bind(this)}>
          <Icon name='chevron circle left'/>
        </Menu.Item>
      );      
    } else if (item === 'next') {
      return (
        <Menu.Item
          key={item} 
          name={item}
          active={false}
          onClick={this.handleItemClick.bind(this)}>
          <Icon name='chevron circle right'/>
        </Menu.Item>
      );      
    } else if (item.startsWith('...')) {
      return (
        <Menu.Item disabled key={item}>...</Menu.Item>
      );      
    } else {
      return (
        <Menu.Item 
          key={item} 
          name={item}
          active={item === currentPage}
          onClick={this.handleItemClick.bind(this)}
        />
      );      
    }
  }

  render() {
    return (
      <div>
        <Menu pagination>
          {this.getMenuItemValues().map(item => 
            this.getMenuItem(item))
          }
        </Menu>
      </div>
    );
  }
}

PaginationMenu.propTypes = {
  onPageChange: PropTypes.func.isRequired,
  numMatches: PropTypes.number
};
