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
      positiveNum: 0,
      neutralNum: 0,
      negativeNum: 0,
      matches: 0,
      positivePct: 0,
      neutralPct: 0,
      negativePct: 0
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
    if (portion === 0) {
      console.log('val: 0    val2: 0');
      return 0;
    }

    var val = (portion / this.totals.matches) * 100;
    var val2 = Math.round(val);
    console.log('val: ' + val + '   val2: ' + val2);
    return val2;
  }

  adjustPercentages() {
    this.totals.positivePct = this.getPercent(this.totals.positiveNum);
    this.totals.neutralPct = this.getPercent(this.totals.neutralNum);
    this.totals.negativePct = this.getPercent(this.totals.negativeNum);

    var total = this.totals.positivePct +
                this.totals.neutralPct +
                this.totals.negativePct;
    console.log('total: ' + total);

    // make sure they equal 100
    if (total === 100) {
      return;
    } else {
      if ((this.totals.positivePct >= this.totals.neutralPct) &&
          (this.totals.positivePct >= this.totals.negativePct)) {
        if (total > 100) {
          this.totals.positivePct = this.totals.positivePct - (total - 100);
        } else {
          this.totals.positivePct = this.totals.positivePct + (100 - total);
        }
      } else if ((this.totals.neutralPct >= this.totals.positivePct) &&
                 (this.totals.neutralPct >= this.totals.negativePct)) {
        if (total > 100) {
          this.totals.neutralPct = this.totals.neutralPct - (total - 100);
        } else {
          this.totals.neutralPct = this.totals.neutralPct + (100 - total);
        }
      } else {
        if (total > 100) {
          this.totals.negativePct = this.totals.negativePct - (total - 100);
        } else {
          this.totals.negativePct = this.totals.negativePct + (100 - total);
        }
      }
    }
  }

  getTotals(collection) {
    this.totals.matches = 0;
    this.totals.positiveNum = -2;  // TEMP: cheat to get some other numbers on chart
    this.totals.neutralNum = 1;
    this.totals.negativeNum = 1;

    for (var item of collection.results) {
      // console.log('    item.matching_results: ' + item.matching_results);
      this.totals.matches = this.totals.matches + item.matching_results;
      for (var sentiment of item.aggregations[0].results) {
        // console.log('        sentiment.key: ' + sentiment.key);
        if (sentiment.key === 'positive') {
          // console.log('            sentiment.positive: ' + sentiment.matching_results);
          this.totals.positiveNum = this.totals.positiveNum + sentiment.matching_results;
        } else if (sentiment.key === 'neutral') {
          // console.log('            sentiment.neutral: ' + sentiment.matching_results);
          this.totals.neutralNum = this.totals.neutralNum + sentiment.matching_results;
        } else if (sentiment.key === 'negative') {
          // console.log('            sentiment.negative: ' + sentiment.matching_results);
          this.totals.negativeNum = this.totals.negativeNum + sentiment.matching_results;
        }
      }
    }
  }

  getChartData() {
    const { chartType, entities, categories, concepts } = this.state;
    
    console.log("chartType: " + chartType);
    if (chartType === utils.ENTITIY_FILTER) {
      console.log("entities:");
      this.getTotals(entities);
    } else if (chartType === utils.CATEGORY_FILTER) {
      this.getTotals(categories);
    } else if (chartType === utils.CONCEPT_FILTER) {
      this.getTotals(concepts);
    }

    console.log('    totalMatches: ' + this.totals.matches);
    console.log('    totalPositive: ' + this.totals.positiveNum);
    console.log('    totalNeutral: ' + this.totals.neutralNum);
    console.log('    totalNegative: ' + this.totals.negativeNum);

    this.adjustPercentages();
    console.log('    adjusted positivePct: ' + this.totals.positivePct);
    console.log('    adjusted neutralPct: ' + this.totals.neutralPct);
    console.log('    adjusted negativePct: ' + this.totals.negativePct);
    
    var ret = [
      { name: 'Positive', value: this.totals.positivePct, fill: '#2e613f' },
      { name: 'Neutral', value: this.totals.neutralPct, fill: '#a9a9a9' },
      { name: 'Negative', value: this.totals.negativePct, fill: '#c92742' }
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
        str = str + ' Neutral';
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
