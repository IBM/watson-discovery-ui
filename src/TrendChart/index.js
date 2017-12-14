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
import { Header, Menu, Dropdown, Divider } from 'semantic-ui-react';
import { Line } from 'react-chartjs-2';
const utils = require('../utils');

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
export default class TrendChart extends React.Component {
  constructor(...props) {
    super(...props);

    this.state = {
      trendData: this.props.trendData,
      entities: this.props.entities,
      categories: this.props.categories,
      concepts: this.props.concepts,
      keywords: this.props.keywords,
      chartType: utils.ENTITIY_FILTER,
      termValue: utils.TERM_ITEM
    };
  }

  /**
   * filterTypeChange - user has selected a new filter type. This will
   * change the filter type values available to select from.
   */
  filterTypeChange(event, selection) {
    this.setState({
      chartType: selection.value,
      termValue: utils.TERM_ITEM
    });
  }

  /**
   * getChartData - based on what group filter user has selected, accumulate 
   * all of the data needed to render the sentiment chart.
   */
  getChartData() {
    const { trendData, termValue } = this.state;

    var posHits = [0,0,0,0,0,0,0];
    var negHits = [0,0,0,0,0,0,0];
    
    if (trendData) {
      // console.log("numMatches2: " + trendData.matching_results);
      // console.log("termValue: " + termValue);
      trendData.results.forEach(function(result) {
        if (result.enriched_text) {
          // console.log("result.enriched_text: " + result.enriched_text);
          result.enriched_text.entities.forEach(function(entity) {
            // console.log("result.enriched_text.entities.length: " + result.enriched_text.entities.length);
            if (termValue === utils.TERM_ITEM || entity.text === termValue) {
              // console.log('date: ' + result.date + 
              // ' entity: ' + entity.text +
              // ' sentiment.score: ' + entity.sentiment.score);
              var arrayIdx = parseInt(result.date.substring(0,4)) - 2009;
              // console.log("Index: " + arrayIdx);
              if (arrayIdx < 0 || arrayIdx > posHits.length) {
                console.log("Error processesing trend data - date out of range: " + result.date);
              } else {
                if (entity.sentiment.label == 'positive') {
                  posHits[arrayIdx] = posHits[arrayIdx] + 1;
                } else if (entity.sentiment.label == 'negative') {
                  negHits[arrayIdx] = negHits[arrayIdx] + 1;
                }                
              }
            }
          });
        }
      });
    }

    var ret = {
      labels: ['2009', '2010', '2011', '2012', '2013', '2014', '2015'],
      datasets: [{
        label: 'Positive Reviews',
        data: posHits,
        backgroundColor: "rgba(153,255,51,0.4)"
      }, {
        label: 'Negative Reviews',
        data: negHits,
        backgroundColor: "rgba(255,153,0,0.4)"
      }]
    };

    return ret;
  }

  /**
   * termTypeChange - user has selected a new term filter value. This will
   * modify the sentiment chart to just represent this term.
   */
  termTypeChange(event, selection) {
    const { chartType } = this.state;
    this.setState({ termValue: selection.value });

    this.props.onGetTrendDataRequest({
      chartType: chartType,
      term: selection.value
    });
  }

  /**
   * getTermOptions - get the term items available to be selected by the user.
   */
  getTermOptions() {
    const { chartType, entities, categories, concepts, keywords } = this.state;
    var options = [{ key: -1, value: utils.TERM_ITEM, text: utils.TERM_ITEM }];
    var collection;

    // select based on the filter type
    if (chartType === utils.ENTITIY_FILTER) {
      collection = entities.results;
    } else if (chartType === utils.CATEGORY_FILTER) {
      collection = categories.results;
    } else if (chartType === utils.CONCEPT_FILTER) {
      collection = concepts.results;
    } else if (chartType === utils.KEYWORD_FILTER) {
      collection = keywords.results;
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
  // items we are graphing, OR the graph data has arrived.
  componentWillReceiveProps(nextProps) {
    this.setState({ trendData: nextProps.trendData });
    this.setState({ entities: nextProps.entities });
    this.setState({ categories: nextProps.categories });
    this.setState({ concepts: nextProps.concepts });
    this.setState({ keywords: nextProps.keywords });
  }

  /**
   * render - return all the sentiment objects to render.
   */
  render() {
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
        <Header as='h2' textAlign='left'>Trend</Header>
        <Menu compact floated={true}>
          <Dropdown 
            item
            onChange={ this.filterTypeChange.bind(this) }
            defaultValue={ utils.ENTITIY_FILTER }
            options={ utils.filterTypes }
          />
        </Menu>
        <Menu compact floated={true}>
          <Dropdown 
            item
            scrolling
            defaultValue={ utils.TERM_ITEM }
            onChange={ this.termTypeChange.bind(this) }
            options={ this.getTermOptions() }
          />
        </Menu>
        <Divider clearing hidden/>
        <div>
          <Line
            type={'line'}
            data={ this.getChartData() }
          />       
        </div>
      </div>
    );
  }
}

// type check to ensure we are called correctly
TrendChart.propTypes = {
  entities: PropTypes.object,
  categories: PropTypes.object,
  concepts: PropTypes.object,
  keywords: PropTypes.object,
  chartType: PropTypes.string,
  termValue: PropTypes.string,
  onGetTrendDataRequest: PropTypes.func.isRequired,
};
