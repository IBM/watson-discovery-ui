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
import { Header, Menu, Dropdown, Divider, Icon } from 'semantic-ui-react';
import { Doughnut } from 'react-chartjs-2';
const utils = require('../../lib/utils');

/**
 * This object renders a sentiment graph object that appears at the bottom
 * of the web page. It is composed of multiple objects, the graph,
 * and 2 drop-down menus where the user can select what filter (entities,
 * categories, or concepts) and/or what filter value (referred to as 'term') 
 * to represent. 
 * NOTE: the filter value of 'Term' indicates all values.
 * NOTE: what the user selects to represent in the graph has no effect
 *       on any other objects on the page. It is just manipulating the
 *       search data already retrieved.
 */
export default class SentimentChart extends React.Component {
  constructor(...props) {
    super(...props);

    this.state = {
      entities: this.props.entities,
      categories: this.props.categories,
      concepts: this.props.concepts,
      keywords: this.props.keywords,
      entityTypes: this.props.entityTypes,
      chartType: utils.ENTITY_FILTER,
      termValue: utils.SENTIMENT_TERM_ITEM
    };

    this.totals = {
      positiveNum: 0,
      neutralNum: 0,
      negativeNum: 0,
      matches: 0
    };
  }

  /**
   * filterTypeChange - user has selected a new filter type. This will
   * change the filter type values available to select from.
   */
  filterTypeChange(event, selection) {
    this.setState({
      chartType: selection.value,
      termValue: utils.SENTIMENT_TERM_ITEM
    });
  }

  /**
   * getTotals - add up all of the sentiment values for a specific 
   * group of objects (entities, categories, and concepts).
   */
  getTotals(collection, termValue) {
    this.totals.matches = 0;
    this.totals.positiveNum = 0;
    this.totals.neutralNum = 0;
    this.totals.negativeNum = 0;

    if (collection.results) {
      for (var item of collection.results) {
        if (termValue === '' || termValue === utils.SENTIMENT_TERM_ITEM || termValue === item.key) {
          this.totals.matches = this.totals.matches + item.matching_results;
          for (var sentiment of item.aggregations[0].results) {
            if (sentiment.key === 'positive') {
              this.totals.positiveNum = this.totals.positiveNum + sentiment.matching_results;
            } else if (sentiment.key === 'neutral') {
              this.totals.neutralNum = this.totals.neutralNum + sentiment.matching_results;
            } else if (sentiment.key === 'negative') {
              this.totals.negativeNum = this.totals.negativeNum + sentiment.matching_results;
            }
          }
        }
      }
    }
  }

  /**
   * getChartData - based on what group filter user has selected, accumulate 
   * all of the data needed to render the sentiment chart.
   */
  getChartData() {
    const {
      chartType,
      termValue,
      entities,
      categories,
      concepts,
      keywords,
      entityTypes
    } = this.state;
    
    if (chartType === utils.ENTITY_FILTER) {
      this.getTotals(entities, termValue);
    } else if (chartType === utils.CATEGORY_FILTER) {
      this.getTotals(categories, termValue);
    } else if (chartType === utils.CONCEPT_FILTER) {
      this.getTotals(concepts, termValue);
    } else if (chartType === utils.KEYWORD_FILTER) {
      this.getTotals(keywords, termValue);
    } else if (chartType === utils.ENTITY_TYPE_FILTER) {
      this.getTotals(entityTypes, termValue);
    }

    // console.log('    totalMatches: ' + this.totals.matches);
    // console.log('    totalPositive: ' + this.totals.positiveNum);
    // console.log('    totalNeutral: ' + this.totals.neutralNum);
    // console.log('    totalNegative: ' + this.totals.negativeNum);

    var ret = {
      // legend
      labels: [
        '% Positive',
        '% Neutral',
        '% Negative'
      ],
      datasets: [{
        // raw numbers
        data: [
          this.totals.positiveNum,
          this.totals.neutralNum,
          this.totals.negativeNum
        ],
        // colors for each piece of the graph
        backgroundColor: [
          'rgba(0,255,0,0.6)',
          'rgba(192,192,192,0.6)',
          'rgba(255,0,0,0.6)'
        ],
        hoverBackgroundColor: [
          'rgba(0,255,0,0.6)',
          'rgba(192,192,192,0.6)',
          'rgba(255,0,0,0.6)'
        ]
      }]
    };
    return ret;
  }

  /**
   * termTypeChange - user has selected a new term filter value. This will
   * modify the sentiment chart to just represent this term.
   */
  termTypeChange(event, selection) {
    const { termValue } = this.state;

    // only update if term has actually changed
    if (termValue != selection.value) {
      this.setState({
        termValue: selection.value
      });
      this.props.onSentimentTermChanged({
        term: selection.value
      });
    }
  }

  /**
   * getTermOptions - get the term items available to be selected by the user.
   */
  getTermOptions() {
    const { chartType, entities, categories, concepts, keywords, entityTypes } = this.state;
    var options = [{ key: -1, value: utils.SENTIMENT_TERM_ITEM, text: utils.SENTIMENT_TERM_ITEM }];
    var collection;

    // select based on the filter type
    if (chartType === utils.ENTITY_FILTER) {
      collection = entities.results;
    } else if (chartType === utils.CATEGORY_FILTER) {
      collection = categories.results;
    } else if (chartType === utils.CONCEPT_FILTER) {
      collection = concepts.results;
    } else if (chartType === utils.KEYWORD_FILTER) {
      collection = keywords.results;
    } else if (chartType === utils.ENTITY_TYPE_FILTER) {
      collection = entityTypes.results;
    }

    if (collection) {
      collection.map(item =>
        options.push({key: item.key, value: item.key, text: item.key})
      );
    }

    return options;
  }
  
  // Important - this is needed to ensure changes to main properties
  // are propagated down to our component. In this case, some other
  // search or filter event has occured which has changed the list of 
  // items we are graphing.
  componentWillReceiveProps(nextProps) {
    this.setState({ entities: nextProps.entities });
    this.setState({ categories: nextProps.categories });
    this.setState({ concepts: nextProps.concepts });
    this.setState({ keywords: nextProps.keywords });
    this.setState({ entityTypes: nextProps.entityTypes });
    this.setState({ termValue: nextProps.term });
  }

  /**
   * render - return all the sentiment objects to render.
   */
  render() {
    const { termValue } = this.state;

    const options = {
      responsive: true,
      legend: {
        position: 'bottom'
      },
      animation: {
        animateScale: true,
        animateRotate: true
      },
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            // convert raw number to percentage of total
            var dataset = data.datasets[tooltipItem.datasetIndex];
            var total = dataset.data.reduce(function(previousValue, currentValue) {
              return previousValue + currentValue;
            });
            var currentValue = dataset.data[tooltipItem.index];
            var precentage = Math.floor(((currentValue/total) * 100)+0.5);
            return precentage + '%';
          }
        }
      }
    };

    return (
      <div>
        <Header as='h2' block inverted textAlign='left'>
          <Icon name='pie chart' />
          <Header.Content>
            Sentiment Chart
            <Header.Subheader>
              Sentiment scores by percentage
            </Header.Subheader>
          </Header.Content>
        </Header>
        <Menu compact floated={true}>
          <Dropdown 
            item
            onChange={ this.filterTypeChange.bind(this) }
            defaultValue={ utils.ENTITY_FILTER }
            options={ utils.filterTypes }
          />
        </Menu>
        <Menu className='term-menu' compact floated={true}>
          <Dropdown 
            item
            scrolling
            value={ termValue }
            onChange={ this.termTypeChange.bind(this) }
            options={ this.getTermOptions() }
          />
        </Menu>
        <Divider clearing hidden/>
        <div>
          <Doughnut 
            data={ this.getChartData() }
            options={ options }
          />       
        </div>
      </div>
    );
  }
}

// type check to ensure we are called correctly
SentimentChart.propTypes = {
  entities: PropTypes.object,
  categories: PropTypes.object,
  concepts: PropTypes.object,
  keywords: PropTypes.object,
  entityTypes: PropTypes.object,
  chartType: PropTypes.string,
  term: PropTypes.string,
  onSentimentTermChanged: PropTypes.func.isRequired,
};
