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

require('isomorphic-fetch');
const queryString = require('query-string');
const queryBuilder = require('./query-builder');
const queryTrendBuilder = require('./query-builder-trending');
const discovery = require('./watson-discovery-service');

/**
 * Back end server which handles initializing the Watson Discovery
 * service, and setting up route methods to handle client requests.
 */

/*eslint no-unused-vars: ["error", {"argsIgnorePattern": "response"}]*/
const WatsonDiscoServer = new Promise((resolve, reject) => {
  // getInvironments as sanity check to ensure creds are valid
  discovery.getEnvironments({})
    .then(response => {
      // environment and collection ids are always the same for Watson News
      const environmentId = discovery.environmentId;
      const collectionId = discovery.collectionId;
      queryBuilder.setEnvironmentId(environmentId);
      queryBuilder.setCollectionId(collectionId);
      queryTrendBuilder.setEnvironmentId(environmentId);
      queryTrendBuilder.setCollectionId(collectionId);
    })
    .then(response => {
      // this is the inital query to the discovery service
      console.log('Initial Search Query at start-up');
      const params = queryBuilder.search({ 
        natural_language_query: '',
        count: 5000,
        passages: false
      });
      return new Promise((resolve, reject) => {
        discovery.query(params)
        .then(response =>  {
          resolve(response);
        })
        .catch(error => {
          console.error(error);
          reject(error);
        });
      });
    })
    .then(response => {
      // console.log("GOT DATA!!!! " + util.inspect(response, false, null));
      resolve(createServer(response));
    })
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error(error);
      reject(error);
    });
});

/**
 * createServer - create express server and handle requests
 * from client.
 */
function createServer(results) {
  const server = require('./express');

  // handles search request from search bar
  server.get('/api/trending', (req, res) => {
    const { query, filters, count } = req.query;

    console.log('In /api/trending: query = ' + query);
    
    // build params for the trending search request
    var params = {};
    params.query = query;

    // add any filters and a limit to the number of matches that can be found
    if (filters) {
      params.filter = filters;
    }
    params.count = count;

    var searchParams = queryTrendBuilder.search(params);
    discovery.query(searchParams)
      .then(response => res.json(response))
      .catch(error => {
        if (error.message === 'Number of free queries per month exceeded') {
          res.status(429).json(error);
        } else {
          res.status(error.code).json(error);
        }
      });
  });

  // handles search request from search bar
  server.get('/api/search', (req, res) => {
    const { query, filters, count, returnPassages, queryType } = req.query;
    var params = {};

    console.log('In /api/search: query = ' + query);

    // add query and the type of query
    if (queryType == 'natural_language_query') {
      params.natural_language_query = query;
    } else {
      params.query = query;
    }
    
    // add any filters and a limit to the number of matches that can be found
    if (filters) {
      params.filter = filters;
    }
    params.count = count;
    params.passages = returnPassages;
    
    var searchParams = queryBuilder.search(params);
    discovery.query(searchParams)
      .then(response => res.json(response))
      .catch(error => {
        if (error.message === 'Number of free queries per month exceeded') {
          res.status(429).json(error);
        } else {
          res.status(error.code).json(error);
        }
      });
  });

  // handles search string appened to url
  server.get('/:searchQuery', function(req, res){
    var searchQuery = req.params.searchQuery.replace(/\+/g, ' ');
    const qs = queryString.stringify({ 
      query: searchQuery,
      count: 5000,
      returnPassages: false,
      queryType: 'natural_language_query'
     });
    const fullUrl = req.protocol + '://' + req.get('host');

    console.log('In /:searchQuery: query = ' + qs);

    fetch(fullUrl + `/api/search?${qs}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .then(json => {
        // add up totals for the sentiment of reviews
        var totals = getTotals(json);

        res.render('index',
          {
            entities: json,
            categories: json,
            concepts: json,
            keywords: json,
            data: json,
            searchQuery,
            numMatches: json.matching_results,
            numPositive: totals.numPositive,
            numNeutral: totals.numNeutral,
            numNegative: totals.numNegative,
            error: null
          }
        );
      })
      .catch(response => {
        res.status(response.status).render('index', {
          error: (response.status === 429) ? 'Number of free queries per month exceeded' : 'Error fetching data'
        });
      });
  });

  // initial start-up request
  server.get('/*', function(req, res) {
    console.log('In /*');

    // const util = require('util');
    console.log("++++++++++++ DISCO RESULTS ++++++++++++++++++++");
    // console.log(util.inspect(results, false, null));

    // add up totals for the sentiment of reviews
    var totals = getTotals(results);

    res.render('index', { data: results, 
      entities: results,
      categories: results,
      concepts: results,
      keywords: results,
      numMatches: results.matching_results,
      numPositive: totals.numPositive,
      numNeutral: totals.numNeutral,
      numNegative: totals.numNegative
    });
  });

  return server;
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
    if (result.enriched_text.sentiment.document.label === 'positive') {
      totals.numPositive = totals.numPositive + 1;
    } else if (result.enriched_text.sentiment.document.label === 'negative') {
      totals.numNegative = totals.numNegative + 1;
    } else if (result.enriched_text.sentiment.document.label === 'neutral') {
      totals.numNeutral = totals.numNeutral + 1;
    }
  });

  // console.log('numMatches: ' + data.matching_results);
  // console.log('numPositive: ' + totals.numPositive);
  // console.log('numNegative: ' + totals.numNegative);
  // console.log('numNeutral: ' + totals.numNeutral);

  return totals;
}

module.exports = WatsonDiscoServer;
