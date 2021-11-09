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
const queryString = require('query-string');
const queryBuilder = require('./query-builder');
const WatsonDiscoverySetup = require('../lib/watson-discovery-setup');
const DiscoveryV2 = require('ibm-watson/discovery/v2');
const utils = require('../lib/utils');

/**
 * Back end server which handles initializing the Watson Discovery
 * service, and setting up route methods to handle client requests.
 */

var project_id;
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
// is limited to 256MB application size, so use this if you get
// out of memory errors.
discoveryDocs = discoveryDocs.slice(0,300);

// Note that credentials are pulled from env
const discovery = new DiscoveryV2({
  version: '2020-08-30',
});

const discoverySetup = new WatsonDiscoverySetup(discovery);
const discoverySetupParams = { 
  default_name: DEFAULT_NAME, 
  config_name: 'airbnb-keyword-extraction'   // instead of 'Default Configuration'
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
      project_id = collectionParams.projectId;
      collection_id = collectionParams.collectionId;
      console.log('project_id: ' + project_id);
      console.log('collection_id: ' + collection_id);
      queryBuilder.setProjectId(project_id);
      queryBuilder.setCollectionId(collection_id);

      collectionParams.documents = discoveryDocs;
      console.log('Begin loading json files into discovery. Please be patient as this can take several minutes.');
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
  server.get('/api/search', (req, res) => {
    const { query, filters, count, sort, queryType } = req.query;
    var params = {};

    console.log('In /api/search query');

    // add query and the type of query
    if (queryType == 'natural_language_query') {
      params.naturalLanguageQuery = query;
    } else {
      params.query = query;
    }
    
    // add any filters and a limit to the number of matches that can be found
    if (filters) {
      params.filter = filters;
    }

    params.count = count;
    if (! sort) {
      params.sort = utils.BY_HIGHEST_QUERY;
    } else {
      params.sort = sort;
    }
    
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
    console.log('In /:searchQuery: query');

    var searchQuery = req.params.searchQuery.replace(/\+/g, ' ');
    const qs = queryString.stringify({ 
      query: searchQuery,
      count: 1000,
      highlight: true,
      returnPassages: false,
      queryType: 'natural_language_query'
    });
    const fullUrl = req.protocol + '://' + req.get('host');

    fetch(fullUrl + `/api/search?${qs}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .then(json => {

        // get all the results data in right format
        var matches = utils.parseData(json);
        matches = utils.formatData(matches, []);
        var totals = utils.getTotals(matches);

        res.render('index',
          {
            data: matches,
            entities: json,
            keywords: json,
            entityTypes: json,
            searchQuery,
            numMatches: matches.results.length,
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
    // this is the inital query to the discovery service
    console.log('Initial startup query');

    const params = queryBuilder.search({ 
      naturalLanguageQuery: '',
      count: 1000,
      sort: '-enriched_text.sentiment.score'
    });

    return new Promise((resolve, reject) => {
      discovery.query(params)
        .then(results =>  {

          // console.log('++++++++++++ DISCO RESULTS ++++++++++++++++++++');
          // console.log(JSON.stringify(results, null, 2));

          // get all the results data in right format
          var matches = utils.parseData(results);
          // false = we do not want to see passages initially
          matches = utils.formatData(matches, false);
          var totals = utils.getTotals(matches);
    
          res.render('index', { 
            data: matches, 
            entities: results,
            keywords: results,
            entityTypes: results,
            numMatches: matches.results.length,
            numPositive: totals.numPositive,
            numNeutral: totals.numNeutral,
            numNegative: totals.numNegative,
          });
    
          resolve(results);
        })
        .catch(error => {
          console.error(error);
          reject(error);
        });
    });
    
  });

  return server;
}

module.exports = WatsonDiscoServer;
