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
import { Menu, Icon } from 'semantic-ui-react';
const utils = require('../../lib/utils');
const MAX_MENU_ITEMS = 9;

/**
 * This object renders a pagination menu at the bottom of the results
 * section on the web page. This object must determine what pages to
 * show based on what current page is displayed, as well as respond
 * to user clicks to change the page.
 */
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

  /**
   * handleItemClick - user has selected a new page of results 
   * to display. Determine the correct page number and pass that 
   * on to the parent object.
   */
  handleItemClick(event, { name }) {
    const { currentPage } = this.state;

    // adjust page num if user selected next/prev buttons
    if (name === 'prev') {
      var pageNum = parseInt(currentPage);
      pageNum = pageNum - 1;
      name = pageNum.toString();
    } else if (name === 'next') {
      pageNum = parseInt(currentPage);
      pageNum = pageNum + 1;
      name = pageNum.toString();
    }

    console.log('page number = ' + name);
    this.setState({ currentPage: name });

    // inform parent
    this.props.onPageChange({
      currentPage: name
    });
  }

  /**
   * getMenuItemValues - determine what pages to show in the menu.
   */
  getMenuItemValues() {
    const { currentPage, numMatches } = this.state;
    var numPages = Math.ceil(numMatches / utils.ITEMS_PER_PAGE);
    var pageItems = [];
    var curPageInt = parseInt(currentPage);
    
    // handle case where we don't need any menu items (only one page of data)
    if (numPages == 1) {
      return pageItems;
    }

    // handle case where we don't need to scroll menu items
    if (numPages <= MAX_MENU_ITEMS) {
      for (var i=1; i<=numPages; i++) {
        pageItems.push(i.toString());        
      }
      return pageItems;
    } 
    
    // now we have multiple pages and we need menu bar to scroll based
    // on what page is currently selected.
    // Examples:
    // Page 1 of 40 selected:  1 | 2 | 3 | 4 | 5 | 6 | ... | 40 | next
    // Page 2 of 40 selected:  prev | 1 | 2 | 3 | 4 | 5 | ... | 40 | next
    // Page 6 of 40 selected:  prev | 1 | ... | 5 | 6 | 7 | ... | 40 | next
    // Page 39 of 40 selected: prev | 1 | ... | 36 | 37 | 38 | 39 | 40 | next
    // Page 40 of 40 selected: prev | 1 | ... | 35 | 36 | 37 | 38 | 39 | 40
    if (curPageInt == 1) {
      // we are on first page - so no 'prev' menu item needed
      for (i=1; i<=MAX_MENU_ITEMS-3; i++) {
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
      for (i=numPages-MAX_MENU_ITEMS+3; i<=numPages; i++) {
        pageItems.push(i.toString());        
      }
    } else if (curPageInt <= 3) {
      // we are close to first page - so no '...' menu item at front needed
      pageItems.push('prev');
      pageItems.push('1');
      for (i=2; i<=MAX_MENU_ITEMS-4; i++) {
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
      for (i=numPages-MAX_MENU_ITEMS+4; i<=numPages; i++) {
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

    // console.log('currentPage: ' + currentPage + '  array[' + pageItems[0] + ',' +
    //             pageItems[1] + ',' + pageItems[2] + ',' + pageItems[3] + ',' + pageItems[4] + ',' +
    //             pageItems[5] + ',' + pageItems[6] + ',' + pageItems[7] + ',' + pageItems[8] + ']');
    return pageItems;
  }

  /**
   * getMenuItem - return the menu item to render.
   */
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

  // Important - this is needed to ensure changes to main properties
  // are propagated down to our component. In this case, a new search
  // was conducted resulting in a new set of matches, so we need
  // to reset our current page to '1'.
  componentWillReceiveProps(nextProps) {
    const { numMatches } = this.state;
    if (numMatches != nextProps.numMatches) {
      this.setState({
        numMatches: nextProps.numMatches,
        currentPage: '1'
      });
    }
  }

  /**
   * render - return the menu to render.
   */
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

// type check to ensure we are called correctly
PaginationMenu.propTypes = {
  onPageChange: PropTypes.func.isRequired,
  numMatches: PropTypes.number,
  currentPage: PropTypes.string
};
