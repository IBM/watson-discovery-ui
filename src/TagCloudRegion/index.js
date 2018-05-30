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
import { TagCloud } from 'react-tagcloud';
import { Menu, Dropdown, Header, Divider, Icon } from 'semantic-ui-react';
const utils = require('../../lib/utils');

var _gDoUpdate = true;    // determines if we render update or not

/**
 * This object renders a tag cloud object that appears in the right column
 * of the home page. It contains selectable terms that the user can use
 * to filter the match list. It is essentially like the filter objects, but
 * in a different format. It comes with a drop down menu where the user can
 * select what filter (entities, categories, concepts, keywords, or entity
 * types) values to display in the cloud.
 */
export default class TagCloudRegion extends React.Component {
  constructor(...props) {
    super(...props);

    this.state = {
      entities: this.props.entities,
      categories: this.props.categories,
      concepts: this.props.concepts,
      keywords: this.props.keywords,
      entityTypes: this.props.entityTypes,
      tagCloudType: this.props.tagCloudType
    };
  }

  /**
   * getTagCloudItems - return all values associated with the selected
   * filter type.
   */
  getTagCloudItems() {
    const {
      tagCloudType,
      entities,
      categories,
      concepts,
      keywords,
      entityTypes
    } = this.state;

    // console.log('tagCloudType: ' + tagCloudType);
    var oldArray = [];
    if (tagCloudType === utils.CATEGORY_FILTER) {
      oldArray = JSON.parse(JSON.stringify(categories.results));
    } else if (tagCloudType === utils.CONCEPT_FILTER) {
      oldArray = JSON.parse(JSON.stringify(concepts.results));
    } else if (tagCloudType === utils.KEYWORD_FILTER) {
      oldArray = JSON.parse(JSON.stringify(keywords.results));
    } else if (tagCloudType === utils.ENTITY_FILTER) {
      oldArray = JSON.parse(JSON.stringify(entities.results));
    } else if (tagCloudType === utils.ENTITY_TYPE_FILTER) {
      oldArray = JSON.parse(JSON.stringify(entityTypes.results));
    }

    // the values are taken from a collection that contains 'number
    // of matches' for the item. We don't want to show those numbers
    // so remove them from our new collection.
    var idx;
    var newArray = [];
    for (idx = 0; idx < oldArray.length; idx++) {
      var obj = oldArray[idx];
      obj.value = obj.key; // + ' (' + obj.matching_results + ')';
      obj.count = obj.matching_results;
      delete(obj.key);
      delete(obj.matching_results);
      newArray.push(obj); 
    }
    return newArray;
  }

  /**
   * cloudTypeChange - user has selected a new filter type. This will
   * change the values show in the tag cloud.
   */
  cloudTypeChange(event, selection) {
    this.setState({
      tagCloudType: selection.value
    });
  }

  /**
   * tagSelected - user has selected an item in the tag cloud. Propogate
   * this info to the parent.
   */
  tagSelected(tag) {
    const { tagCloudType } = this.state;
    this.props.onTagItemSelected({
      selectedTagValue: tag.value,
      cloudType: tagCloudType
    });
  }

  /**
   * setsAreEqual - shallow test to see if two data sets are equal.
   */
  setsAreEqual(arr1, arr2) {
    if (arr1.length != arr2.length) {
      return false;
    }

    for (var i=0; i<arr1.length; i++) {
      if ((arr1[i].key != arr2[i].key) ||
          (arr1[i].matching_results != arr2[i].matching_results)) {
        return false;
      }
    } 
    return true;
  }

  // Important - this is needed to ensure changes to main properties
  // are propagated down to our component. In this case, some other
  // search or filter event has occurred which has changed the list 
  // items we are showing.
  componentWillReceiveProps(nextProps) {
    const { 
      entities, 
      categories, 
      concepts,
      keywords,
      entityTypes
    } = this.state;

    _gDoUpdate = false;
    
    // to avoid unnecessary updates, check if data has actually changed
    if (! this.setsAreEqual(categories.results, nextProps.categories.results)) {
      this.setState({ categories: nextProps.categories });
      _gDoUpdate = true;
    }

    if (! this.setsAreEqual(concepts.results, nextProps.concepts.results)) {
      this.setState({ concepts: nextProps.concepts });
      _gDoUpdate = true;
    }

    if (! this.setsAreEqual(keywords.results, nextProps.keywords.results)) {
      this.setState({ keywords: nextProps.keywords });
      _gDoUpdate = true;
    }

    if (! this.setsAreEqual(entities.results, nextProps.entities.results)) {
      this.setState({ entities: nextProps.entities });
      _gDoUpdate = true;
    }

    if (! this.setsAreEqual(entityTypes.results, nextProps.entityTypes.results)) {
      this.setState({ entityTypes: nextProps.entityTypes });
      _gDoUpdate = true;
    }
  }


  // Only do update if something has changed
  // NOTE: we need to do this for this specific component because it
  // draws itself randomly each time, which we want to avoid when
  // nothing has changed.
  /*eslint no-unused-vars: ["error", { "args": "none" }]*/
  shouldComponentUpdate(nextProps, nextState) {
    if (_gDoUpdate) {
      return true;
    } else {
      _gDoUpdate = true;
      return false;
    }
  }

  /**
   * render - return all the tag cloud objects to render.
   */
  render() {
    const options = {
      luminosity: 'light',
      hue: 'blue'
    };

    return (
      <div>
        <Header as='h2' block inverted textAlign='left'>
          <Icon name='filter' />
          <Header.Content>
            Filter
            <Header.Subheader>
              By Tag Cloud
            </Header.Subheader>
          </Header.Content>
        </Header>
        <Menu compact floated='right'>
          <Dropdown 
            simple
            item
            onChange={ this.cloudTypeChange.bind(this) }
            defaultValue={ utils.ENTITY_FILTER }
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
  keywords: PropTypes.object,
  entityTypes: PropTypes.object,
  tagCloudSelection: PropTypes.string,
  tagCloudType: PropTypes.string,
  onTagItemSelected: PropTypes.func.isRequired,
};
