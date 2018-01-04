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

'use strict';

require('dotenv').config({
  silent: true
});

require('isomorphic-fetch');
const Promise = require('bluebird');
const queryString = require('query-string');
const queryBuilder = require('./query-builder');
const queryTrendBuilder = require('./query-builder-trending');
const WatsonDiscoverySetup = require('../lib/watson-discovery-setup');
const watson = require('watson-developer-cloud');

/**
 * Back end server which handles initializing the Watson Discovery
 * service, and setting up route methods to handle client requests.
 */

require('metrics-tracker-client').track();

var environment_id;
var collection_id;
const DEFAULT_NAME = 'airbnb-austin-data';
var discoveryDocs = [];
const fs = require('fs');
const path = require('path');
var arrayOfFiles = fs.readdirSync('./data/airbnb/');
arrayOfFiles.forEach(function(file) {
  discoveryDocs.push(path.join('./data/airbnb/', file));
});
// shorten the list if we are loading - trail version of IBM Cloud 
// is limited to 256MB application size
discoveryDocs = discoveryDocs.slice(0,500);

const discovery = watson.discovery({
  // uname/pwd will be pulled in from VCAP_SERVICES or .env
  version: 'v1',
  version_date: '2017-11-07'
});

// make 'query' a promise function
discovery.query = Promise.promisify(discovery.query);

const discoverySetup = new WatsonDiscoverySetup(discovery);
const discoverySetupParams = { 
  default_name: DEFAULT_NAME, 
  config_name: 'keyword-extraction'   // instead of 'Default Configuration'
};

const WatsonDiscoServer = new Promise((resolve) => {
  discoverySetup.setupDiscovery(discoverySetupParams, (err, data) => {
    if (err) {
      discoverySetup.handleSetupError(err);
    } else {
      console.log('Dicovery is ready!');
      // now load data into discovery service collection
      var collectionParams = data;
    
      // set collection creds - at this point the collectionParams
      // will point to the actual credentials, whether the user
      // entered them in .env for an existing collection, or if
      // we had to create them from scratch.
      environment_id = collectionParams.environment_id;
      collection_id = collectionParams.collection_id;
      console.log('environment_id: ' + environment_id);
      console.log('collection_id: ' + collection_id);
      queryBuilder.setEnvironmentId(environment_id);
      queryBuilder.setCollectionId(collection_id);
      queryTrendBuilder.setEnvironmentId(environment_id);
      queryTrendBuilder.setCollectionId(collection_id);

      collectionParams.documents = discoveryDocs;
      console.log('Begin loading ' + discoveryDocs.length + 
        ' json files into discovery. Please be patient as this can take several minutes.');
      discoverySetup.loadCollectionFiles(collectionParams);
      resolve(createServer());
    }
  });
});

/**
 * createServer - create express server and handle requests
 * from client.
 */
function createServer() {
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
    const { query, filters, count, returnPassages, sort, queryType } = req.query;
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
    params.sort = sort;
    
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
      count: 2000,
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

    // this is the inital query to the discovery service
    console.log('Initial Search Query at start-up');
    const params = queryBuilder.search({ 
      natural_language_query: '',
      count: 2000,
      passages: false
    });
    return new Promise((resolve, reject) => {
      discovery.query(params)
        .then(results =>  {

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
    
          resolve(results);
        })
        .catch(error => {
          console.error(error);
          reject(error);
        });
    });
    
    // const util = require('util');
    // console.log('++++++++++++ DISCO RESULTS ++++++++++++++++++++');
    // console.log(util.inspect(results, false, null));

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
