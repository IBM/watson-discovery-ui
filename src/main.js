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
import TopEntities from './TopEntities';
import TopCategories from './TopCategories';
import TopConcepts from './TopConcepts';
import TagCloudRegion from './TagCloudRegion';
import queryBuilder from '../server/query-builder';
import { Grid, Dimmer, Divider, Loader } from 'semantic-ui-react';
const utils = require('./utils');
const util = require('util');
const encoding = require('encoding');

class Main extends React.Component {

  constructor(...props) {
    super(...props);
    const { 
      entities, 
      selectedEntities,
      categories, 
      selectedCategories,
      concepts, 
      selectedConcepts,
      data, 
      searchQuery,
      tagCloudType, 
      error 
    } = this.props;

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
      tagCloudType: tagCloudType || utils.ENTITIY_FILTER
    };
  }

  filtersChanged() {
    const { searchQuery  } = this.state;
    this.fetchData(searchQuery, false);
  }

  /* handle search string changes from search box */
  searchQueryChanged(query) {
    const { searchQuery } = query;
    console.log("searchQuery [FROM SEARCH]: " + searchQuery);
   
    // true = clear all filters for new search
    this.fetchData(searchQuery, true);
  }

  buildFullTagName(tag, collection) {
    // find the tag in collection
    for (var i=0; i<collection.length; i++) {
      console.log('compare tag: ' + tag + ' with: ' + collection[i].key);
      if (collection[i].key === tag) {
        // return the fill tag so we can match the entries
        // listed in the filters (which also show num of matches)
        return collection[i].key + ' (' + collection[i].matching_results + ')';
      }
    }
    return tag;
  }

  /* handle tag selection in the tag cloud */
  tagItemSelected(tag) {
    var { selectedTagValue, cloudType } = tag;
    selectedTagValue = selectedTagValue;
    console.log("tagValue [FROM TAG CLOUD]: " + selectedTagValue);

    // manually add this item to the list of selected items
    // based on filter type
    const { entities, selectedEntities, 
            categories, selectedCategories, 
            concepts, selectedConcepts,
            searchQuery  } = this.state;

    if (cloudType === utils.CATEGORY_FILTER) {
      var fullName = this.buildFullTagName(selectedTagValue, categories.results);
      if (selectedCategories.has(fullName)) {
        selectedCategories.delete(fullName);
      } else {
        selectedCategories.add(fullName);
      }
      
      this.setState({
        selectedCategories: selectedCategories
      })
    } else if (cloudType == utils.CONCEPT_FILTER) {
      var fullName = this.buildFullTagName(selectedTagValue, concepts.results);
      if (selectedConcepts.has(fullName)) {
        selectedConcepts.delete(fullName);
      } else {
        selectedConcepts.add(fullName);
      }

      this.setState({
        selectedConcepts: selectedConcepts
      })
    } else if (cloudType == utils.ENTITIY_FILTER) {
      var fullName = this.buildFullTagName(selectedTagValue, entities.results);
      if (selectedEntities.has(fullName)) {
        selectedEntities.delete(fullName);
      } else {
        selectedEntities.add(fullName);
      }
      
      this.setState({
        selectedEntities: selectedEntities
      })
    }

    // execute new search w/ filters
    this.fetchData(searchQuery, false);
  }

  fetchData(query, clearFilters) {
    const searchQuery = query;
    var { selectedEntities, selectedCategories, selectedConcepts } = this.state;

    if (clearFilters) {
      selectedEntities.clear();
      selectedCategories.clear();
      selectedConcepts.clear();
    }

    // console.log("QUERY2 - selectedCategories: ");
    // for (let item of selectedCategories)
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
        // if it exists - tag cloud does not list '(count)'s
        var idx = value.lastIndexOf(' (');
        if (idx >= 0) {
          value = value.substr(0, idx);
        }
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
      <TopEntities 
        onFilterItemsChange={this.filtersChanged.bind(this)}
        entities={entities.results}
        selectedEntities={selectedEntities}
      />
    );
  }
  
  getCategories() {
    const { categories, selectedCategories } = this.state;
    if (!categories) {
      return null;
    }
    return (
      <TopCategories 
        onFilterItemsChange={this.filtersChanged.bind(this)}
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
      <TopConcepts 
        onFilterItemsChange={this.filtersChanged.bind(this)}
        concepts={concepts.results}
        selectedConcepts={selectedConcepts}
      />
    );
  }

  render() {
    const { loading, data, error, searchQuery, 
            entities, selectedEntities,
            categories, selectedCategories,
            concepts, selectedConcepts,
            tagCloudType } = this.state;

    return (
      <Grid celled className='search-grid'>
        <Grid.Row color={'blue'}>
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
            <TagCloudRegion
              entities={entities}
              categories={categories}
              concepts={concepts}
              tagCloudType={tagCloudType}
              onTagItemSelected={this.tagItemSelected.bind(this)}
            />
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
