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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TagCloud } from "react-tagcloud";
import { Dropdown } from 'semantic-ui-react';

export default class TagCloudRegion extends React.Component {
  constructor(...props) {
    super(...props);

    this.state = {
      entities: this.props.entities,
      categories: this.props.categories,
      concepts: this.props.concepts,
      tagCloudSelection: this.props.tagCloudSelection
    };
  }

  getTagCloudItems() {
    const { tagCloudSelection, entities, categories, concepts } = this.state;

    var oldArray = [];
    if (tagCloudSelection === 'CA') {
      oldArray = JSON.parse(JSON.stringify(categories.results));
    } else if (tagCloudSelection == 'CO') {
      oldArray = JSON.parse(JSON.stringify(concepts.results));
    } else {
      oldArray = JSON.parse(JSON.stringify(entities.results));
    }

    var idx;
    var newArray = [];
    for (idx = 0; idx < oldArray.length; idx++) {
      var obj = oldArray[idx];
      obj.value = obj.key;
      obj.count = idx;
      delete(obj.key);
      delete(obj.matching_results);
      newArray.push(obj); 
    }
    return newArray;
  }

  cloudSelectorChange(event, selection) {
    const { tagCloudSelection } = this.state;
    this.setState(({tagCloudSelection}) => (
      {
        tagCloudSelection: selection.value
      }
    ));
  }

  // Important - this is needed to ensure changes to main properties
  // are propagated down to our component.
  componentWillReceiveProps(nextProps) {
    this.setState({ entities: nextProps.entities });
    this.setState({ categories: nextProps.categories });
    this.setState({ concepts: nextProps.concepts });
  }

  render() {
    const filterOptions = [ 
      { key: 'EN', value: 'EN', text: 'Entities'}, 
      { key: 'CA', value: 'CA', text: 'Categories'},
      { key: 'CO', value: 'CO', text: 'Concepts'} ];
    
    return (
      <div>
        <Dropdown 
          onChange={this.cloudSelectorChange.bind(this)}
          defaultValue={'EN'}
          options={filterOptions}
        />
        <div>
          <TagCloud tags={ this.getTagCloudItems() }
            minSize={12}
            maxSize={35}
          />
        </div>
      </div>
    );
  }
}

TagCloudRegion.propTypes = {
  entities: PropTypes.object,
  categories: PropTypes.object,
  concepts: PropTypes.object,
  tagCloudSelection: PropTypes.string
};
