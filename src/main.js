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

import 'isomorphic-fetch';
import React from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import Matches from './Matches';
import SearchField from './SearchField';
import Entities from './Entities';
import Categories from './Categories';
import Concepts from './Concepts';
import queryBuilder from '../server/query-builder';
import { TagCloud } from "react-tagcloud";
import { Grid, Dimmer, Divider, Loader, Dropdown } from 'semantic-ui-react';
const util = require('util');
const encoding = require('encoding');

class Main extends React.Component {

  constructor(...props) {
    super(...props);
    const { entities, selectedEntities,
            categories, selectedCategories,
            concepts, selectedConcepts,
            data, 
            searchQuery, 
            error } = this.props;

    // change in state fires re-render of components
    this.state = {
      error: error,
      data: data && parseData(data),
      entities: entities && parseEntities(entities),
      categories: categories && parseCategories(categories),
      concepts: concepts && parseConcepts(concepts),
      loading: false,
      searchQuery: searchQuery || '',
      selectedEntities: new Set(),
      selectedCategories: new Set(),
      selectedConcepts: new Set(),
      tagCloudSelection: 'EN'
    };
  }

  entitiesChanged(entities) {
    const { selectedEntities } = entities;
    
    this.setState(({selectedEntities}) => (
      {
        selectedEntities: selectedEntities
      }
    ));

    const { searchQuery } = this.state;
    this.fetchData(searchQuery, false);
  }

  categoriesChanged(categories) {
    const { selectedCategories } = categories;
    // console.log("QUERY - selectedEntities: ");
    // for (let item of selectedEntities)
    //   console.log(util.inspect(item, false, null));
    
    this.setState(({selectedCategories}) => (
      {
        selectedCategories: selectedCategories
      }
    ));

    const { searchQuery } = this.state;
    // console.log("searchQuery [FROM ENTITIES]: " + searchQuery);
    this.fetchData(searchQuery, false);
  }

  conceptsChanged(concepts) {
    const { selectedConcepts } = concepts;
    
    this.setState(({selectedConcepts}) => (
      {
        selectedConcepts: selectedConcepts
      }
    ));

    const { searchQuery } = this.state;
    this.fetchData(searchQuery, false);
  }

  searchQueryChanged(query) {
    const { searchQuery } = query;
    console.log("searchQuery [FROM SEARCH]: " + searchQuery);
   
    // true = clear all filters for new search
    this.fetchData(searchQuery, true);
  }

  fetchData(query, clearFilters) {
    const searchQuery = query;
    var { selectedEntities, selectedCategories, selectedConcepts } = this.state;

    if (clearFilters) {
      selectedEntities.clear();
      selectedCategories.clear();
      selectedConcepts.clear();
    }

    // console.log("QUERY2 - selectedEntities: ");
    // for (let item of selectedEntities)
    //   console.log(util.inspect(item, false, null));
    // console.log("QUERY2 - searchQuery: " + searchQuery);
    
    this.setState({
      loading: true,
      searchQuery
    });

    scrollToMain();
    history.pushState({}, {}, `/${searchQuery.replace(/ /g, '+')}`);

    const qs = queryString.stringify({ query: searchQuery });
    const fs = this.buildFilterString(selectedEntities, selectedCategories, selectedConcepts);
    
    fetch(`/api/search?${qs}${fs}`)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw response;
      }
    })
    .then(json => {
      this.setState(
        { 
          data: parseData(json), 
          entities: parseEntities(json), 
          categories: parseCategories(json), 
          concepts: parseConcepts(json), 
          loading: false, 
          error: null 
        }
      );
      scrollToMain();
    })
    .catch(response => {
      this.setState({
        error: (response.status === 429) ? 'Number of free queries per month exceeded' : 'Error fetching results',
        loading: false,
        data: null
      });
      // eslint-disable-next-line no-console
      console.error(response);
    });
  }

  /**
   * Convert set of selected entities into string
   * @param {*} entities 
   */
  buildFilterString(entities, categories, concepts) {
    var filterString = '';
    var firstOne = true;
    
    if (entities.size > 0) {
      var entitiesString = '';
      entities.forEach(function(value) {
        // remove the '(count)' from each entity entry
        var idx = value.lastIndexOf(' (');
        value = value.substr(0, idx);
        if (firstOne) {
          firstOne = false;
          entitiesString = 'enriched_text.entities.text::';
        } else {
          entitiesString = entitiesString + ',enriched_text.entities.text::';
        }
        entitiesString = entitiesString + '"' + value + '"';
      });
      //entitiesString = encodeURIComponent(entitiesString);
      filterString = filterString + entitiesString;
    }

    if (categories.size > 0) {
      var categoryString = '';
      categories.forEach(function(value) {
        // remove the '(count)' from each category entry
        var idx = value.lastIndexOf(' (');
        value = value.substr(0, idx);
        if (firstOne) {
          firstOne = false;
          categoryString = 'enriched_text.categories.label::';
        } else {
          categoryString = categoryString + ',enriched_text.categories.label::';
        }
        categoryString = categoryString + '"' + value + '"';
      });
      filterString = filterString + categoryString;
    }

    if (concepts.size > 0) {
      var conceptString = '';
      concepts.forEach(function(value) {
        // remove the '(count)' from each category entry
        var idx = value.lastIndexOf(' (');
        value = value.substr(0, idx);
        if (firstOne) {
          firstOne = false;
          conceptString = 'enriched_text.concepts.text::';
        } else {
          conceptString = conceptString + ',enriched_text.concepts.text::';
        }
        conceptString = conceptString + '"' + value + '"';
      });
      filterString = filterString + conceptString;
    }

    return filterString;
  }

  getMatches() {
    const { data } = this.state;
    if (!data) {
      return null;
    }
    return <Matches matches={data.results} />;
  }

  getEntities() {
    const { entities, selectedEntities } = this.state;
    if (!entities) {
      return null;
    }
    return (
      <Entities 
        onFilterItemsChange={this.entitiesChanged.bind(this)}
        entities={entities.results}
        selectedEntities={selectedEntities}
      />
    );
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
  
  getCategories() {
    const { categories, selectedCategories } = this.state;
    if (!categories) {
      return null;
    }
    return (
      <Categories 
        onFilterItemsChange={this.categoriesChanged.bind(this)}
        categories={categories.results}
        selectedCategories={selectedCategories}
      />
    );
  }

  getConcepts() {
    const { concepts, selectedConcepts } = this.state;
    if (!concepts) {
      return null;
    }
    return (
      <Concepts 
        onFilterItemsChange={this.conceptsChanged.bind(this)}
        concepts={concepts.results}
        selectedConcepts={selectedConcepts}
      />
    );
  }

  cloudSelectorChange(event, selection) {
    const { tagCloudSelection } = this.state;
    this.setState(({tagCloudSelection}) => (
      {
        tagCloudSelection: selection.value
      }
    ));
  }

  render() {
    const { loading, data, error, searchQuery, 
            entities, selectedEntities,
            categories, selectedCategories,
            concepts, selectedConcepts } = this.state;

    const filterOptions = [ 
      { key: 'EN', value: 'EN', text: 'Entities'}, 
      { key: 'CA', value: 'CA', text: 'Categories'},
      { key: 'CO', value: 'CO', text: 'Concepts'} ];
            
    return (
      <Grid celled className='search-grid'>
        <Grid.Row>
          <Grid.Column width={16} textAlign='center'>
            <SearchField
              onSearchQueryChange={this.searchQueryChanged.bind(this)}
              searchQuery={searchQuery}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={4} textAlign='center'>
            <div className="row">
              {this.getEntities()}
            </div>
            <Divider section/>
            <div className="row">
              {this.getCategories()}
            </div>
            <Divider section/>
            <div className="row">
              {this.getConcepts()}
            </div>
          </Grid.Column>
          <Grid.Column width={8} textAlign='center'>
            {loading ? (
              <div className="results">
                <div className="loader--container">
                  <Dimmer active>
                    <Loader>Loading</Loader>
                  </Dimmer>
                </div>
              </div>
            ) : data ? (
              <div className="results">
                <div className="_container _container_large">
                  <div className="row">
                    {this.getMatches()}
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="results">
                <div className="_container _container_large">
                  <div className="row">
                    {JSON.stringify(error)}
                  </div>
                </div>
              </div>
            ) : null}
          </Grid.Column>
          <Grid.Column width={4} textAlign='center'>
            <div className="cloud_selector">
              <Dropdown 
                onChange={this.cloudSelectorChange.bind(this)}
                defaultValue={'EN'} 
                search 
                selection 
                options={filterOptions} />
            </div>
            <div className="tag_cloud">
              <TagCloud tags={ this.getTagCloudItems() }
                minSize={12}
                maxSize={35}
              />
            </div>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}

Main.propTypes = {
  data: PropTypes.object,
  searchQuery: PropTypes.string,
  selectedEntities: PropTypes.object,
  selectedCateories: PropTypes.object,
  selectedConcepts: PropTypes.object,
  error: PropTypes.object
};

const getTitleForItem = item => item.title ? item.title : 'Untitled';

const parseData = data => ({
  rawResponse: Object.assign({}, data),
  sentiment: data
    .aggregations[0]
    .results.reduce((accumulator, result) =>
      Object.assign(accumulator, { [result.key]: result.matching_results }), {}),
  results: data.results
});

const parseEntities = json => ({
  rawResponse: Object.assign({}, json),
  results: json.aggregations[0].results
});

const parseCategories = json => ({
  rawResponse: Object.assign({}, json),
  results: json.aggregations[1].results
});

const parseConcepts = json => ({
  rawResponse: Object.assign({}, json),
  results: json.aggregations[2].results
});

function scrollToMain() {
  setTimeout(() => {
    const scrollY = document.querySelector('main').getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, scrollY);
  }, 0);
}

module.exports = Main;
