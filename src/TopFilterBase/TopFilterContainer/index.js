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
import TopFilterItem from '../TopFilterItem';
import { Container, Header } from 'semantic-ui-react';
const util = require('util');

/**
 * TopItem - A checkbox component used to specify a filter item
 * returned by the disco query.
 */
class TopItem extends TopFilterItem {
  constructor(...props) {
    super(...props);
  }
};

/**
 * TopFilterContainer - A container component used as a base for
 * containing TopFilterItems.
 */
class TopFilterContainer extends React.Component {
  constructor(...props) {
    super(...props);
  }

  /**
   * getSelectedCollection - Return the object that contains collection
   * of selected filter items.
   */
  getSelectedCollection() {
    throw new Error('You must implement FilterContainer.getSelectedCollection!');
  }

  /**
   * getCollection - Return the object that contains collection
   * of all filter items.
   */
  getCollection() {
    throw new Error('You must implement FilterContainer.getCollection!');
  }

  /**
   * getContainerTitle - Return title to be used for filter container.
   */
  getContainerTitle() {
    throw new Error('You must implement FilterContainer.getContainerTitle!');
  }

  /**
   * toggleCheckbox - Keep track of which filter items are
   * currently selected. Update 'props' so that this data
   * is saved with the parent. 
   */
  toggleCheckbox(label) {
    const selectedItems = this.getSelectedCollection();

    if (selectedItems.has(label)) {
      selectedItems.delete(label);
    } else {
      selectedItems.add(label);
    }

    this.props.onFilterItemsChange({
      selectedItems: selectedItems
    });
  }

  /**
   * getCheckedState - Before rendering any filter items, make
   * sure it has it's current state (checked or not). This can be
   * determined by comparing the item name to the list 
   * of current selected items. If match is found, set the
   * initial state of the checkbox to selected. 
   *
   * NOTE: items strings may have changed because we include
   * number of matches in the string. Allow for this by only
   * comparing the item name portion of the string.
   */
  getCheckedState(item, selectedItems) {
    const itemStr = item.key;
    var isChecked = false;

    selectedItems.forEach(function(value) {
      var idx = value.lastIndexOf(' (');
      var newValue = value.substr(0, idx);
      // console.log("compare arrayVal: " + newValue + " vs CB item: " + itemStr);
      if (newValue === itemStr) {
        isChecked = true;
      }
    });
    return isChecked;
  }

  /**
   * getItemLabel - Filter item label string will consist of the
   * item name along with the number of matches in the current
   * discovery data results.
   */
  getItemLabel(item) {
    return item.key + ' (' + item.matching_results + ')';
  }

  /**
   * getRenderObjectForItem - Return render component that will display the 
   * filter item in the browser.
   */
  getRenderObjectForItem(item) {
    // throw new Error('You must implement FilterContainer.getRenderObjectForItem!');
    const selectedItems = this.getSelectedCollection();
    return (
      <TopItem
        label={this.getItemLabel(item)}
        handleCheckboxChange={this.toggleCheckbox.bind(this)}
        key={this.getItemLabel(item)}
        isChecked={this.getCheckedState(item, selectedItems)}
      />
    )
  }

  /**
   * render - Render the filter container and its filter item children.
   */
  render() {
    const selectedItems = this.getSelectedCollection();
    return (
      <div>
        <Header as='h2' textAlign='center'>{this.getContainerTitle()}</Header>
        <Container textAlign='left'>
          <div className="matches--list">
            {this.getCollection().map(item =>
              this.getRenderObjectForItem(item))
            }
          </div>
        </Container>
      </div>
    );
  }
};

// type check to ensure we are called correctly
TopFilterContainer.propTypes = {
  onFilterItemsChange: PropTypes.func.isRequired,
  selectedEntities: PropTypes.object
}

// export so we are visible to parent
module.exports = TopFilterContainer;
