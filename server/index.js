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
const discovery = require('./watson-discovery-service');
const utils = require('../src/utils');
const { parseData, topicStory } = utils;
const util = require('util');

/*eslint no-unused-vars: ["error", {"argsIgnorePattern": "response"}]*/
const WatsonNewsServer = new Promise((resolve, reject) => {
  // getInvironments as sanity check to ensure creds are valid
  discovery.getEnvironments({})
    .then(response => {
      // environment and collection ids are always the same for Watson News
      const environmentId = discovery.environmentId;
      const collectionId = discovery.collectionId;
      queryBuilder.setEnvironmentId(environmentId);
      queryBuilder.setCollectionId(collectionId);
    })
    .then(response => {
      const params = Object.assign({
        environment_id: "e52e21d1-0295-4c62-991c-1f0686b65fc9",
        collection_id: "05f0711c-db65-4344-994b-ec2c9353dd5a",
        sort: '-_score',
        return: 'enriched_text.entities.text',
        aggregation: 'term(enriched_text.entities.text, count:12)'
      });
      return new Promise((resolve, reject) => {
        discovery.query(params)
        .then(response =>  {
          // entities are in the response
          resolve(response);
        })
        .catch(error => {
          console.error(error);
          reject(error);
        });
      });
    })
    .then(response => {
      resolve(createServer(response));
    })
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error(error);
      reject(error);
    });
});

function createServer(entities) {
  const server = require('./express');

  server.get('/api/search', (req, res) => {
    const { query } = req.query;
    
    var parms;
    console.log("In /api/search: query = " + query);
    
    // parse out search query from filters
    var idx = query.indexOf('enriched_text.entities.text');
    if (idx < 0) {
      // only have search string
      console.log('no entities found - query: ' + query);
      parms = queryBuilder.search({ natural_language_query: query });
    } else {
      var queryPart = query.substr(0, idx);
      var entities = query.substr(idx);
      parms = queryBuilder.search({ natural_language_query: queryPart,
                                    filter: entities });
    }
    console.log("parms: ");
    console.log(util.inspect(parms, false, null));

    discovery.query(parms)
      .then(response => res.json(response))
      .catch(error => {
        if (error.message === 'Number of free queries per month exceeded') {
          res.status(429).json(error);
        } else {
          res.status(error.code).json(error);
        }
      });
  });

  server.get('/:searchQuery', function(req, res){
    const searchQuery = req.params.searchQuery.replace(/\+/g, ' ');
    const qs = queryString.stringify({ query: searchQuery });
    const fullUrl = req.protocol + '://' + req.get('host');

    console.log("In /:search: query = " + qs);

    fetch(fullUrl + `/api/search?${qs}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .then(json => {
        res.render('index', { entities: entities, data: json, searchQuery, error: null });
      })
      .catch(response => {
        res.status(response.status).render('index', {
          error: (response.status === 429) ? 'Number of free queries per month exceeded' : 'Error fetching data'
        });
      });
  });

 server.get('/*', function(req, res) {
    const category = req.params[0];
    const props = category ? { category } : {};

    console.log("In /*");
    
    res.render('index', { entities: entities });
  });

  return server;
}

module.exports = WatsonNewsServer;