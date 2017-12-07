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

  // Callback functions for rendered objects
  handleAccordionClick(e, titleProps) {
    const { index } = titleProps;
    const { activeFilterIndex } = this.state;
    const newIndex = activeFilterIndex === index ? -1 : index;
    this.setState({ activeFilterIndex: newIndex });
  }

  filtersChanged() {
    const { searchQuery  } = this.state;
    this.fetchData(searchQuery, false);
  }

  /* handle page changs from pagination menu items */
  pageChanged(data) {
    this.setState({ currentPage: data.currentPage });
  }

  /* handle search string changes from search box */
  searchQueryChanged(query) {
    const { searchQuery } = query;
    console.log('searchQuery [FROM SEARCH]: ' + searchQuery);
   
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
    console.log('tagValue [FROM TAG CLOUD]: ' + selectedTagValue);

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
      currentPage: '1',
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

  // Functions to return render components
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
                    <Dimmer active>
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

const parseData = data => ({
  rawResponse: Object.assign({}, data),
  // sentiment: data.aggregations[0].results.reduce((accumulator, result) =>
  //   Object.assign(accumulator, { [result.key]: result.matching_results }), {}),
  results: data.results
});

const parseEntities = data => ({
  rawResponse: Object.assign({}, data),
  results: data.aggregations[utils.ENTITY_DATA_INDEX].results
});

const parseCategories = data => ({
  rawResponse: Object.assign({}, data),
  results: data.aggregations[utils.CATEGORY_DATA_INDEX].results
});

const parseConcepts = data => ({
  rawResponse: Object.assign({}, data),
  results: data.aggregations[utils.CONCEPT_DATA_INDEX].results
});

function scrollToMain() {
  setTimeout(() => {
    const scrollY = document.querySelector('main').getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, scrollY);
  }, 0);
}

module.exports = Main;
