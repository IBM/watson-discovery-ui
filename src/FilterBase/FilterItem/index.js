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
import { Checkbox } from 'semantic-ui-react';

/**
 * FilterItem - A checkbox component used as a base item
 * for all filter types returned by the disco query.
 */
class FilterItem extends React.Component {
  constructor(...props) {
    super(...props);
  }

  /**
   * toggleCheckboxChange - Keep track of "isChecked" state, 
   * and inform parent when state has changed.
   */
  toggleCheckboxChange() {
    const { handleCheckboxChange, label } = this.props;
    // inform parent of our state change
    handleCheckboxChange(label);
  }

  /**
   * render - Render component in UI.
   */
  render() {
    const { label } = this.props;
    const { isChecked } = this.props;

    return (
      <div>
        <Checkbox 
          className='filter-checkbox'
          fitted
          label={label}
          checked={isChecked}
          onChange={this.toggleCheckboxChange.bind(this)}
        />
      </div>
    );
  }
}

// type check to ensure we are called correctly
FilterItem.propTypes = {
  label: PropTypes.string.isRequired,
  isChecked: PropTypes.bool,
  handleCheckboxChange: PropTypes.func.isRequired
};

// export so we are visible
module.exports = FilterItem;
