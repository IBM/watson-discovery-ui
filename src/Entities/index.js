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
      isChecked: false,
      label: this.props.entity,
    };
  }

  handleOnChange(event) {
    this.state.isChecked = ! this.state.isChecked;
    console.log('checkbox change event');
    console.log('isChecked: ' + this.state.isChecked);
    console.log('entity: ' + this.state.label);
    
    console.log('selectedEntities: ' + this.props.selectedEntities);
    this.props.onEntitesChange({
      selectedEntities: ("test1", "test2") 
    });
  }

  render() {
    return (
      <div>
        <Checkbox 
          label={this.props.entity}
          onChange={this.handleOnChange.bind(this)}
        />
      </div>
    );
  }
}

// Entity.propTypes = {
//   label: PropTypes.string.isRequired,
//   isChecked: PropTypes.bool
// };

class Entities extends React.Component {
  constructor(...props) {
    super(...props);
    const { selectedEntities } = this.props;

    this.state = {
      selectedEntities: this.props.selectedEntities || []
    };
  }
  
  fetchEntities(value) {
    console.log('fetchEntities called: ')
    for (var entry of this.props.entities.entries()) {
      var key = entry[0];
      var value = entry[1];
      console.log('entity: ' + value.key); 
      console.log(util.inspect(value, false, null));
    }
    console.log('selectedEntities: ' + this.state.selectedEntities);
  }

  // createCheckbox = label => (
  //   <Entity
  //     label={label}
  //     handleCheckboxChange={this.toggleCheckbox}
  //     key={label}
  //   />
  // )

  // createCheckboxes = () => (
  //   this.props.entities.map(this.createCheckbox)
  // )

  render() {
    const { selectedEntities } = this.state;
    return (
      <div>
        <Header as='h2' textAlign='center'>Top Entities</Header>
        <Container textAlign='left'>
          <div className="matches--list">
            {this.props.entities.map(item =>
              <Entity
                onEntitesChange={this.fetchEntities.bind(this)}
                entity={getEntityString(item)}
                selectedEntities={selectedEntities}
              />)
            }
          </div>
        </Container>
      </div>
    );
  }
}

Entities.propTypes = {
  onEntitesChange: PropTypes.func.isRequired,
  entities: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedEntities: PropTypes.array
};

const getEntityString = item => {
  return item.key + ' (' + item.matching_results + ')';
};

module.exports = Entities;
