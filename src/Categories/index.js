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
import { Container, Checkbox, Header } from 'semantic-ui-react';

/**
 * Category - A checkbox component used to specify a category
 * returned by the disco query.
 */
class Category extends React.Component {
  constructor(...props) {
    super(...props);

    const { isChecked } = this.props;
    this.state = {
      isChecked: isChecked || false
    };
  }

  /**
   * toggleCheckboxChange - Keep track of "isChecked" state, 
   * and inform parent when state has changed.
   */
  toggleCheckboxChange() {
    const { handleCheckboxChange, label } = this.props;
    this.setState(({ isChecked }) => (
      {
        isChecked: !isChecked
      }
    ));

    const { isChecked } = this.state;
    // inform parent of our state change
    handleCheckboxChange(label);
  }

  /**
   * render - Render component in UI.
   */
  render() {
    const { label } = this.props;
    const { isChecked } = this.state;
    
    return (
      <div>
        <Checkbox 
          label={label}
          checked={isChecked}
          onChange={this.toggleCheckboxChange.bind(this)}
        />
      </div>
    );
  }
}

// type check to ensure we are called correctly
Category.propTypes = {
  label: PropTypes.string.isRequired,
  isChecked: PropTypes.bool,
  handleCheckboxChange: PropTypes.func.isRequired
};

/**
 * Categories - A container component for Category objects.
 */
class Categories extends React.Component {
  constructor(...props) {
    super(...props);

    this.state = {
       selectedCategories: this.props.selectedCategories
    };
  }
  
  /**
   * toggleCheckbox - Keep track of which categories are
   * currently selected. Update 'props' so that this data
   * is saved with the parent. 
   */
  toggleCheckbox(label) {
    const {selectedCategories } = this.props;

    if (selectedCategories.has(label)) {
      selectedCategories.delete(label);
    } else {
      selectedCategories.add(label);
    }

    this.props.onCategoriesChange({
      selectedCategories: selectedCategories
    });
  }

  /**
   * render - Render component and it's children in UI.
   */
  render() {
    const { selectedCategories } = this.props;
    return (
      <div>
        <Header as='h2' textAlign='center'>Top Categories</Header>
        <Container textAlign='left'>
          <div className="matches--list">
            {this.props.categories.map(item =>
              <Category
                label={getLabelString(item)}
                handleCheckboxChange={this.toggleCheckbox.bind(this)}
                key={getLabelString(item)}
                isChecked={getCheckedState(item, selectedCategories)}
              />)
            }
          </div>
        </Container>
      </div>
    );
  }
}

  /**
   * getLabelString - Entity label string will consist of the
   * entity name along with the number of matches in the current
   * discovery data results.
   */
  const getLabelString = item => {
  return item.key + ' (' + item.matching_results + ')';
};

  /**
   * getCheckedState - Before we render any categories, make
   * sure it has it's current state (checked or not). We can
   * determine this by comparing the category name to the list 
   * of current selected categories. If match is found, set the
   * initial state of the checkbox to selected. 
   *
   * NOTE: category string may have changed because we include
   * number of matches in the string. Allow for this by only
   * comparing the category name portion of the string.
   */
const getCheckedState = (item, selectedCategories) => {
  const itemStr = item.key;
  var isChecked = false;

  selectedCategories.forEach(function(value) {
    var idx = value.lastIndexOf(' (');
    value = value.substr(0, idx);
    if (value === item.key) {
      isChecked = true;
      return;
    }
  });
  return isChecked;
};

// type check to ensure we are called correctly
Categories.propTypes = {
  onCategoriesChange: PropTypes.func.isRequired,
  selectedCategories: PropTypes.object
};

// export so we are visible to parent
module.exports = Categories;
