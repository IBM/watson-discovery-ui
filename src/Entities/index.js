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
const util = require('util');

class Entity extends React.Component {
  constructor(...props) {
    super(...props);
    this.state = {
      isChecked: false
    };
  }

  toggleCheckboxChange() {
    const { handleCheckboxChange, label } = this.props;

    this.setState(({ isChecked }) => (
      {
        isChecked: !isChecked
      }
    ));

    handleCheckboxChange(label);
  }

  render() {
    const { label } = this.props;
    const { isChecked } = this.state;

    return (
      <div>
        <Checkbox 
          label={label}
          onChange={this.toggleCheckboxChange.bind(this)}
        />
      </div>
    );
  }
}

Entity.propTypes = {
  label: PropTypes.string.isRequired,
  handleCheckboxChange: PropTypes.func.isRequired
};

class Entities extends React.Component {
  constructor(...props) {
    super(...props);

    this.state = {
       selectedEntities: this.props.selectedEntities
    };
  }
  
  // componentWillMount() {
  //   selectedCheckboxes = new Set();
  // };

  toggleCheckbox(label) {
    const {selectedEntities } = this.props;

    if (selectedEntities.has(label)) {
      selectedEntities.delete(label);
    } else {
      selectedEntities.add(label);
    }
    console.log('selectedEntities: ');
    for (let item of selectedEntities)
      console.log(util.inspect(item, false, null));

    this.props.onEntitiesChange({
      selectedEntities: selectedEntities
    });

  }

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
              />)
            }
        </div>
        </Container>
      </div>
    );
  }
}

const getEntityString = item => {
  return item.key + ' (' + item.matching_results + ')';
};

Entities.propTypes = {
  onEntitiesChange: PropTypes.func.isRequired,
  selectedEntities: PropTypes.object
};

module.exports = Entities;
