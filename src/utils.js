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
const ITEMS_PER_PAGE = 5;

// query types
const QUERY_NATURAL_LANGUAGE = 0;
const QUERY_DISCO_LANGUAGE = 1;

// the index of the fillter item in the aggrgation data returned 
// from the discovery query
const ENTITY_DATA_INDEX = 0;
const CATEGORY_DATA_INDEX = 1;
const CONCEPT_DATA_INDEX = 2;
const KEYWORD_DATA_INDEX = 3;

const ENTITIY_FILTER  = 'EN';
const CATEGORY_FILTER = 'CA';
const CONCEPT_FILTER  = 'CO';
const KEYWORD_FILTER  = 'KW';

const TERM_ITEM = 'Term';   // used to indicate no specific item is seleced

// filter types and strings to use
const filterTypes = [ 
  { key: ENTITIY_FILTER,  value: ENTITIY_FILTER, text: 'Entities'}, 
  { key: CATEGORY_FILTER, value: CATEGORY_FILTER, text: 'Categories'},
  { key: CONCEPT_FILTER,  value: CONCEPT_FILTER, text: 'Concepts'},
  { key: KEYWORD_FILTER,  value: KEYWORD_FILTER, text: 'Keywords'} ];


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
  ENTITIY_FILTER,
  CATEGORY_FILTER,
  CONCEPT_FILTER,
  KEYWORD_FILTER,
  TERM_ITEM,
  filterTypes
};
