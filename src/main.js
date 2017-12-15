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
import KeywordsFilter from './KeywordsFilter';
import TagCloudRegion from './TagCloudRegion';
import TrendChart from './TrendChart';
import SentimentChart from './SentimentChart';
import { Grid, Dimmer, Divider, Loader, Accordion, Icon, Header, Statistic } from 'semantic-ui-react';
const utils = require('./utils');

// review totals used in various sections of the main page
var _gReviewTotals = {};

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
      keywords,
      selectedKeywords,
      data, 
      searchQuery,
      tagCloudType,
      currentPage,
      numMatches,
      numPositive,
      numNeutral,
      numNegative,
      queryType,
      returnPassages,
      limitResults,
      trendData,
      error,
      trendError
    } = this.props;

    // change in state fires re-render of components
    this.state = {
      error: error,
      trendError: trendError,
      data: data && parseData(data),
      entities: entities && parseEntities(entities),
      categories: categories && parseCategories(categories),
      concepts: concepts && parseConcepts(concepts),
      keywords: keywords && parseKeywords(keywords),
      loading: false,
      trendLoading: false,
      searchQuery: searchQuery || '',
      selectedEntities: selectedEntities || new Set(),
      selectedCategories: selectedCategories || new Set(),
      selectedConcepts: selectedConcepts || new Set(),
      selectedKeywords: selectedKeywords || new Set(),
      tagCloudType: tagCloudType || utils.ENTITIY_FILTER,
      currentPage: currentPage || '1',
      numMatches: numMatches || 0,
      numPositive: numPositive || 0,
      numNeutral: numNeutral || 0,
      numNegative: numNegative || 0,
      activeFilterIndex: 0,
      queryType: queryType || utils.QUERY_NATURAL_LANGUAGE,
      returnPassages: returnPassages || false,
      limitResults: limitResults || false,
      trendData: trendData || null
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
            keywords, selectedKeywords,
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
    } else if (cloudType == utils.KEYWORD_FILTER) {
      fullName = this.buildFullTagName(selectedTagValue, keywords.results);
      if (selectedKeywords.has(fullName)) {
        selectedKeywords.delete(fullName);
      } else {
        selectedKeywords.add(fullName);
      }

      this.setState({
        selectedKeywords: selectedKeywords
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
   * getTrendData - (callback function)
   * User has entered a new search string to query on. 
   * This results in making a new qeury to the disco service.
   * 
   * NOTE: This function is also called at startup to 
   * display a default graph.
   */
  getTrendData(data) {
    this.setState({
      trendLoading: true
    });

    // we don't have any data to show for "all" items, so just clear chart
    if (data.term === utils.TERM_ITEM) {
      this.setState(
        { 
          trendData: new Array(),
          trendLoading: false,
          trendError: null
        });
        return;
    }

    // build query string, with based on filter type
    var trendQuery = '';
    if (data.chartType === utils.ENTITIY_FILTER) {
      trendQuery = 'enriched_text.entities.text::' + data.term;
    } else if (data.chartType === utils.CATEGORY_FILTER) {
      trendQuery = 'enriched_text.categories.label::' + data.term;
    } else if (data.chartType === utils.CONCEPT_FILTER) {
      trendQuery = 'enriched_text.concepts.text::' + data.term;
    } else if (data.chartType === utils.KEYWORD_FILTER) {
      trendQuery = 'enriched_text.keywords.text::' + data.term;
    }

    const qs = queryString.stringify({
      query: trendQuery
    });

    // send request
    fetch(`/api/trending?${qs}`)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw response;
      }
    })
    .then(json => {
      // const util = require('util');
      console.log("++++++++++++ DISCO TREND RESULTS ++++++++++++++++++++");
      // console.log(util.inspect(json.aggregations[0].results, false, null));
      console.log("numMatches: " + json.matching_results);
      
      this.setState(
        { 
          trendData: json,
          trendLoading: false,
          trendError: null
        }
      );
    })
    .catch(response => {
      this.setState({
        trendError: (response.status === 429) ? 'Number of free queries per month exceeded' : 'Error fetching results',
        trendLoading: false,
        trendData: new Array()
      });
      // eslint-disable-next-line no-console
      console.error(response);
    });
  }
  
  /**
   * fetchData - build the query that will be passed to the 
   * discovery service.
   */
  fetchData(query, clearFilters) {
    const searchQuery = query;
    var { 
      selectedEntities, 
      selectedCategories, 
      selectedConcepts,
      selectedKeywords,
      queryType,
      returnPassages,
      limitResults
    } = this.state;

    // clear filters if this a new text search
    if (clearFilters) {
      selectedEntities.clear();
      selectedCategories.clear();
      selectedConcepts.clear();
      selectedKeywords.clear();
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

    // build query string, with filters and optional params
    const qs = queryString.stringify({
      query: searchQuery,
      filters: this.buildFilterString(),
      count: (limitResults == true ? 100 : 1000),
      returnPassages: returnPassages,
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
      var data = parseData(json);
      var numPositive = 0;
      var numNegative = 0;
      var numNeutral = 0;

      // const util = require('util');
      // console.log("++++++++++++ DISCO RESULTS ++++++++++++++++++++");
      // console.log(util.inspect(data.results, false, null));

      // add up totals for the sentiment of reviews
      data.results.forEach(function (result) {
        if (result.enriched_text.sentiment.document.label === 'positive') {
          numPositive = numPositive + 1;
        } else if (result.enriched_text.sentiment.document.label === 'negative') {
          numNegative = numNegative + 1;
        } else if (result.enriched_text.sentiment.document.label === 'neutral') {
          numNeutral = numNeutral + 1;
        }
      });

      this.setState(
        { 
          data: data,
          entities: parseEntities(json),
          categories: parseCategories(json),
          concepts: parseConcepts(json),
          keywords: parseKeywords(json),
          loading: false,
          numMatches: json.results.length,
          numPositive: numPositive,
          numNegative: numNegative,
          numNeutral: numNeutral,
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
  buildFilterString() {
    var { 
      selectedEntities, 
      selectedCategories, 
      selectedConcepts,
      selectedKeywords
    } = this.state;
    var filterString = '';
    
    // add any entities filters, if selected
    var entitiesString = this.buildFilterStringForType(selectedEntities,
      'enriched_text.entities.text::', true);
    filterString = filterString + entitiesString;
      
    // add any category filters, if selected
    var categoryString = this.buildFilterStringForType(selectedCategories,
      'enriched_text.categories.label::', filterString === '');
    filterString = filterString + categoryString;

    // add any concept filters, if selected
    var conceptString = this.buildFilterStringForType(selectedConcepts,
      'enriched_text.concepts.text::', filterString === '');
    filterString = filterString + conceptString;

    // add any keyword filters, if selected
    var keywordString = this.buildFilterStringForType(selectedKeywords,
      'enriched_text.keywords.text::', filterString === '');
    filterString = filterString + keywordString;

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
   * getKeywords - return keywords filter object to be rendered.
   */
  getKeywords() {
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
   * render - return all the home page object to be rendered.
   */
  render() {
    const { loading, data, error, searchQuery,
            entities, categories, concepts, keywords,
            numMatches, numPositive, numNeutral, numNegative,
            tagCloudType, trendData, trendLoading, trendError,
            queryType, returnPassages, limitResults } = this.state;

    // used for filter accordions
    const { activeFilterIndex } = this.state;

    const stat_items = [
      { key: 'matches', label: 'REVIEWS', value: numMatches },
      { key: 'positive', label: 'POSITIVE', value: numPositive },
      { key: 'neutral', label: 'NEUTRAL', value: numNeutral },
      { key: 'negative', label: 'NEGATIVE', value: numNegative }
    ];
    
    return (
      <Grid celled className='search-grid'>
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
        <Grid.Row className='matches-grid-row'>
            <Grid.Column width={3}>
              <Header as='h2' textAlign='left'>Filter</Header>
              <Accordion styled>
                <Accordion.Title 
                  active={activeFilterIndex == utils.ENTITY_DATA_INDEX}
                  index={utils.ENTITY_DATA_INDEX}
                  onClick={this.handleAccordionClick.bind(this)}>
                  <Icon name='dropdown' />
                  Entities
                </Accordion.Title>
                <Accordion.Content active={activeFilterIndex == utils.ENTITY_DATA_INDEX}>
                  {this.getEntities()}
                </Accordion.Content>
              </Accordion>
              <Accordion styled>
                <Accordion.Title 
                  active={activeFilterIndex == utils.CATEGORY_DATA_INDEX}
                  index={utils.CATEGORY_DATA_INDEX}
                  onClick={this.handleAccordionClick.bind(this)}>
                  <Icon name='dropdown' />
                  Categories
                </Accordion.Title>
                <Accordion.Content active={activeFilterIndex == utils.CATEGORY_DATA_INDEX}>
                  {this.getCategories()}
                </Accordion.Content>
              </Accordion>
              <Accordion styled>
                <Accordion.Title 
                  active={activeFilterIndex == utils.CONCEPT_DATA_INDEX}
                  index={utils.CONCEPT_DATA_INDEX}
                  onClick={this.handleAccordionClick.bind(this)}>
                  <Icon name='dropdown' />
                  Concepts
                </Accordion.Title>
                <Accordion.Content active={activeFilterIndex == utils.CONCEPT_DATA_INDEX}>
                  {this.getConcepts()}
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
                  {this.getKeywords()}
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
                      <div>
                        <Statistic.Group
                          size='mini'
                          items={ stat_items }
                        />
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
            <Grid.Row>
              {this.getPaginationMenu()}
            </Grid.Row>
          </Grid.Column>
          <Grid.Column width={5}>
            <TagCloudRegion
              entities={entities}
              categories={categories}
              concepts={concepts}
              keywords={keywords}
              tagCloudType={tagCloudType}
              onTagItemSelected={this.tagItemSelected.bind(this)}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={8}>
            <TrendChart
              trendData={trendData}
              trendLoading={trendLoading}
              trendError={trendError}
              entities={entities}
              categories={categories}
              concepts={concepts}
              keywords={keywords}
              onGetTrendDataRequest={this.getTrendData.bind(this)}
            />
          </Grid.Column>
          <Grid.Column width={8}>
            <SentimentChart
              entities={entities}
              categories={categories}
              concepts={concepts}
              keywords={keywords}
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
 * parseKeywords - convert raw search results into collection of keywords.
 */
const parseKeywords = data => ({
  rawResponse: Object.assign({}, data),
  results: data.aggregations[3].results
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
  keywords: PropTypes.object,
  searchQuery: PropTypes.string,
  selectedEntities: PropTypes.object,
  selectedCategories: PropTypes.object,
  selectedConcepts: PropTypes.object,
  selectedKeywords: PropTypes.object,
  numMatches: PropTypes.number,
  tagCloudType: PropTypes.string,
  currentPage: PropTypes.string,
  queryType: PropTypes.string,
  returnPassages: PropTypes.bool,
  limitResults: PropTypes.bool,
  trendData: PropTypes.object,
  error: PropTypes.object
};

module.exports = Main;
