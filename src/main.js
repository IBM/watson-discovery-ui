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
import PaginationMenu from './PaginationMenu';
import SearchField from './SearchField';
import EntitiesFilter from './EntitiesFilter';
import CategoriesFilter from './CategoriesFilter';
import ConceptsFilter from './ConceptsFilter';
import TagCloudRegion from './TagCloudRegion';
import SentimentChart from './SentimentChart';
import { Grid, Dimmer, Divider, Loader, Accordion, Icon, Header } from 'semantic-ui-react';
const utils = require('./utils');

/**
 * Main React object that contains all objects on the web page.
 * This object manages all interaction between child objects as
 * well as making search requests to the discovery service.
 */
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
      currentPage,
      numMatches,
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
      selectedEntities: selectedEntities || new Set(),
      selectedCategories: selectedCategories || new Set(),
      selectedConcepts: selectedConcepts || new Set(),
      tagCloudType: tagCloudType || utils.ENTITIY_FILTER,
      currentPage: currentPage || '1',
      numMatches: numMatches || 0,
      activeFilterIndex: 0
    };
  }

  /**
   * handleAccordionClick - (callback function)
   * User has selected one of the 
   * filter boxes to expand and show values for.
   */
  handleAccordionClick(e, titleProps) {
    const { index } = titleProps;
    const { activeFilterIndex } = this.state;
    const newIndex = activeFilterIndex === index ? -1 : index;
    this.setState({ activeFilterIndex: newIndex });
  }

  /**
   * filtersChanged - (callback function)
   * User has selected one of the values from within
   * of the filter boxes. This results in making a new qeury to 
   * the disco service.
   */
  filtersChanged() {
    const { searchQuery  } = this.state;
    this.fetchData(searchQuery, false);
  }

  /**
   * pageChanged - (callback function)
   * User has selected a new page of results to display.
   */
  pageChanged(data) {
    this.setState({ currentPage: data.currentPage });
  }

  /**
   * searchQueryChanged - (callback function)
   * User has entered a new search string to query on. 
   * This results in making a new qeury to the disco service.
   */
  searchQueryChanged(query) {
    const { searchQuery } = query;
    console.log('searchQuery [FROM SEARCH]: ' + searchQuery);
   
    // true = clear all filters for new search
    this.fetchData(searchQuery, true);
  }

  /**
   * tagItemSelected - (callback function)
   * User has selected an item from the tag cloud object
   * to filter on. This results in making a new qeury to the 
   * disco service.
   */
  tagItemSelected(tag) {
    var { selectedTagValue, cloudType } = tag;
    console.log('tagValue [FROM TAG CLOUD]: ' + selectedTagValue);

    // manually add this item to the list of selected items
    // based on filter type. This is needed so that both the 
    // tag cloud and the filter objects stay in sync (both 
    // reflect what items have been selected).
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
      });
    } else if (cloudType == utils.CONCEPT_FILTER) {
      fullName = this.buildFullTagName(selectedTagValue, concepts.results);
      if (selectedConcepts.has(fullName)) {
        selectedConcepts.delete(fullName);
      } else {
        selectedConcepts.add(fullName);
      }

      this.setState({
        selectedConcepts: selectedConcepts
      });
    } else if (cloudType == utils.ENTITIY_FILTER) {
      fullName = this.buildFullTagName(selectedTagValue, entities.results);
      if (selectedEntities.has(fullName)) {
        selectedEntities.delete(fullName);
      } else {
        selectedEntities.add(fullName);
      }
      
      this.setState({
        selectedEntities: selectedEntities
      });
    }

    // execute new search w/ filters
    this.fetchData(searchQuery, false);
  }

  /**
   * fetchData - build the query that will be passed to the 
   * discovery service.
   */
  fetchData(query, clearFilters) {
    const searchQuery = query;
    var { selectedEntities, selectedCategories, selectedConcepts } = this.state;

    // clear filters if this a new text search
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
      currentPage: '1',
      searchQuery
    });

    scrollToMain();
    history.pushState({}, {}, `/${searchQuery.replace(/ /g, '+')}`);

    const qs = queryString.stringify({ query: searchQuery });
    const fs = this.buildFilterString(selectedEntities, selectedCategories, selectedConcepts);
    
    // send request
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
          numMatches: json.results.length,
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
   * buildFilterStringForType - build the filter string for
   * one set of filter objects.
   */
  buildFilterStringForType(collection, keyName, firstOne) {
    var str = '';
    console.log('firstOne = ' + firstOne);
    var firstValue = firstOne; 
    if (collection.size > 0) {
      collection.forEach(function(value) {
        // remove the '(count)' from each entry, if it exists.
        // note - tag cloud items don't have '(count)'s.
        var idx = value.lastIndexOf(' (');
        if (idx >= 0) {
          value = value.substr(0, idx);
        }
        if (firstValue) {
          firstValue = false;
          str = keyName;
        } else {
          str = str + ',' + keyName;
        }
        str = str + '"' + value + '"';
      });
    }
    return str;
  }

  /**
   * buildFilterString - convert all selected filters into a string
   * to be added to the search query sent to the discovery service
   */
  buildFilterString(entities, categories, concepts) {
    var filterString = '';
    
    // add any entities filters, if selected
    var entitiesString = this.buildFilterStringForType(entities,
      'enriched_text.entities.text::', true);
    filterString = filterString + entitiesString;
      
    // add any category filters, if selected
    var categoryString = this.buildFilterStringForType(categories,
      'enriched_text.categories.label::', filterString === '');
    filterString = filterString + categoryString;

    // add any entities filters, if selected
    var conceptString = this.buildFilterStringForType(concepts,
      'enriched_text.concepts.text::', filterString === '');
    filterString = filterString + conceptString;

    return filterString;
  }

  /**
   * buildFullTagName - this matches the selected tag cloud item with
   * the item in the filter collection. This is needed to keep them in 
   * sync with each other. This takes care of the issue where the tag
   * cloud item is formatted differently than the collection item (the
   * collection item name has a count appended to it).
   */
  buildFullTagName(tag, collection) {
    // find the tag in collection
    for (var i=0; i<collection.length; i++) {
      console.log('compare tag: ' + tag + ' with: ' + collection[i].key);
      if (collection[i].key === tag) {
        // return the full tag so we can match the entries
        // listed in the filters (which also show num of matches)
        return collection[i].key + ' (' + collection[i].matching_results + ')';
      }
    }
    return tag;
  }

  /**
   * getMatches - return collection matches to be rendered.
   */
  getMatches() {
    const { data, currentPage } = this.state;
    if (!data) {
      return null;
    }

    var page = parseInt(currentPage);
    var startIdx = (page - 1) * utils.ITEMS_PER_PAGE;
    return (
      <Matches 
        matches={data.results.slice(startIdx,startIdx+utils.ITEMS_PER_PAGE)}
      />
    );
  }

  /**
   * getPaginationMenu - return pagination menu to be rendered.
   */
  getPaginationMenu() {
    const { numMatches } = this.state;
    
    if (numMatches > 1) {
      return (
        <PaginationMenu
          numMatches={numMatches}
          onPageChange={this.pageChanged.bind(this)}
        />
      );
    } else {
      return null;
    }
  }

  /**
   * getEntities - return entities filter object to be rendered.
   */
  getEntities() {
    const { entities, selectedEntities } = this.state;
    if (!entities) {
      return null;
    }
    return (
      <EntitiesFilter 
        onFilterItemsChange={this.filtersChanged.bind(this)}
        entities={entities.results}
        selectedEntities={selectedEntities}
      />
    );
  }
  
  /**
   * getCategories - return categories filter object to be rendered.
   */
  getCategories() {
    const { categories, selectedCategories } = this.state;
    if (!categories) {
      return null;
    }
    return (
      <CategoriesFilter 
        onFilterItemsChange={this.filtersChanged.bind(this)}
        categories={categories.results}
        selectedCategories={selectedCategories}
      />
    );
  }

  /**
   * getConcepts - return concepts filter object to be rendered.
   */
  getConcepts() {
    const { concepts, selectedConcepts } = this.state;
    if (!concepts) {
      return null;
    }
    return (
      <ConceptsFilter 
        onFilterItemsChange={this.filtersChanged.bind(this)}
        concepts={concepts.results}
        selectedConcepts={selectedConcepts}
      />
    );
  }

  /**
   * render - return all the home page object to be rendered.
   */
  render() {
    const { loading, data, error, searchQuery,
            entities, categories, concepts,
            tagCloudType, numMatches } = this.state;

    // used for filter accordions
    const { activeFilterIndex } = this.state;
    
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
            <Grid.Column width={3}>
              <Header as='h2' textAlign='left'>Filter</Header>
              <Accordion styled>
                <Accordion.Title 
                  active={activeFilterIndex == 0} 
                  index={0} 
                  onClick={this.handleAccordionClick.bind(this)}>
                  <Icon name='dropdown' />
                  Entities
                </Accordion.Title>
                <Accordion.Content active={activeFilterIndex == 0}>
                  {this.getEntities()}
                </Accordion.Content>
              </Accordion>
              <Accordion styled>
                <Accordion.Title 
                  active={activeFilterIndex == 1} 
                  index={1} 
                  onClick={this.handleAccordionClick.bind(this)}>
                  <Icon name='dropdown' />
                  Categories
                </Accordion.Title>
                <Accordion.Content active={activeFilterIndex == 1}>
                  {this.getCategories()}
                </Accordion.Content>
              </Accordion>
              <Accordion styled>
                <Accordion.Title 
                  active={activeFilterIndex == 2} 
                  index={2} 
                  onClick={this.handleAccordionClick.bind(this)}>
                  <Icon name='dropdown' />
                  Concepts
                </Accordion.Title>
                <Accordion.Content active={activeFilterIndex == 2}>
                  {this.getConcepts()}
                </Accordion.Content>
              </Accordion>
            </Grid.Column>
          <Grid.Column width={8}>
            <Grid.Row>
              {loading ? (
                <div className="results">
                  <div className="loader--container">
                    <Dimmer active inverted>
                      <Loader>Loading</Loader>
                    </Dimmer>
                  </div>
                </div>
              ) : data ? (
                <div className="results">
                  <div className="_container _container_large">
                    <div className="row">
                      <Header 
                        as='h2'
                        textAlign='left'>
                        {'Search Results (' + numMatches + ')'}
                      </Header>
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
            </Grid.Row>
            <Divider clearing hidden/>
            <Grid.Row>
              {this.getPaginationMenu()}
            </Grid.Row>
          </Grid.Column>
          <Grid.Column width={5}>
            <TagCloudRegion
              entities={entities}
              categories={categories}
              concepts={concepts}
              tagCloudType={tagCloudType}
              onTagItemSelected={this.tagItemSelected.bind(this)}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={8}>
            <Header as='h2' textAlign='left'>Trend</Header>
          </Grid.Column>
          <Grid.Column width={8}>
            <SentimentChart
              entities={entities}
              categories={categories}
              concepts={concepts}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}

/**
 * parseData - convert raw search results into collection of matching results.
 */
const parseData = data => ({
  rawResponse: Object.assign({}, data),
  // sentiment: data.aggregations[0].results.reduce((accumulator, result) =>
  //   Object.assign(accumulator, { [result.key]: result.matching_results }), {}),
  results: data.results
});

/**
 * parseEntities - convert raw search results into collection of entities.
 */
const parseEntities = data => ({
  rawResponse: Object.assign({}, data),
  results: data.aggregations[utils.ENTITY_DATA_INDEX].results
});

/**
 * parseCategories - convert raw search results into collection of categories.
 */
const parseCategories = data => ({
  rawResponse: Object.assign({}, data),
  results: data.aggregations[utils.CATEGORY_DATA_INDEX].results
});

/**
 * parseConcepts - convert raw search results into collection of concepts.
 */
const parseConcepts = data => ({
  rawResponse: Object.assign({}, data),
  results: data.aggregations[utils.CONCEPT_DATA_INDEX].results
});

/**
 * scrollToMain - scroll window to show 'main' rendered object.
 */
function scrollToMain() {
  setTimeout(() => {
    const scrollY = document.querySelector('main').getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, scrollY);
  }, 0);
}

// type check to ensure we are called correctly
Main.propTypes = {
  data: PropTypes.object,
  entities: PropTypes.object,
  categories: PropTypes.object,
  concepts: PropTypes.object,
  searchQuery: PropTypes.string,
  selectedEntities: PropTypes.object,
  selectedCategories: PropTypes.object,
  selectedConcepts: PropTypes.object,
  numMatches: PropTypes.number,
  tagCloudType: PropTypes.string,
  currentPage: PropTypes.string,
  error: PropTypes.object
};

module.exports = Main;
