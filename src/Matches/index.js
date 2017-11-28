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
import moment from 'moment';
import { Icon, Container, List, Header, Image } from 'semantic-ui-react';
const util = require('util');

const Match = props => (
  <List.Item>
    <List.Content floated='right'>
      {props.score}
    </List.Content>
    <Image avatar src={props.html} />
    <List.Content>
      <List.Header>{props.title}</List.Header>
      Description text goes here
      </List.Content>
  </List.Item>
);


Match.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  html: PropTypes.string.isRequired,
  sentiment: PropTypes.node,
  score: PropTypes.number.isRequired
};

const Matches = props => (
  <div>
    <Header as='h2' textAlign='left'>Search Results</Header>
    <Container textAlign='left'>
      <div className="matches--list">
        <List divided verticalAlign='middle'>
          {props.matches.map(item =>
            <Match
              key={item.id}
              title={item.text ? getTitle(item) : 'No Title'}
              text={item.text ? item.text : "No Description"}
              html={getImageUrl(item)}
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

const getTitle = item => {
  var str = item.text;
  var title = str.split(':')[1];
  title = title.replace(' Category', '');
  return title;
};

const getImageUrl = item => {
  var htmlStr = item.html;
  var imgTag = '<a class="jqzoom" href="';
  var startIdx = htmlStr.indexOf(imgTag);
  startIdx = startIdx + imgTag.length;
  var endIdx = htmlStr.indexOf('"', startIdx);
  var img = htmlStr.substring(startIdx,endIdx);
  return img;
};

const getSentiment = item => {
  // console.log('item.enriched_text.sentiment: ' + item.enriched_text.sentiment);
  // console.log('item.enriched_text.sentiment.document: ' + util.inspect(item.enriched_text.sentiment.document, false, null));
  // console.log('item.enriched_text.sentiment.document.label: ' + util.inspect(item.enriched_text.sentiment.document.label, false, null));
  switch (item.enriched_text.sentiment && item.enriched_text.sentiment.document && item.enriched_text.sentiment.document.label) {
  // case 'negative': return <Icon type="thumbs-down" size="small" />;
  // case 'positive': return <Icon type="thumbs-up" size="small" />;
  case 'negative': return <Icon name='dislike outline' size='small' inverted />;
  case 'positive': return <Icon name='like outline' inverted />;
  default: return '';
  }
};

module.exports = Matches;
