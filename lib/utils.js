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

// needed to find tags in results text
const parse5 = require('parse5');

// how many items will we show per page
const ITEMS_PER_PAGE = 7;

// query types
const QUERY_NATURAL_LANGUAGE = 0;
const QUERY_DISCO_LANGUAGE = 1;

// the index of the fillter item in the aggrgation data returned 
// from the discovery query
const ENTITY_DATA_INDEX      = 0;
const CATEGORY_DATA_INDEX    = 1;
const CONCEPT_DATA_INDEX     = 2;
const KEYWORD_DATA_INDEX     = 3;
const ENTITY_TYPE_DATA_INDEX = 4;

// keys/values for menu items
const ENTITY_FILTER      = 'EN';
const CATEGORY_FILTER    = 'CA';
const CONCEPT_FILTER     = 'CO';
const KEYWORD_FILTER     = 'KW';
const ENTITY_TYPE_FILTER = 'ET';

const SENTIMENT_TERM_ITEM = 'All Terms';   // used to indicate no specific item is seleced
const TRENDING_TERM_ITEM = 'Select Term';  // used to indicate no specific item is seleced

// filter types and strings to use
const filterTypes = [
  { key: ENTITY_FILTER,       value: ENTITY_FILTER,      text: 'Entities'},
  { key: CATEGORY_FILTER,     value: CATEGORY_FILTER,    text: 'Categories'},
  { key: CONCEPT_FILTER,      value: CONCEPT_FILTER,     text: 'Concepts'},
  { key: KEYWORD_FILTER,      value: KEYWORD_FILTER,     text: 'Keywords'},
  { key: ENTITY_TYPE_FILTER,  value: ENTITY_TYPE_FILTER, text: 'Entity Types'} ];
  
// sortBy is used as param to Discovery Service
// sortByInt is used to sort internally based on formatted data
const sortKeys = [
  { type: 'HIGHEST', 
    sortBy: '-result_metadata.score', 
    sortByInt: '-score',
    text: 'Highest Score' },
  { type: 'LOWEST', 
    sortBy: 'result_metadata.score', 
    sortByInt: 'score',
    text:  'Lowest Score' },
  { type: 'NEWEST', 
    sortBy: '-date', 
    sortByInt: '-date',
    text: 'Newest First' },
  { type: 'OLDEST', 
    sortBy: 'date', 
    sortByInt: 'date',
    text: 'Oldest First' },
  { type: 'BEST', 
    sortBy: '-enriched_text.sentiment.document.score', 
    sortByInt: '-sentimentScore',
    text: 'Highest Rated' },
  { type: 'WORST', 
    sortBy: 'enriched_text.sentiment.document.score', 
    sortByInt: 'sentimentScore',
    text: 'Lowest Rated' }
];

// sort types and strings to use for drop-down
const sortTypes = [];
sortKeys.forEach(function(item) {
  sortTypes.push({key: item.type, value: item.sortBy, text: item.text});
});  

/**
 * objectWithoutProperties - clear out unneded properties from object.
 * object: object to scan
 * properties: items in object to remove
 */
const objectWithoutProperties = (object, properties) => {
  'use strict';

  var obj = {};
  var keys = Object.keys(object);
  keys.forEach(key => {
    if (properties.indexOf(key) < 0) {
      // keep this since it is not found in list of unneeded properties
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
 * 1) only keeping fields we show in the UI
 * 2) highlight matching words in text
 * 3) if showing 'passages', ignore all other results
 */
function formatData(data, passages) {
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
      highlight: {
        showHighlight: false,
        field: '',                // title or text
        passageScore: '0',
        indexes: new Array()      // hold all start and end indexes of highlight text
      }
    };

    var addResult = true;
    if (passages.results) {
      // see if this 'result' has a cooresponding 'passage' entry
      // if so, save the details on how to highlight the 'passage'
      // if not, ignore the 'result'
      addResult = false;
      for (var i=0; i<passages.results.length; i++) {
        var res = passages.results[i];
        if (res.document_id === dataItem.id) {
          newResult.highlight.showHighlight = true;
          newResult.highlight.indexes.push({
            startIdx: res.start_offset,
            endIdx: res.end_offset
          });
          newResult.highlight.field = res.field;
          newResult.highlight.passageScore = res.passage_score;
          addResult = true;
          break;
        }
      }
    } else {
      // check if we have any 'highlights' returned by discovery
      if (dataItem.highlight && dataItem.highlight.text) {
        // start by getting highlight word(s) by parsing HTML.
        // keyword will be within <em> tag.
        const fragment = parse5.parseFragment('<!DOCTYPE html><html>' + 
          dataItem.highlight.text + 
          '</html>');
        if (fragment.childNodes[1].childNodes[0].value) {
          var highlightStr = fragment.childNodes[1].childNodes[0].value;
          // now find that string in real 'text' field
          var startIdx = dataItem.text.indexOf(highlightStr);
          if (startIdx >= 0) {
            newResult.highlight.showHighlight = true;
            newResult.highlight.field = 'text';
            newResult.highlight.indexes.push({
              startIdx: startIdx,
              endIdx: startIdx + highlightStr.length
            });
          }
        }
      }

      // check if we have any entity 'mentions' returned by discovery
      dataItem.enriched_text.entities.forEach(function(entity) {
        if (typeof entity.mentions !== 'undefined' && entity.mentions.length > 0) {
          entity.mentions.forEach(function(mention) {
            newResult.highlight.showHighlight = true;
            newResult.highlight.field = 'text';
            var insertIdx = getArrayIndex(newResult.highlight.indexes,
              mention.location[0],
              mention.location[1]);
            if (insertIdx >= 0) {
              newResult.highlight.indexes.splice(
                insertIdx, 0, { startIdx: mention.location[0], endIdx: mention.location[1] });
            }
          });
        }
      });
    }

    if (addResult) {
      newResults.push(newResult);
    }
  });

  formattedData.results = newResults;
  // console.log('Formatting Data: size = ' + newResults.length);
  return formattedData;
}

/**
 * getArrayIndex - determine where to add the new index pair into the index array.
 * Index pairs must be in numeric order, from low to high.
 */
function getArrayIndex(indexArray, startIdx) {
  // add in correct order, and no duplicates
  var insertIdx = 0;
  for (var i=0; i<indexArray.length; i++) {
    if (startIdx == indexArray[i].startIdx) {
      // found duplicate
      return - 1;
    } else if (startIdx < indexArray[i].startIdx) {
      // found our index
      return i;
    }
    // insert at end
    insertIdx = insertIdx + 1;
  }
  return insertIdx;
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
  ENTITY_TYPE_DATA_INDEX,
  ENTITY_FILTER,
  CATEGORY_FILTER,
  CONCEPT_FILTER,
  KEYWORD_FILTER,
  ENTITY_TYPE_FILTER,
  SENTIMENT_TERM_ITEM,
  TRENDING_TERM_ITEM,
  sortKeys,
  filterTypes,
  sortTypes
};
