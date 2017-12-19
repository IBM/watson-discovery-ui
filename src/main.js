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
import { Grid, Dimmer, Button, Divider, Loader, Accordion, Icon, Header, Statistic } from 'semantic-ui-react';
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
      // query data
      entities, 
      selectedEntities,
      categories, 
      selectedCategories,
      concepts, 
      selectedConcepts,
      keywords,
      selectedKeywords,
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
      // matches panel
      currentPage,
      // tag cloud
      tagCloudType,
      // trending chart
      trendData,
      trendError,
      trendTerm,
      // sentiment chart
      sentimentTerm
    } = this.props;

    // change in state fires re-render of components
    this.state = {
      // query data
      entities: entities && parseEntities(entities),
      selectedEntities: selectedEntities || new Set(),
      categories: categories && parseCategories(categories),
      selectedCategories: selectedCategories || new Set(),
      concepts: concepts && parseConcepts(concepts),
      selectedConcepts: selectedConcepts || new Set(),
      keywords: keywords && parseKeywords(keywords),
      selectedKeywords: selectedKeywords || new Set(),
      data: data && parseData(data),
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
      // tag cloud
      tagCloudType: tagCloudType || utils.ENTITIY_FILTER,
      // trending chart
      trendData: trendData || null,
      trendError: trendError,
      trendTerm: trendTerm || utils.TRENDING_TERM_ITEM,
      trendLoading: false,
      // sentiment chart
      sentimentTerm: sentimentTerm || utils.SENTIMENT_TERM_ITEM,
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
    console.log('searchQuery [FROM SEARCH]: ' + searchQuery);
   
    // true = clear all filters for new search
    this.fetchData(searchQuery, true);
  }

  /**
   * sentimentTermChanged - (callback function)
   * User has selected a new term to use in the sentiment
   * chart. Keep track of this so that main stays in sync.
   */
  sentimentTermChanged(data) {
    const { term } = data;
    this.setState({ sentimentTerm: term });
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
   * Keep track of the current term value so that main stays
   * in sync with the trending chart component.
   * 
   * NOTE: This function is also called at startup to 
   * display a default graph.
   */
  getTrendData(data) {
    var { limitResults } = this.state;
    var { chartType, term } = data;

    // we don't have any data to show for "all" items, so just clear chart
    if (term === utils.TRENDING_TERM_ITEM) {
      this.setState(
        { 
          trendData: null,
          trendLoading: false,
          trendError: null,
          trendTerm: term
        });
      return;
    } 
    
    this.setState({
      trendLoading: true,
      trendTerm: term
    });

    // build query string, with based on filter type
    var trendQuery = '';
    if (chartType === utils.ENTITIY_FILTER) {
      trendQuery = 'enriched_text.entities.text::' + term;
    } else if (chartType === utils.CATEGORY_FILTER) {
      trendQuery = 'enriched_text.categories.label::' + term;
    } else if (chartType === utils.CONCEPT_FILTER) {
      trendQuery = 'enriched_text.concepts.text::' + term;
    } else if (chartType === utils.KEYWORD_FILTER) {
      trendQuery = 'enriched_text.keywords.text::' + term;
    }

    const qs = queryString.stringify({
      query: trendQuery,
      filters: this.buildFilterString(),
      count: (limitResults == true ? 100 : 5000)
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
      console.log('+++ DISCO TREND RESULTS +++');
      // console.log(util.inspect(json.aggregations[0].results, false, null));
      console.log('numMatches: ' + json.matching_results);
      
      this.setState(
        { 
          trendData: json,
          trendLoading: false,
          trendError: null,
          trendTerm: term
        }
      );
    })
    .catch(response => {
      this.setState({
        trendError: (response.status === 429) ? 'Number of free queries per month exceeded' : 'Error fetching results',
        trendLoading: false,
        trendData: null,
        trendTerm: utils.TRENDING_TERM_ITEM
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
      count: (limitResults == true ? 100 : 5000),
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
          error: null,
          trendData: null,
          sentimentTerm: utils.SENTIMENT_TERM_ITEM,
          trendTerm: utils.TRENDING_TERM_ITEM
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
            selectedEntities, selectedCategories, selectedConcepts, selectedKeywords,
            numMatches, numPositive, numNeutral, numNegative,
            tagCloudType, trendData, trendLoading, trendError, trendTerm,
            queryType, returnPassages, limitResults,
            sentimentTerm } = this.state;

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
      selectedCategories.size > 0 ||
      selectedConcepts.size > 0 ||
      selectedKeywords.size > 0) {
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
            <Divider hidden/>
            <Divider/>
            <Divider hidden/>

            {/* Tag Cloud Region */}
    
            <Grid.Row>
              <TagCloudRegion
                entities={entities}
                categories={categories}
                concepts={concepts}
                keywords={keywords}
                tagCloudType={tagCloudType}
                onTagItemSelected={this.tagItemSelected.bind(this)}
              />
            </Grid.Row>
            
          </Grid.Column>

          {/* Results */}

          <Grid.Column width={7}>
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

          <Grid.Column width={6}>

            {/* Sentiment Chart Region */}

            <Grid.Row className='rrr'>
              <SentimentChart
                entities={entities}
                categories={categories}
                concepts={concepts}
                keywords={keywords}
                term={sentimentTerm}
                onSentimentTermChanged={this.sentimentTermChanged.bind(this)}
              />

            <Divider hidden/>
            <Divider/>
            <Divider hidden/>

            </Grid.Row>
            {/* Trend Chart Region */}

            <Grid.Row className='ttt'>
              <div className="trend-chart">
                <TrendChart
                  trendData={trendData}
                  trendLoading={trendLoading}
                  trendError={trendError}
                  entities={entities}
                  categories={categories}
                  concepts={concepts}
                  keywords={keywords}
                  term={trendTerm}
                  onGetTrendDataRequest={this.getTrendData.bind(this)}
                />
              </div>
            </Grid.Row>

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
  numPositive: PropTypes.number,
  numNeutral: PropTypes.number,
  numNegative: PropTypes.number,
  tagCloudType: PropTypes.string,
  currentPage: PropTypes.string,
  queryType: PropTypes.string,
  returnPassages: PropTypes.bool,
  limitResults: PropTypes.bool,
  trendData: PropTypes.object,
  trendError: PropTypes.object,
  trendTerm: PropTypes.string,
  sentimentTerm: PropTypes.string,
  error: PropTypes.object
};

module.exports = Main;
