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
import { Header, Grid, Input, Checkbox } from 'semantic-ui-react';
const utils = require('../../lib/utils');

/**
 * This object renders a search field at the top of the web page,
 * along with optional search parameter check boxes.
 * This object must determine when the user has entered a new
 * search value or toggled any of the check boxes and then propogate 
 * the event to the parent.
 */
export default class SearchField extends React.Component {
  constructor(...props) {
    super(...props);
    this.state = {
      searchQuery: this.props.searchQuery || '',
      queryType: this.props.queryType || utils.QUERY_NATURAL_LANGUAGE,
      returnPassages: this.props.returnPassages || false,
      limitResults: this.props.limitResults || false
    };
  }

  /**
   * handleKeyPress - user has entered a new search value. 
   * Pass on to the parent object.
   */
  handleKeyPress(event) {
    const searchValue = event.target.value;
    if (event.key === 'Enter') {
      this.props.onSearchQueryChange({
        searchQuery: searchValue
      });
    }
  }

  /**
   * toggleCheckbox - user has toggled one of the check boxes. 
   * Pass on to the parent object.
   */
  toggleCheckbox(value) {
    // let parent handle setting the new event, then
    // we just listen for state changes from parent
    // before we re-render.
    this.props.onSearchParamsChange({
      label: value
    });
  }

  // Important - this is needed to ensure changes to main properties
  // are propagated down to our component. In this case, we have passed
  // the checkbox changes to our parent to manage, so we just wait
  // for the changes to our state to get propogated down to us.
  static getDerivedStateFromProps(props, state) {
    if (props.queryType !== state.queryType ||
        props.returnPassages !== state.returnPassages ||
        props.limitResults !== state.limitResults) {
      return {
        queryType: props.queryType,
        returnPassages: props.returnPassages,
        limitResults: props.limitResults
      };
    }
    // no change in state
    return null;
  }

  /**
   * render - return the input field to render.
   */
  render() {
    const { queryType, returnPassages, limitResults } = this.state;

    return (
      <Grid className='search-field-grid'>
        <Grid.Column width={12} verticalAlign='middle' textAlign='center'>
          <Header as='h1' textAlign='center'>
            Airbnb Review Data for Austin, TX
          </Header>
          <Input
            className='searchinput'
            icon='search'
            placeholder='Enter search string...'
            onKeyPress={this.handleKeyPress.bind(this)}
            defaultValue={this.state.searchQuery}
          />
        </Grid.Column>
        <Grid.Column width={4} verticalAlign='top' textAlign='left'>
          <Grid.Row>
            <Checkbox 
              label='Natural Language Query' 
              checked={ queryType === utils.QUERY_NATURAL_LANGUAGE }
              onChange={this.toggleCheckbox.bind(this, 'queryType')}
            />
          </Grid.Row>
          <Grid.Row>
            <Checkbox 
              label='Passage Search'
              checked={ returnPassages }
              onChange={this.toggleCheckbox.bind(this, 'returnPassages')}
            />
          </Grid.Row>
          <Grid.Row>
            <Checkbox 
              label='Limit to 100 Results'
              checked={ limitResults }
              onChange={this.toggleCheckbox.bind(this, 'limitResults')}
            />
          </Grid.Row>
        </Grid.Column>
      </Grid>
    );
  }
}

// type check to ensure we are called correctly
SearchField.propTypes = {
  onSearchQueryChange: PropTypes.func.isRequired,
  onSearchParamsChange: PropTypes.func.isRequired,
  searchQuery: PropTypes.string,
  queryType: PropTypes.number,
  returnPassages: PropTypes.bool,
  limitResults: PropTypes.bool
};
