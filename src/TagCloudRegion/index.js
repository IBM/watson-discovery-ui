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
import { Menu, Dropdown, Header, Divider } from 'semantic-ui-react';
const utils = require('../utils');
const util = require('util');

var doUpdate = true;    // determines if we render update or not

export default class TagCloudRegion extends React.Component {
  constructor(...props) {
    super(...props);

    this.state = {
      entities: this.props.entities,
      categories: this.props.categories,
      concepts: this.props.concepts,
      tagCloudType: this.props.tagCloudType
    };
  }

  getTagCloudItems() {
    const { tagCloudType, entities, categories, concepts } = this.state;

    var oldArray = [];
    if (tagCloudType === utils.CATEGORY_FILTER) {
      oldArray = JSON.parse(JSON.stringify(categories.results));
    } else if (tagCloudType == utils.CONCEPT_FILTER) {
      oldArray = JSON.parse(JSON.stringify(concepts.results));
    } else if (tagCloudType == utils.ENTITIY_FILTER) {
      oldArray = JSON.parse(JSON.stringify(entities.results));
    }

    var idx;
    var newArray = [];
    for (idx = 0; idx < oldArray.length; idx++) {
      var obj = oldArray[idx];
      obj.value = obj.key; // + ' (' + obj.matching_results + ')';
      obj.count = idx;
      delete(obj.key);
      delete(obj.matching_results);
      newArray.push(obj); 
    }
    return newArray;
  }

  cloudTypeChange(event, selection) {
    const { tagCloudType } = this.state;
    this.setState(({tagCloudType}) => (
      {
        tagCloudType: selection.value
      }
    ));
  }

  tagSelected(tag) {
    const { tagCloudType } = this.state;
    this.props.onTagItemSelected({
      selectedTagValue: tag.value,
      cloudType: tagCloudType
    });
  }

  setsAreEqual(arr1, arr2) {
    // console.log('Set1length: ' + arr1.length);
    if (arr1.length != arr2.length) {
      return false;
    }

    for (var i=0; i<arr1.length; i++) {
      // console.log('Set1[' + i + ']: ');
      // console.log(util.inspect(arr1[i], false, null));
      // console.log('Set2[' + i + ']: ');
      // console.log(util.inspect(arr2[i], false, null));
      if ((arr1.key != arr2.key) ||
          (arr1.matching_results != arr2.matching_results)) {
        return false;
      }
    } 
    return true;
  }

  // Important - this is needed to ensure changes to main properties
  // are propagated down to our component.
  componentWillReceiveProps(nextProps) {
    const { entities, categories, concepts } = this.state;
    doUpdate = false;
    // to avoid unnecessary updates, check if data has changed
    if (! this.setsAreEqual(categories.results, nextProps.categories.results)) {
      this.setState({ categories: nextProps.categories });
      doUpdate = true;
    }

    if (! this.setsAreEqual(concepts.results, nextProps.concepts.results)) {
      this.setState({ concepts: nextProps.concepts });
      doUpdate = true;
    }

    if (! this.setsAreEqual(entities.results, nextProps.entities.results)) {
      this.setState({ entities: nextProps.entities });
      doUpdate = true;
    }
  }

  // only do update if something has changed
  // NOTE: we need to do this for this specific component because it
  // draws itself randomly each time, which we want to avoid when
  // nothing has changed.
  shouldComponentUpdate(nextProps, nextState) {
    if (doUpdate) {
      return true;
    } else {
      doUpdate = true;
      return false;
    }
  }

  render() {
    const options = {
      luminosity: 'light',
      hue: 'blue'
    };

    return (
      <div>
        <Header as='h2' textAlign='left'>Tag Cloud</Header>
        <Menu compact floated='right'>
          <Dropdown 
            simple
            item
            onChange={ this.cloudTypeChange.bind(this) }
            defaultValue={ utils.ENTITIY_FILTER }
            options={ utils.filterTypes }
          />
        </Menu>
        <Divider clearing hidden/>
        <div>
          <TagCloud 
            tags={ this.getTagCloudItems() }
            minSize={12}
            maxSize={35}
            colorOptions={options}
            className="word-cloud"
            onClick={this.tagSelected.bind(this)}
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
  tagCloudSelection: PropTypes.string,
  onTagItemSelected: PropTypes.func.isRequired,
};
