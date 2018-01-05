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

// Variables and functions needed by both server and client code

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
  
/**
 * parseData - convert raw search results into collection of matching results.
 */
const parseData = data => ({
  rawResponse: Object.assign({}, data),
  // sentiment: data.aggregations[0].results.reduce((accumulator, result) =>
  //   Object.assign(accumulator, { [result.key]: result.matching_results }), {}),
  results: data.results
});

/**
 * formatData - format search results into items we can process easier. This includes
 * only keeping fields we show in the UI, and sorting passages to the top, if specified.
 */
function formatData(data, passages, sortByPassageScore) {
  var formattedData = {};
  var newResults = [];

  data.results.forEach(function(dataItem) {
    // only keep the data we show
    var newResult = {
      id: dataItem.id,
      title: dataItem.title,
      text: dataItem.text,
      date: dataItem.date,
      score: dataItem.result_metadata.score,
      sentimentScore: dataItem.enriched_text.sentiment.document.score,
      sentimentLabel: dataItem.enriched_text.sentiment.document.label,
      hasPassage: false,
      passageField: '',
      passageScore: '0'
    };

    if (passages.results) {
      for (var i=0; i<passages.results.length; i++) {
        var res = passages.results[i];
        // if (i == 1) console.log('compate passage id: ' + res.document_id + ' to: ' + dataItem.id);
        if (res.document_id === dataItem.id) {
          // console.log('FOUND Passage: ' + res.document_id);
          newResult.hasPassage = true;
          newResult.passageStart = res.start_offset;
          newResult.passageEnd = res.end_offset;
          newResult.passageField = res.field;
          newResult.passageScore = res.passage_score;
          // console.log("RESULT: ");
          // const util = require('util');
          // console.log(util.inspect(newResult, false, null));
          break;
        }
      }
    }

    newResults.push(newResult);
  });

  if (sortByPassageScore) {
    var sortBy = require('sort-by');
    newResults.sort(sortBy('-passageScore'));
  }

  formattedData.results = newResults;
  return formattedData;
}

/**
 * getTotals - add up sentiment types from all result items.
 */
function getTotals(data) {
  var totals = {
    numPositive: 0,
    numNegative: 0,
    numNeutral: 0
  };

  data.results.forEach(function (result) {
    if (result.sentimentLabel === 'positive') {
      totals.numPositive = totals.numPositive + 1;
    } else if (result.sentimentLabel === 'negative') {
      totals.numNegative = totals.numNegative + 1;
    } else if (result.sentimentLabel === 'neutral') {
      totals.numNeutral = totals.numNeutral + 1;
    }
  });

  // console.log('numMatches: ' + data.matching_results);
  // console.log('numPositive: ' + totals.numPositive);
  // console.log('numNegative: ' + totals.numNegative);
  // console.log('numNeutral: ' + totals.numNeutral);

  return totals;
}

module.exports = {
  objectWithoutProperties,
  parseData,
  formatData,
  getTotals,
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
