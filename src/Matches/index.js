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
import { Icon, Card, Container, List, Header, Image } from 'semantic-ui-react';

const Match = props => (
  <Card centered={true} fluid={true}>
    <Image src={props.html} size='small' centered={true}/>
    <Card.Content header={props.title} />
    <Card.Content description={props.text}/>
    <Card.Content meta={props.score}/>
  </Card>
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
    <Header as='h2' textAlign='center'>Matches</Header>
    <Container textAlign='center'>
      <div className="matches--list">
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
  switch (item.enriched_text.sentiment && item.enriched_text.sentiment.document && item.enriched_text.sentiment.document.label) {
  // case 'negative': return <Icon type="thumbs-down" size="small" />;
  // case 'positive': return <Icon type="thumbs-up" size="small" />;
  case 'negative': return <Icon name='dislike outline' size='small' inverted />;
  case 'positive': return <Icon name='like outline' inverted />;
  default: return '';
  }
};

module.exports = Matches;
