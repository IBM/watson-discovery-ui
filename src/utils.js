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

// const parseData = data => ({
//   topics: data.aggregations[0].results,
//   rawData: data
// });

const objectWithoutProperties = (object, properties) => {
  'use strict';

  var obj = {};
  var keys = Object.keys(object);
  keys.forEach(key => {
    if (!~properties.indexOf(key)) {
      obj[key] = object[key];
    }
  });
  return obj;
};

// how many items will we show per page
const ITEMS_PER_PAGE = 7;

// query types
const QUERY_NATURAL_LANGUAGE = 0;
const QUERY_DISCO_LANGUAGE = 1;

// the index of the fillter item in the aggrgation data returned 
// from the discovery query
const ENTITY_DATA_INDEX = 0;
const CATEGORY_DATA_INDEX = 1;
const CONCEPT_DATA_INDEX = 2;
const KEYWORD_DATA_INDEX = 3;

// keys/values for menu items
const ENTITY_FILTER   = 'EN';
const CATEGORY_FILTER = 'CA';
const CONCEPT_FILTER  = 'CO';
const KEYWORD_FILTER  = 'KW';

const SENTIMENT_TERM_ITEM = 'All Terms';   // used to indicate no specific item is seleced
const TRENDING_TERM_ITEM = 'Select Term';  // used to indicate no specific item is seleced

const BY_HIGHEST = 'HIGHEST';
const BY_LOWEST  = 'LOWEST';
const BY_OLDEST  = 'OLDEST';
const BY_NEWEST  = 'NEWEST';
const BY_BEST    = 'BEST';
const BY_WORST   = 'WORST';

const BY_HIGHEST_QUERY = '-result_metadata.score';
const BY_LOWEST_QUERY  = 'result_metadata.score';
const BY_OLDEST_QUERY  = 'date';
const BY_NEWEST_QUERY  = '-date';
const BY_BEST_QUERY    = '-enriched_text.sentiment.document.score';
const BY_WORST_QUERY   = 'enriched_text.sentiment.document.score';

// filter types and strings to use
const filterTypes = [
  { key: ENTITY_FILTER,   value: ENTITY_FILTER,   text: 'Entities'},
  { key: CATEGORY_FILTER, value: CATEGORY_FILTER, text: 'Categories'},
  { key: CONCEPT_FILTER,  value: CONCEPT_FILTER,  text: 'Concepts'},
  { key: KEYWORD_FILTER,  value: KEYWORD_FILTER,  text: 'Keywords'} ];

// sort types and strings to use
const sortTypes = [
  { key: BY_HIGHEST, value: BY_HIGHEST_QUERY, text: 'Highest Score'},
  { key: BY_LOWEST,  value: BY_LOWEST_QUERY,  text: 'Lowest Score'},
  { key: BY_NEWEST,  value: BY_NEWEST_QUERY,  text: 'Newest First'},
  { key: BY_OLDEST,  value: BY_OLDEST_QUERY,  text: 'Oldest First'},
  { key: BY_BEST,    value: BY_BEST_QUERY,    text: 'Highest Rated'},
  { key: BY_WORST,   value: BY_WORST_QUERY,   text: 'Lowest Rated'} ];

module.exports = {
  // parseData,
  objectWithoutProperties,
  ITEMS_PER_PAGE,
  QUERY_NATURAL_LANGUAGE,
  QUERY_DISCO_LANGUAGE,
  ENTITY_DATA_INDEX,
  CATEGORY_DATA_INDEX,
  CONCEPT_DATA_INDEX,
  KEYWORD_DATA_INDEX,
  ENTITY_FILTER,
  CATEGORY_FILTER,
  CONCEPT_FILTER,
  KEYWORD_FILTER,
  SENTIMENT_TERM_ITEM,
  TRENDING_TERM_ITEM,
  BY_HIGHEST,
  BY_LOWEST,
  BY_OLDEST,
  BY_NEWEST,
  BY_BEST,
  BY_WORST,
  BY_HIGHEST_QUERY,
  BY_LOWEST_QUERY,
  BY_OLDEST_QUERY,
  BY_NEWEST_QUERY,
  BY_BEST_QUERY,
  BY_WORST_QUERY,
  filterTypes,
  sortTypes
};
