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
import queryBuilder from '../server/query-builder';
import { Grid, Dimmer, Divider, Loader } from 'semantic-ui-react';
const util = require('util');
const encoding = require('encoding');

class Main extends React.Component {

  constructor(...props) {
    super(...props);
    const { entities, categories, data, searchQuery, 
            selectedEntities, selectedCategories, error } = this.props;

    // change in state fires re-render of components
    this.state = {
      error: error,
      data: data && parseData(data),
      entities: entities && parseEntities(entities),
      categories: categories && parseCategories(categories),
      loading: false,
      searchQuery: searchQuery || '',
      selectedEntities: new Set(),
      selectedCategories: new Set()
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

  searchQueryChanged(query) {
    const { searchQuery } = query;
    console.log("searchQuery [FROM SEARCH]: " + searchQuery);
   
    // true = clear all filters for new search
    this.fetchData(searchQuery, true);
  }

  fetchData(query, clearFilters) {
    const searchQuery = query;
    var { selectedEntities, selectedCategories } = this.state;

    if (clearFilters) {
      selectedEntities.clear();
      selectedCategories.clear();
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
    const fs = this.buildFilterString(selectedEntities, selectedCategories);
    
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
  buildFilterString(entities, categories) {
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

  render() {
    const { loading, data, error, searchQuery, 
            entities, selectedEntities,
            categories, selectedCategories } = this.state;

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
          </Grid.Column>
          <Grid.Column width={12} textAlign='center'>
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

const parseEntities = entities => ({
  rawResponse: Object.assign({}, entities),
  results: entities.aggregations[0].results[0].aggregations[0].results
});

const parseCategories = categories => ({
  rawResponse: Object.assign({}, categories),
  results: categories.aggregations[0].results[0].aggregations[0].results[0].aggregations[0].results
});

function scrollToMain() {
  setTimeout(() => {
    const scrollY = document.querySelector('main').getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, scrollY);
  }, 0);
}

module.exports = Main;
