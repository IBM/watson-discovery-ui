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
          { props.title1 }
          <span style={{backgroundColor:'#ffffb3'}}>{ props.title2 }</span>
          { props.title3 }
        </List.Description>
      </List.Header>
    </List.Content>
    <List.Content>
      <List.Description>
        { props.text1 }
        <span style={{backgroundColor:'#ffffb3'}}>{ props.text2 }</span>
        { props.text3 }
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
  title1: PropTypes.string.isRequired,
  title2: PropTypes.string.isRequired,
  title3: PropTypes.string.isRequired,
  text1: PropTypes.string.isRequired,
  text2: PropTypes.string.isRequired,
  text3: PropTypes.string.isRequired,
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
              title1={ getTitle(item, 1) }
              title2={ getTitle(item, 2) }
              title3={ getTitle(item, 3) }
              text1={ getText(item, 1) }
              text2={ getText(item, 2) }
              text3={ getText(item, 3) }
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
const getTitle = (item, step) => {
  var usePassage = item.hasPassage && item.passageField === 'title';
  if (step === 1) {
    if (usePassage) {
      return item.title.substring(0,item.passageStart);
    } else {
      return item.title ? item.title : 'No Title';
    }
  } else if (step === 2) {
    if (usePassage) {
      return item.title.substring(item.passageStart, item.passageEnd);
    } else {
      return '';
    }
  } else {
    if (usePassage) {
      return item.title.substring(item.passageEnd);
    } else {
      return '';
    }
  }
};

// format text into 3 parts, so that we can set background color for passages
const getText = (item, step) => {
  var usePassage = item.hasPassage && item.passageField === 'text';
  if (step === 1) {
    if (usePassage) {
      return item.text.substring(0,item.passageStart);
    } else {
      return item.text ? item.text : 'No Description';
    }
  } else if (step === 2) {
    if (usePassage) {
      return item.text.substring(item.passageStart, item.passageEnd);
    } else {
      return '';
    }
  } else {
    if (usePassage) {
      return item.text.substring(item.passageEnd);
    } else {
      return '';
    }
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
