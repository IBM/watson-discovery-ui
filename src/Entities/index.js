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
 * Entity - A checkbox component used to specify entities
 * found in the disco query.
 */
class Entity extends React.Component {
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
Entity.propTypes = {
  label: PropTypes.string.isRequired,
  isChecked: PropTypes.bool,
  handleCheckboxChange: PropTypes.func.isRequired
};

/**
 * Entities - A container component for Entity objects.
 */
class Entities extends React.Component {
  constructor(...props) {
    super(...props);

    this.state = {
       selectedEntities: this.props.selectedEntities
    };
  }
  
  /**
   * toggleCheckbox - Keep track of which entities are
   * currently selected. Update 'props' so that this data
   * is saved with the parent. 
   */
  toggleCheckbox(label) {
    const {selectedEntities } = this.props;

    if (selectedEntities.has(label)) {
      selectedEntities.delete(label);
    } else {
      selectedEntities.add(label);
    }

    this.props.onEntitiesChange({
      selectedEntities: selectedEntities
    });
  }

  /**
   * render - Render component and it's children in UI.
   */
  render() {
    const { selectedEntities } = this.props;
    return (
      <div>
        <Header as='h2' textAlign='center'>Top Entities</Header>
        <Container textAlign='left'>
          <div className="matches--list">
            {this.props.entities.map(item =>
              <Entity
                label={getEntityString(item)}
                handleCheckboxChange={this.toggleCheckbox.bind(this)}
                key={getEntityString(item)}
                isChecked={getCheckedState(item, selectedEntities)}
              />)
            }
          </div>
        </Container>
      </div>
    );
  }
}

  /**
   * getEntityString - Entity label string will consist of the
   * entity name along with the number of matches in the current
   * discovery data results.
   */
  const getEntityString = item => {
  return item.key + ' (' + item.matching_results + ')';
};

  /**
   * getCheckedState - Before we render any entities, make
   * sure it has it's current state (checked or not). We can
   * determine this by comparing the entity name to the list 
   * of current selected entities. If match is found, set the
   * initial state of the checkbox to selected. 
   *
   * NOTE: entity string may have changed because we include
   * number of matches in the string. Allow for this by only
   * comparing the entity name portion of the string.
   */
const getCheckedState = (item, selectedEntities) => {
  const itemStr = item.key;
  var isChecked = false;

  selectedEntities.forEach(function(value) {
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
Entities.propTypes = {
  onEntitiesChange: PropTypes.func.isRequired,
  selectedEntities: PropTypes.object
};

// export so we are visible to parent
module.exports = Entities;
