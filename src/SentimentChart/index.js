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
import { Header, Menu, Dropdown } from 'semantic-ui-react';
import { PieChart, Pie, Legend, Tooltip } from 'recharts';
const utils = require('../utils');
const util = require('util');

export default class SentimentChart extends React.Component {
  constructor(...props) {
    super(...props);

    this.state = {
      entities: this.props.entities,
      categories: this.props.categories,
      concepts: this.props.concepts,
      chartType: utils.ENTITIY_FILTER
    };

    this.totals = {
      positive: 0,
      neutral: 0,
      negative: 0,
      matches: 0
    };
  }

  filterTypeChange(event, selection) {
    console.log('selection.value: ' + selection.value);
    const { chartType } = this.state;
    this.setState(({chartType}) => (
      {
        chartType: selection.value
      }
    ));
  }

  getPercent(portion) {
    if (portion === 0)
      return 0;

    var val = Math.round((portion / this.totals.matches) * 100);
    console.log('val: ' + val);
    return val;
  }

  getTotals(collection) {
    this.totals.matches = 0;
    this.totals.positive = -2;
    this.totals.neutral = 1;
    this.totals.negative = 1;

    for (var item of collection.results) {
      console.log('    item.matching_results: ' + item.matching_results);
      this.totals.matches = this.totals.matches + item.matching_results;
      for (var sentiment of item.aggregations[0].results) {
        console.log('        sentiment.key: ' + sentiment.key);
        if (sentiment.key === 'positive') {
          console.log('            sentiment.positive: ' + sentiment.matching_results);
          this.totals.positive = this.totals.positive + sentiment.matching_results;
        } else if (sentiment.key === 'neutral') {
          console.log('            sentiment.neutral: ' + sentiment.matching_results);
          this.totals.neutral = this.totals.neutral + sentiment.matching_results;
        } else if (sentiment.key === 'negative') {
          console.log('            sentiment.negative: ' + sentiment.matching_results);
          this.totals.negative = this.totals.negative + sentiment.matching_results;
        }
      }
    }
  }

  getChartData() {
    const { chartType, entities, categories, concepts } = this.state;
    
    console.log("chartType: " + chartType);
    if (chartType == 'EN') {
      console.log("entities:");
      this.getTotals(entities);
    } else if (chartType == 'CA') {
      this.getTotals(categories);
    } else if (chartType == 'CO') {
      this.getTotals(concepts);
    }

    console.log('    totalMatches: ' + this.totals.matches);
    console.log('    totalPositive: ' + this.totals.positive);
    console.log('    totalNeutral: ' + this.totals.neutral);
    console.log('    totalNegative: ' + this.totals.negative);
    
    var ret = [
      { name: 'Positive', value: this.getPercent(this.totals.positive), fill: '#2e613f' },
      { name: 'Neutral', value: this.getPercent(this.totals.neutral), fill: '#a9a9a9' },
      { name: 'Negative', value: this.getPercent(this.totals.negative), fill: '#c92742' }
    ];
    return ret;
  }
  
  render() {
    const margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
      console.log('percent: ' + percent + ' index:' + index);
      var str = ((percent * 100) + '%');
      if (index == 0) {
        str = str + ' Positive';
      } else if (index == 1) {
        str = str + '\nNeutral';        
      } else {
        str = str + ' Negative';        
      }
      return str;
    };

    return (
      <div>
        <Header as='h2' textAlign='left'>Sentiment</Header>
        <Menu compact floated='right'>
          <Dropdown 
            simple
            item
            onChange={ this.filterTypeChange.bind(this) }
            defaultValue={ utils.ENTITIY_FILTER }
            options={ utils.filterTypes }
          />
        </Menu>
        <PieChart width={400} height={250} margin={margin}>
          <Pie 
            data={this.getChartData()}
            dataKey='value'
            nameKey='name'
            innerRadius={60} 
            outerRadius={80}
            label={renderCustomizedLabel}
          />
          <Tooltip/>
        </PieChart>
      </div>
    );
  }
}

SentimentChart.propTypes = {
};
