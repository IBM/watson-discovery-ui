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
import { Header } from 'semantic-ui-react';
import { PieChart, Pie, Legend, Tooltip } from 'recharts';
const utils = require('../utils');

export default class SentimentChart extends React.Component {
  constructor(...props) {
    super(...props);

    this.state = {
      entities: this.props.entities,
      categories: this.props.categories,
      concepts: this.props.concepts,
    };
  }

  customLabel(e, f) {
    console.log('f: ' + f);
    return "50%";
  }
  render() {

    const chartData = [
      { name: 'Positive', value: 60, fill: '#2e613f' },
      { name: 'Neutral', value: 30, fill: '#ded11e' },
      { name: 'Negative', value: 10, fill: '#c92742' }
    ];

    const margin = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
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
        <Header as='h2' textAlign='center'>Sentiment Chart</Header>
        <PieChart width={300} height={400} margin={margin}>
          <Pie 
            data={chartData}
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
