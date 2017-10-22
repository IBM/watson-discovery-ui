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

const Entity = props => (
  <div>
    <Checkbox label={props.entity}/>
  </div>
);

Entity.propTypes = {
  key: PropTypes.string.isRequired,
  numMatches: PropTypes.string.isRequired
};

const Entities = props => (
  <div>
    <Header as='h2' textAlign='center'>Top Entities</Header>
    <Container textAlign='left'>
      <div className="matches--list">
        {props.entities.map(item =>
          <Entity
            entity={getEntityString(item)}
           />)
        }
      </div>
    </Container>
  </div>
);

Entities.propTypes = {
  entities: PropTypes.arrayOf(PropTypes.object).isRequired
};

const getEntityString = item => {
  return item.key + ' (' + item.matching_results + ')';
};

module.exports = Entities;
