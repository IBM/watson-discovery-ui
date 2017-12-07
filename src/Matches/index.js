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
import { Icon, Container, List } from 'semantic-ui-react';

const Match = props => (
  <List.Item>
    <List.Content floated='right'>
      {props.score}
    </List.Content>
    <List.Content>
      <List.Header>{props.title}</List.Header>
      {props.text}
    </List.Content>
    <List.Content>
      Sentiment: {props.sentiment}
    </List.Content>
  </List.Item>
);


Match.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  sentiment: PropTypes.node,
  score: PropTypes.number.isRequired
};

const Matches = props => (
  <div>
    <Container textAlign='left'>
      <div className="matches--list">
        <List divided verticalAlign='middle'>
          {props.matches.map(item =>
            <Match
              key={item.id}
              title={item.title ? item.title : 'No Title'}
              text={item.text ? item.text : 'No Description'}
              score={item.score}
              sentiment={getSentiment(item)}
            />)
          }
        </List>
      </div>
    </Container>
  </div>
);

Matches.propTypes = {
  matches: PropTypes.arrayOf(PropTypes.object).isRequired
};

const getSentiment = item => {
  // console.log('item.enriched_text.sentiment: ' + item.enriched_text.sentiment);
  // console.log('item.enriched_text.sentiment.document: ' + util.inspect(item.enriched_text.sentiment.document, false, null));
  // console.log('item.enriched_text.sentiment.document.label: ' + util.inspect(item.enriched_text.sentiment.document.label, false, null));
  switch (item.enriched_text.sentiment && item.enriched_text.sentiment.document && item.enriched_text.sentiment.document.label) {
  case 'negative': return <Icon name='thumbs down' size='large' color='red'/>;
  case 'positive': return <Icon name='thumbs up' size='large' color='green'/>;
  default: return <Icon name='like outline' size='large' color='yellow'/>;
  }
};

module.exports = Matches;
