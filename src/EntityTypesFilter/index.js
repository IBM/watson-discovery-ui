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

/**
 * EntityTypesFilter - A container component for Entity Type objects.
 * This object appears on the web page and allows the user to
 * filter matches based on an 'entity type' value. It's core functionality
 * comes from its parents class - the FilterContainer.
 */
class EntityTypesFilter extends FilterContainer {
  constructor(...props) {
    super(...props);

    this.state = {
      entityTypes: this.props.entityTypes,
      selectedEntityTypes: this.props.selectedEntityTypes
    };
  }

  /**
   * getSelectedCollection - Override parent class to return collection 
   * of selected entity items.
   */
  getSelectedCollection() {
    const { selectedEntityTypes } = this.state;
    return selectedEntityTypes;
  }

  /**
   * getCollection - Override parent class to return collection 
   * of all entity items.
   */
  getCollection() {
    const { entityTypes } = this.state;
    return entityTypes;
  }

  /**
   * getContainerTitle - Override parent class to return title of 
   * the filter container. 
   */
  getContainerTitle() {
    return 'Top Entity Types';
  }
  
  // Important - this is needed to ensure changes to main properties
  // are propagated down to our component. In this case, some other
  // search or filter event has occured which has changed the list of 
  // entities, or which entities are selected.
  componentWillReceiveProps(nextProps) {
    this.setState({ entityTypes: nextProps.entityTypes });
    this.setState({ selectedEntityTypes: nextProps.selectedEntityTypes });
  }
}

// type check to ensure we are called correctly
EntityTypesFilter.propTypes = {
  entityTypes: PropTypes.array,
  selectedEntityTypes: PropTypes.object,
};

// export so we are visible to parent
module.exports = EntityTypesFilter;
