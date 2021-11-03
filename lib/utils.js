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

// the index of the filter item in the aggregation data returned 
// from the discovery query
const ENTITY_DATA_INDEX      = 0;
const KEYWORD_DATA_INDEX     = 1;
const ENTITY_TYPE_DATA_INDEX = 2;

// keys/values for menu items
const ENTITY_FILTER      = 'EN';
const KEYWORD_FILTER     = 'KW';
const ENTITY_TYPE_FILTER = 'ET';

const SENTIMENT_TERM_ITEM = 'All Terms';   // used to indicate no specific item is seleced
const TRENDING_TERM_ITEM = 'Select Term';  // used to indicate no specific item is seleced

// filter types and strings to use
const filterTypes = [
  { key: ENTITY_FILTER,       value: ENTITY_FILTER,      text: 'Entities'},
  { key: KEYWORD_FILTER,      value: KEYWORD_FILTER,     text: 'Keywords'},
  { key: ENTITY_TYPE_FILTER,  value: ENTITY_TYPE_FILTER, text: 'Entity Types'} ];
  
// sortBy is used as param to Discovery Service
// sortByInt is used to sort internally based on formatted data
const sortKeys = [
  { type: 'HIGHEST', 
    sortBy: '-enriched_text.sentiment.score', 
    sortByInt: '-sentimentScore',
    text: 'Highest Score' },
  { type: 'LOWEST', 
    sortBy: 'enriched_text.sentiment.score', 
    sortByInt: 'sentimentScore',
    text:  'Lowest Score' },
  { type: 'NEWEST', 
    sortBy: '-date', 
    sortByInt: '-date',
    text: 'Newest First' },
  { type: 'OLDEST', 
    sortBy: 'date', 
    sortByInt: 'date',
    text: 'Oldest First' },
];

// sort types and strings to use for drop-down
const sortTypes = [];
sortKeys.forEach(function(item) {
  sortTypes.push({key: item.type, value: item.sortBy, text: item.text});
});  

/**
 * objectWithoutProperties - clear out unneeded properties from object.
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
  // sessionToken: data.result.session_token,
  results: data.result.results
});

/**
 * formatData - format search results into items we can process easier. This includes
 * 1) only keeping fields we show in the UI
 * 2) highlight matching words in text
 * 3) if showing 'passages' (returnPassages is true), ignore all other results
 */
function formatData(rawData, returnPassages, filterString) {
  let formattedData = {};
  let newResults = [];
  let data = rawData.rawResponse.result;

  for (let index=0; index<data.results.length; index++) {
    // only keep the data we show in the UI.
    let dataItem = data.results[index];
    // console.log('dataItem: ' + JSON.stringify(dataItem, null, 2));

    let enrichedText = dataItem.enriched_text[0];
    // insure this item is valid
    if (!enrichedText ||
        !enrichedText.sentiment) {
      console.log('Found bad result - no enrichments found: ');
      console.log('     dataItem.title: ' + dataItem.title);
      console.log('     dataItem.id: ' + dataItem.document_id);
      break;
    }

    // console.log('text: ' + dataItem.text[0]);
    // console.log('text.length: ' + dataItem.text[0].length);

    // for the text field, only show first part and make user request the rest by
    // clicking the "show more" button.
    var initialTextLen = (dataItem.text[0].length > 200)? 200 : Math.ceil(dataItem.text[0].length / 2);
    // make sure we end between words
    initialTextLen = dataItem.text[0].lastIndexOf(' ', initialTextLen);

    var newResult = {
      id: dataItem.document_id,
      //sessionToken: data.sessionToken,
      title: dataItem.title,
      text: dataItem.text[0],
      textBlurb: dataItem.text[0].substr(0, initialTextLen),
      textFull: dataItem.text[0],
      date: dataItem.date,
      sentimentScore: enrichedText.sentiment.score,
      sentimentLabel: enrichedText.sentiment.label,
      highlight: {
        showHighlight: false,
        textIndexes: new Array(),   // hold all start and end indexes of highlighted text in review
        titleIndexes: new Array()   // hold all start and end indexes of highlighted text in title
      }
    };

    var addResult = true;

    // NOTE: only do passages or 'highlights', not both
    if (returnPassages) {
      var passages = dataItem.document_passages;
      // see if this 'result' has a corresponding 'passage' entry
      // if so, save the details on how to highlight the 'passage'
      // if not, ignore the 'result'
      addResult = false;
      for (var i=0; i<passages.length; i++) {
        var res = passages[i];
        console.log('PASSAGE: ' + JSON.stringify(res, null, 2));
        if (res.document_id === dataItem.id) {
          newResult.highlight.showHighlight = true;
          // passage text can be in either the 'text' or 'title' fields
          if (res.field === 'text') {
            newResult.highlight.textIndexes.push({
              startIdx: res.start_offset,
              endIdx: res.end_offset
            });
          } else {
            newResult.highlight.titleIndexes.push({
              startIdx: res.start_offset,
              endIdx: res.end_offset
            });
          }
          addResult = true;
          break;
        }
      }
    } else {
      // check if we have any 'highlights' returned by discovery
      if (dataItem.highlight) {
        if (dataItem.highlight.text) {
          // text highlights
          processHighLights(dataItem.highlight.text, dataItem.text, newResult, 'text');
        }
        if (dataItem.highlight.title) {
          // title highlights
          processHighLights(dataItem.highlight.title, dataItem.title, newResult, 'title');
        }
      }

      // check if we have any entity 'mentions' returned by discovery.
      // There can be 2 types of matches:
      // 1 - user selected an 'entity' filter string, and that string appears in
      //     this data item. Ex: filter on 'Bob', and 'Bob' is in text.
      // 2 - user selected an 'entity.type' filter string, and a match of that type
      //     appears in the data item. Ex: filter on type 'Sport' and 'golf' is found.
      if (typeof filterString !== 'undefined' && filterString.length > 1) {
        // we only care if we have a match on our filter values
        console.log('filterString: ' + filterString);
        dataItem.enriched_text[0].entities.forEach(function(entity) {
          if (typeof entity.mentions !== 'undefined' && entity.mentions.length > 0) {
            entity.mentions.forEach(function(mention) {
              // get the text that will be highlighted and put it in the
              // same format as the filters passed in the query
              // string sent to discovery
              var highlightText = 'enriched_text.entities.text::"' +
                dataItem.text[0].substr(mention.location.begin, mention.location.end - mention.location.begin) + '"';
              // check if we have a direct match to our entity filter
              // or if we have a direct match to our entity.type filter
              if ((filterString.indexOf(highlightText) >= 0) ||
                  (filterString.indexOf(entity.type) >= 0)) {
                newResult.highlight.showHighlight = true;
                var insertIdx = getArrayIndex(newResult.highlight.textIndexes,
                  mention.location.begin);
                if (insertIdx >= 0) {
                  newResult.highlight.textIndexes.splice(
                    insertIdx, 0, { startIdx: mention.location.begin, endIdx: mention.location.end });
                }
              }
            });
          }
        });
      }
    }

    if (addResult) {
      newResults.push(newResult);
    }
  }

  formattedData.results = newResults;
  // console.log('Formatting Data: size = ' + newResults.length);
  return formattedData;
}

/**
 * processHighLights - cycle through the highlights defined by discovery.
 * Highlights can be for either the review text or for the review title.
 */
function processHighLights(highlights, searchStr, newResult, type) {
  highlights.forEach(function(textStr) {
    // textStr is a blurb returned by Discovery that includes the
    // highlighted word(s).

    // first, find length of the specific highlight word(s)
    var startIdx = textStr.indexOf('<em>') + '<em>'.length;
    var endIdx = textStr.indexOf('</em>', startIdx);
    var highlightLen = endIdx - startIdx;
    var highlightStr = textStr.slice(startIdx, endIdx);

    // find the textStr in real 'text' field (either review or title)
    // first remove <em> markers so we can find exact string
    var str = textStr.replace(/<em>/g, '').replace(/<\/em>/g, '');
    startIdx = searchStr.indexOf(str);
    startIdx = searchStr.indexOf(highlightStr, startIdx);
    if (startIdx >= 0) {
      // found it
      newResult.highlight.showHighlight = true;
      if (type === 'text') {
        newResult.highlight.textIndexes.push({
          startIdx: startIdx,
          endIdx: startIdx + highlightLen
        });
      } else {
        newResult.highlight.titleIndexes.push({
          startIdx: startIdx,
          endIdx: startIdx + highlightLen
        });
      }
    }
  });

  // sort by start index
  if (type === 'text') {
    newResult.highlight.textIndexes.sort(function (a, b) {
      return a.startIdx - b.startIdx;
    });
  } else {
    newResult.highlight.titleIndexes.sort(function (a, b) {
      return a.startIdx - b.startIdx;
    });
  }
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
  KEYWORD_DATA_INDEX,
  ENTITY_TYPE_DATA_INDEX,
  ENTITY_FILTER,
  KEYWORD_FILTER,
  ENTITY_TYPE_FILTER,
  SENTIMENT_TERM_ITEM,
  TRENDING_TERM_ITEM,
  sortKeys,
  filterTypes,
  sortTypes
};
