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
      <List.Header>
        <List.Description>
          <span dangerouslySetInnerHTML={{__html: props.title}}></span>
        </List.Description>
      </List.Header>
    </List.Content>
    <List.Content>
      <List.Description>
        <span dangerouslySetInnerHTML={{__html: props.text}}></span>
      </List.Description>
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
              title={ getTitle(item) }
              text={ getText(item) }
              highlightText={ item.highlightText }
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

// format title into 3 parts, so that we can set background color for passages
const getTitle = (item) => {
  if (item.highlight.showHighlight && item.highlight.field === 'title') {
    var str = '<style>hilite {background:#ffffb3;}</style>';
    item.highlight.indexes.forEach(function(element) {
      str = str + item.title.substring(0, element.startIdx) +
        '<hilite>' +
        item.title.substring(element.startIdx, element.endIdx) +
        '</hilite>' +
        item.title.substring(element.endIdx);
    });
    return str;
  } else {
    return item.title ? item.title : 'No Title';
  }
};

// format text into 3 parts, so that we can set background color for passages
// and highlighted words
const getText = (item) => {
  if (item.highlight.showHighlight && item.highlight.field === 'text') {
    var str = '<style>hilite {background:#ffffb3;}</style>';
    var currIdx = 0;
    item.highlight.indexes.forEach(function(element) {
      str = str + item.text.substring(currIdx, element.startIdx) +
        '<hilite>' +
        item.text.substring(element.startIdx, element.endIdx) +
        '</hilite>';
      currIdx = element.endIdx;
    });
    str = str + item.text.substring(currIdx);
    return str;
  } else {
    return item.text ? item.text : 'No Description';
  }
};

/**
 * getScore - round up to 4 decimal places.
 */
const getScore = item => {
  var score = 0.0;

  if (item.score) {
    score = (item.score).toFixed(4);
  }
  return score;
};

/**
 * getSentiment - determine which icon to display to represent
 * positive, negative, and neutral sentiment.
 */
const getSentiment = item => {
  var score = Number(item.sentimentScore).toFixed(2);
  var color = 'grey';
  switch (item.sentimentLabel) {
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
