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

import PropTypes from 'prop-types';
import FilterContainer from '../FilterBase/FilterContainer';
const util = require('util');

/**
 * CategoriesFilter - A container component for Category objects.
 */
class CategoriesFilter extends FilterContainer {
  constructor(...props) {
    super(...props);

    this.state = {
      categories: this.props.categories,
      selectedCategories: this.props.selectedCategories
    };
  }

  getSelectedCollection() {
    const { selectedCategories } = this.state;
    return selectedCategories;
  }

  getCollection() {
    const { categories } = this.state;
    return categories;
  }

  getContainerTitle() {
    return "Top Categories";
  } 
  
  componentWillReceiveProps(nextProps) {
    this.setState({ categories: nextProps.categories });
    this.setState({ selectedCategories: nextProps.selectedCategories });
  }
};

// export so we are visible to parent
module.exports = CategoriesFilter;
