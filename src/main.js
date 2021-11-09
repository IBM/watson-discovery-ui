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
import KeywordsFilter from './KeywordsFilter';
import EntityTypesFilter from './EntityTypesFilter';
import TagCloudRegion from './TagCloudRegion';
import { Grid, Dimmer, Button, Menu, Dropdown, Divider, Loader, Accordion, Icon, Header, Statistic } from 'semantic-ui-react';
const utils = require('../lib/utils');

/**
 * Main React object that contains all objects on the web page.
 * This object manages all interaction between child objects as
 * well as making search requests to the discovery service.
 */
class Main extends React.Component {
  constructor(...props) {
    super(...props);
    const { 
      // query data
      entities, 
      keywords,
      entityTypes,
      data,
      numMatches,
      numPositive,
      numNeutral,
      numNegative,
      error,
      // query params
      searchQuery,
      queryType,
      returnPassages,
      limitResults,
      sortOrder,
      // for filters
      selectedEntities,
      selectedKeywords,
      selectedEntityTypes,
      // matches panel
      currentPage,
      // tag cloud
      tagCloudType,
    } = this.props;

    // change in state fires re-render of components
    this.state = {
      // query data
      entities: entities && parseEntities(entities),
      keywords: keywords && parseKeywords(keywords),
      entityTypes: entityTypes && parseEntityTypes(entityTypes),
      data: data,   // data should already be formatted
      numMatches: numMatches || 0,
      numPositive: numPositive || 0,
      numNeutral: numNeutral || 0,
      numNegative: numNegative || 0,
      loading: false,
      error: error,
      // query params
      searchQuery: searchQuery || '',
      queryType: queryType || utils.QUERY_NATURAL_LANGUAGE,
      returnPassages: returnPassages || false,
      limitResults: limitResults || false,
      sortOrder: sortOrder || utils.sortKeys[0].sortBy,
      // used by filters
      selectedEntities: selectedEntities || new Set(),
      selectedKeywords: selectedKeywords || new Set(),
      selectedEntityTypes: selectedEntityTypes || new Set(),
      // tag cloud
      tagCloudType: tagCloudType || utils.ENTITY_FILTER,
      // misc panel
      currentPage: currentPage || '1',  // which page of matches are we showing
      activeFilterIndex: 0,             // which filter index is expanded/active
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
   * handleClearAllFiltersClick - (callback function)
   * User has selected button to clear out all filters.
   * This results in making a new qeury to the disco
   * service with no filters turned on.
   */
  handleClearAllFiltersClick() {
    const { searchQuery  } = this.state;
    this.fetchData(searchQuery, true);
  }

  /**
   * searchParamsChanged - (callback function)
   * User has toggled one of the optional params listed in the
   * search bar. Set state so that searchField checkboxes get
   * set accordingly.
   */
  searchParamsChanged(data) {
    const { queryType, returnPassages, limitResults} = this.state;
    if (data.label === 'queryType') {
      var newQueryType = queryType === utils.QUERY_DISCO_LANGUAGE ?
        utils.QUERY_NATURAL_LANGUAGE : utils.QUERY_DISCO_LANGUAGE;
      this.setState({ queryType: newQueryType });
    } else if (data.label === 'returnPassages') {
      this.setState({ returnPassages: !returnPassages });
    } else if (data.label === 'limitResults') {
      this.setState({ limitResults: !limitResults });
    }
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
    // console.log('searchQuery [FROM SEARCH]: ' + searchQuery);
   
    // true = clear all filters for new search
    this.fetchData(searchQuery, true);
  }

  /**
   * sortOrderChange - (callback function)
   * User has changed how to sort the matches (default
   * is by highest sentiment score first). Save the value for
   * all subsequent queries to discovery.
   */

  sortBy(property) {
    var sortOrder = 1;
    if (property[0] === '-') {
      sortOrder = -1;
      property = property.substr(1);
    }
    return function (a,b) {
      /* next line works with strings and numbers, 
       * and you may want to customize it to your needs
       */
      var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
      return result * sortOrder;
    };
  }

  sortOrderChange(event, selection) {
    const { sortOrder, data } = this.state;
    if (sortOrder != selection.value) {
      var sortedData = data.results.slice();

      // get internal version of the sort key
      var internalSortKey = '';
      for (var i=0; i<utils.sortKeys.length; i++) {
        if (utils.sortKeys[i].sortBy === selection.value) {
          internalSortKey = utils.sortKeys[i].sortByInt;
          break;
        }
      }

      console.log('internalSortKey: ' + internalSortKey);
      // sort by internal key
      sortedData.sort(this.sortBy(internalSortKey));
      data.results = sortedData;

      // save off external key in case we do another query to Discovery
      this.setState({
        data: data,
        sortOrder: selection.value
      });
    }
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
      // concepts, selectedConcepts,
      keywords, selectedKeywords,
      entityTypes, selectedEntityTypes,
      searchQuery  } = this.state;

    if (cloudType == utils.KEYWORD_FILTER) {
      var fullName = this.buildFullTagName(selectedTagValue, keywords.results);
      if (selectedKeywords.has(fullName)) {
        selectedKeywords.delete(fullName);
      } else {
        selectedKeywords.add(fullName);
      }
      this.setState({
        selectedKeywords: selectedKeywords
      });

    } else if (cloudType == utils.ENTITY_FILTER) {
      fullName = this.buildFullTagName(selectedTagValue, entities.results);
      console.log('fullName: ' + fullName);
      if (selectedEntities.has(fullName)) {
        selectedEntities.delete(fullName);
      } else {
        selectedEntities.add(fullName);
      }
      console.log('selected entities: ' + JSON.stringify(selectedEntities, null, 2));
      this.setState({
        selectedEntities: selectedEntities
      });

    } else if (cloudType == utils.ENTITY_TYPE_FILTER) {
      fullName = this.buildFullTagName(selectedTagValue, entityTypes.results);
      if (selectedEntityTypes.has(fullName)) {
        selectedEntityTypes.delete(fullName);
      } else {
        selectedEntityTypes.add(fullName);
      }
      this.setState({
        selectedEntityTypes: selectedEntityTypes
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
    var { 
      selectedEntities, 
      selectedKeywords,
      selectedEntityTypes,
      queryType,
      returnPassages,
      limitResults,
      sortOrder
    } = this.state;

    // clear filters if this a new text search
    if (clearFilters) {
      selectedEntities.clear();
      selectedKeywords.clear();
      selectedEntityTypes.clear();
    }

    this.setState({
      loading: true,
      currentPage: '1',
      searchQuery
    });

    scrollToMain();
    history.pushState({}, {}, `/${searchQuery.replace(/ /g, '+')}`);
    const filterString = this.buildFilterStringForQuery();

    // build query string, with filters and optional params
    // if user wants passages, turn off highlighting
    var highlightsOn = !returnPassages;
    const qs = queryString.stringify({
      query: searchQuery,
      filters: filterString,
      count: (limitResults == true ? 100 : 1000),
      sort: sortOrder,
      highlight: highlightsOn,
      queryType: (queryType === utils.QUERY_NATURAL_LANGUAGE ? 
        'natural_language_query' : 'query:'),
    });

    // send request
    fetch(`/api/search?${qs}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .then(json => {
        var data = utils.parseData(json);

        data = utils.formatData(data, returnPassages, filterString);
        
        console.log('+++ DISCO RESULTS +++');
        // console.log(JSON.stringify(data.results, null, 2));
        console.log('numMatches: ' + data.results.length);
      
        // add up totals for the sentiment of reviews
        var totals = utils.getTotals(data);

        this.setState({
          data: data,
          entities: parseEntities(json),
          keywords: parseKeywords(json),
          entityTypes: parseEntityTypes(json),
          loading: false,
          numMatches: data.results.length,
          numPositive: totals.numPositive,
          numNegative: totals.numNegative,
          numNeutral: totals.numNeutral,
          error: null,
        });
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
   * buildFilterStringForFacet - build the filter string for
   * one set of filter objects.
   */
  buildFilterStringForFacet(collection, keyName, firstOne) {
    var str = '';
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
   * buildFilterStringForQuery - convert all selected filters into a string
   * to be added to the search query sent to the discovery service
   */
  buildFilterStringForQuery() {
    var { 
      selectedEntities, 
      selectedKeywords,
      selectedEntityTypes
    } = this.state;
    var filterString = '';
    
    // add any entities filters, if selected
    var entitiesString = this.buildFilterStringForFacet(selectedEntities,
      'enriched_text.entities.text::', true);
    filterString = filterString + entitiesString;
      
    // add any keyword filters, if selected
    var keywordString = this.buildFilterStringForFacet(selectedKeywords,
      'enriched_text.keywords.text::', filterString === '');
    filterString = filterString + keywordString;

    // add any entities type filters, if selected
    var entityTypesString = this.buildFilterStringForFacet(selectedEntityTypes,
      'enriched_text.entities.type::', filterString === '');
    filterString = filterString + entityTypesString;

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
    // const { data, currentPage, sessionToken } = this.state;
    const { data, currentPage } = this.state;

    if (!data) {
      return null;
    }

    // get one page of matches
    var page = parseInt(currentPage);
    var startIdx = (page - 1) * utils.ITEMS_PER_PAGE;
    var pageOfMatches = data.results.slice(startIdx,startIdx+utils.ITEMS_PER_PAGE);

    return (
      <Matches 
        matches={ pageOfMatches }
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
        <div className='matches-pagination-bar'>
          <PaginationMenu
            numMatches={numMatches}
            onPageChange={this.pageChanged.bind(this)}
          />
        </div>
      );
    } else {
      return null;
    }
  }

  /**
   * getEntitiesFilter - return entities filter object to be rendered.
   */
  getEntitiesFilter() {
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
   * getKeywordsFilter - return keywords filter object to be rendered.
   */
  getKeywordsFilter() {
    const { keywords, selectedKeywords } = this.state;
    if (!keywords) {
      return null;
    }
    return (
      <KeywordsFilter
        onFilterItemsChange={this.filtersChanged.bind(this)}
        keywords={keywords.results}
        selectedKeywords={selectedKeywords}
      />
    );
  }

  /**
   * getEntityTypeFilter - return entity types filter object to be rendered.
   */
  getEntityTypesFilter() {
    const { entityTypes, selectedEntityTypes } = this.state;
    if (!entityTypes) {
      return null;
    }
    return (
      <EntityTypesFilter
        onFilterItemsChange={this.filtersChanged.bind(this)}
        entityTypes={entityTypes.results}
        selectedEntityTypes={selectedEntityTypes}
      />
    );
  }

  /**
   * render - return all the home page object to be rendered.
   */
  render() {
    const { loading, data, error, searchQuery,
      entities, keywords, entityTypes,
      selectedEntities, selectedKeywords, selectedEntityTypes,
      numMatches, numPositive, numNeutral, numNegative,
      tagCloudType, queryType, 
      returnPassages, limitResults, sortOrder } = this.state;

    // used for filter accordions
    const { activeFilterIndex } = this.state;

    const stat_items = [
      { key: 'matches', label: 'REVIEWS', value: numMatches },
      { key: 'positive', label: 'POSITIVE', value: numPositive },
      { key: 'neutral', label: 'NEUTRAL', value: numNeutral },
      { key: 'negative', label: 'NEGATIVE', value: numNegative }
    ];

    var filtersOn = false;
    if (selectedEntities.size > 0 ||
        selectedEntityTypes.size > 0 ||
        selectedKeywords.size > 0 ) {
      filtersOn = true;
    }

    return (
      <Grid celled className='search-grid'>

        {/* Search Field Header */}

        <Grid.Row color={'blue'}>
          <Grid.Column width={16} textAlign='center'>
            <SearchField
              onSearchQueryChange={this.searchQueryChanged.bind(this)}
              onSearchParamsChange={this.searchParamsChanged.bind(this)}
              searchQuery={searchQuery}
              queryType={queryType}
              returnPassages={returnPassages}
              limitResults={limitResults}
            />
          </Grid.Column>
        </Grid.Row>

        {/* Results Panel */}

        <Grid.Row className='matches-grid-row'>

          {/* Drop-Down Filters */}

          <Grid.Column width={3}>
            {filtersOn ? (
              <Button
                compact
                basic
                color='red'
                content='clear all'
                icon='remove'
                onClick={this.handleClearAllFiltersClick.bind(this)}
              />
            ) : null}
            <Header as='h2' block inverted textAlign='left'>
              <Icon name='filter' />
              <Header.Content>
                Filter
                <Header.Subheader>
                  By List
                </Header.Subheader>
              </Header.Content>
            </Header>
            <Accordion styled>
              <Accordion.Title 
                active={activeFilterIndex == utils.ENTITY_DATA_INDEX}
                index={utils.ENTITY_DATA_INDEX}
                onClick={this.handleAccordionClick.bind(this)}>
                <Icon name='dropdown' />
                Entities
              </Accordion.Title>
              <Accordion.Content active={activeFilterIndex == utils.ENTITY_DATA_INDEX}>
                {this.getEntitiesFilter()}
              </Accordion.Content>
            </Accordion>
            <Accordion styled>
              <Accordion.Title
                active={activeFilterIndex == utils.KEYWORD_DATA_INDEX}
                index={utils.KEYWORD_DATA_INDEX}
                onClick={this.handleAccordionClick.bind(this)}>
                <Icon name='dropdown' />
                Keywords
              </Accordion.Title>
              <Accordion.Content active={activeFilterIndex == utils.KEYWORD_DATA_INDEX}>
                {this.getKeywordsFilter()}
              </Accordion.Content>
            </Accordion>
            <Accordion styled>
              <Accordion.Title
                active={activeFilterIndex == utils.ENTITY_TYPE_DATA_INDEX}
                index={utils.ENTITY_TYPE_INDEX}
                onClick={this.handleAccordionClick.bind(this)}>
                <Icon name='dropdown' />
                Entity Types
              </Accordion.Title>
              <Accordion.Content active={activeFilterIndex == utils.ENTITY_TYPE_INDEX}>
                {this.getEntityTypesFilter()}
              </Accordion.Content>
            </Accordion>
            <Divider hidden/>
            <Divider/>
            <Divider hidden/>

            {/* Tag Cloud Region */}
    
            <Grid.Row>
              <TagCloudRegion
                entities={entities}
                // categories={categories}
                // concepts={concepts}
                keywords={keywords}
                entityTypes={entityTypes}
                tagCloudType={tagCloudType}
                onTagItemSelected={this.tagItemSelected.bind(this)}
              />
            </Grid.Row>
            
          </Grid.Column>

          {/* Results */}

          <Grid.Column width={13}>
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
                      <div>
                        <Header as='h2' block inverted textAlign='left'>
                          <Icon name='grid layout' />
                          <Header.Content>
                            Matches
                          </Header.Content>
                        </Header>
                        <Statistic.Group
                          size='mini'
                          items={ stat_items }
                        />
                        <Menu compact className="sort-dropdown">
                          <Icon name='sort' size='large' bordered inverted />
                          <Dropdown 
                            item
                            onChange={ this.sortOrderChange.bind(this) }
                            value={ sortOrder }
                            options={ utils.sortTypes }
                          />
                        </Menu>
                      </div>
                      <div>
                        {this.getMatches()}
                      </div>
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

            {/* Pagination Menu */}

            <Grid.Row>
              {this.getPaginationMenu()}
            </Grid.Row>
          </Grid.Column>

        </Grid.Row>
      </Grid>
    );
  }
}

/**
 * parseEntities - convert raw search results into collection of entities.
 */
const parseEntities = data => ({
  rawResponse: Object.assign({}, data),
  results: data.result.aggregations[utils.ENTITY_DATA_INDEX].results
});

/**
 * parseKeywords - convert raw search results into collection of keywords.
 */
const parseKeywords = data => ({
  rawResponse: Object.assign({}, data),
  results: data.result.aggregations[utils.KEYWORD_DATA_INDEX].results
});

/**
 * parseEntityTypes - convert raw search results into collection of entity types.
 */
const parseEntityTypes = data => ({
  rawResponse: Object.assign({}, data),
  results: data.result.aggregations[utils.ENTITY_TYPE_DATA_INDEX].results
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
  keywords: PropTypes.object,
  entityTypes: PropTypes.object,
  searchQuery: PropTypes.string,
  selectedEntities: PropTypes.object,
  selectedKeywords: PropTypes.object,
  selectedEntityTypes: PropTypes.object,
  numMatches: PropTypes.number,
  numPositive: PropTypes.number,
  numNeutral: PropTypes.number,
  numNegative: PropTypes.number,
  tagCloudType: PropTypes.string,
  currentPage: PropTypes.string,
  queryType: PropTypes.string,
  returnPassages: PropTypes.bool,
  limitResults: PropTypes.bool,
  sortOrder: PropTypes.string,
  error: PropTypes.object
};

module.exports = Main;
