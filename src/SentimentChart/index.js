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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Grid, Header, Menu, Dropdown } from 'semantic-ui-react';
import { Doughnut } from 'react-chartjs-2';
const utils = require('../utils');
const util = require('util');

export default class SentimentChart extends React.Component {
  constructor(...props) {
    super(...props);

    this.state = {
      entities: this.props.entities,
      categories: this.props.categories,
      concepts: this.props.concepts,
      chartType: utils.ENTITIY_FILTER,
      termValue: 'Term'
    };

    this.totals = {
      positiveNum: 0,
      neutralNum: 0,
      negativeNum: 0,
      matches: 0
    };
  }

  filterTypeChange(event, selection) {
    console.log('selection.value: ' + selection.value);
    const { chartType } = this.state;
    this.setState(({ chartType }) => (
      {
        chartType: selection.value,
        termValue: 'Term'
      }
    ));
  }

  getTotals(collection, termValue) {
    this.totals.matches = 0;
    this.totals.positiveNum = -2;  // TEMP: cheat to get some other numbers on chart
    this.totals.neutralNum = 1;
    this.totals.negativeNum = 1;

    for (var item of collection.results) {
      if (termValue === '' || termValue === 'Term' || termValue === item.key) {
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

  getChartData() {
    const { chartType, termValue, entities, categories, concepts } = this.state;
    
    console.log("chartType: " + chartType);
    if (chartType === utils.ENTITIY_FILTER) {
      console.log("entities:");
      this.getTotals(entities, termValue);
    } else if (chartType === utils.CATEGORY_FILTER) {
      this.getTotals(categories, termValue);
    } else if (chartType === utils.CONCEPT_FILTER) {
      this.getTotals(concepts, termValue);
    }

    console.log('    totalMatches: ' + this.totals.matches);
    console.log('    totalPositive: ' + this.totals.positiveNum);
    console.log('    totalNeutral: ' + this.totals.neutralNum);
    console.log('    totalNegative: ' + this.totals.negativeNum);

    var ret = {
      labels: [
        'Positive',
        'Neutral',
        'Negative'
      ],
      datasets: [{
        data: [
          this.totals.positiveNum,
          this.totals.neutralNum,
          this.totals.negativeNum
        ],
        backgroundColor: [
          '#358D35',
          '#C2C2C2',
          '#C6354D'
        ],
        hoverBackgroundColor: [
          '#358D35',
          '#C2C2C2',
          '#C6354D']
      }]
    };
    return ret;
  }

  termTypeChange(event, selection) {
    const { termValue } = this.state;
    this.setState(({termValue}) => (
      {
        termValue: selection.value
      }
    ));
  }

  getTermOptions() {
    const { chartType, entities, categories, concepts } = this.state;
    var options = [{ key: -1, value: 'Term', text: 'Term' }];
    var collection;

    if (chartType === utils.ENTITIY_FILTER) {
      collection = entities.results;
    } else if (chartType === utils.CATEGORY_FILTER) {
      collection = categories.results;
    } else if (chartType === utils.CONCEPT_FILTER) {
      collection = concepts.results;
    }

    if (collection) {
      collection.map(item =>
        options.push({key: item.key, value: item.key, text: item.key})
      );
    }

    return options;
  }
  
  // Important - this is needed to ensure changes to main properties
  // are propagated down to our component.
  componentWillReceiveProps(nextProps) {
    this.setState({ entities: nextProps.entities });
    this.setState({ categories: nextProps.categories });
    this.setState({ concepts: nextProps.concepts });
    this.setState({ chartType: nextProps.chartType });
    this.setState({ termValue: nextProps.termValue });
  }

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
            var total = dataset.data.reduce(function(previousValue, currentValue, currentIndex, array) {
              return previousValue + currentValue;
            });
            var currentValue = dataset.data[tooltipItem.index];
            var precentage = Math.floor(((currentValue/total) * 100)+0.5);
            return precentage + "%";
          }
        }
      }
    }

    return (
      <div>
        <Header as='h2' textAlign='left'>Sentiment</Header>
        <Menu compact>
          <Dropdown 
            item
            onChange={ this.filterTypeChange.bind(this) }
            defaultValue={ utils.ENTITIY_FILTER }
            options={ utils.filterTypes }
          />
        </Menu>
        <Menu floated='right'>
          <Dropdown 
            item
            scrolling
            defaultValue={'Term'}
            onChange={ this.termTypeChange.bind(this) }
            options={ this.getTermOptions() }
          />
        </Menu>
        <Doughnut 
          data={ this.getChartData() }
          options={ options }
          width={ 350 }
          height={ 200 }
        />       
      </div>
    );
  }
}

SentimentChart.propTypes = {
};
