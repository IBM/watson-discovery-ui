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
import { Container, List, Label } from 'semantic-ui-react';

/**
 * This object renders the results of the search query on the web page. 
 * Each result item, or 'match', will display a title, description, and
 * sentiment value.
 */

const Match = props => (
  <List.Item>
    <List.Content>
      <List.Header>{props.title}</List.Header>
      { props.text }
    </List.Content>
    <List.Content>
      Score: { props.score }
    </List.Content>
    <List.Content>
      Date: { props.date }
    </List.Content>
    <List.Content>
      Sentiment: { props.sentiment }
    </List.Content>
  </List.Item>
);

// type check to ensure we are called correctly
Match.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  score: PropTypes.string.isRequired,
  sentiment: PropTypes.object.isRequired
};

const Matches = props => (
  <div>
    <Container textAlign='left'>
      <div className="matches--list">
        <List divided verticalAlign='middle'>
          {props.matches.map(item =>
            <Match
              key={ item.id }
              title={ item.title ? item.title : 'No Title' }
              text={ item.text ? item.text : 'No Description' }
              score={ getScore(item) }
              date={ item.date }
              sentiment={ getSentiment(item) }
            />)
          }
        </List>
      </div>
    </Container>
  </div>
);

// type check to ensure we are called correctly
Matches.propTypes = {
  matches: PropTypes.arrayOf(PropTypes.object).isRequired
};

/**
 * getScore - round up to 4 decimal places.
 */
const getScore = item => {
  var score = 0.0;

  if (item.result_metadata.score) {
    score = (item.result_metadata.score).toFixed(4);
  }
  return score;
};

/**
 * getSentiment - determine which icon to display to represent
 * positive, negative, and neutral sentiment.
 */
const getSentiment = item => {
  var score = Number(item.enriched_text.sentiment.document.score).toFixed(2);
  var color = 'grey';
  switch (item.enriched_text.sentiment.document.label) {
  case 'negative': 
    color='red';
    break;
  case 'positive': 
    color='green';
    break;
  }

  return <Label 
    className='sentiment-value' 
    as='a'
    color={ color }
    size='tiny' 
    tag>{ score  }</Label>;  
};

// export so we are visible to parent
module.exports = Matches;
