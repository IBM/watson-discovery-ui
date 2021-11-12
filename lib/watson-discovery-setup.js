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

const fs = require('fs'); // file system for loading JSON

/**
 * Setup for Watson Discovery.
 *
 * @param {Object} params - Params needed to
 * @param {Object} callback - Discovery client
 * @constructor
 */
function WatsonDiscoverySetup(discoveryClient) {
  this.discoveryClient = discoveryClient;
}

/**
 * Find the Discovery project.
 * Validate the DISCOVERY_PROJECT_ID.
 * @return {Promise} Promise with resolve({environment}) or reject(err).
 */
WatsonDiscoverySetup.prototype.findDiscoveryProject = function(params) {
  return new Promise((resolve, reject) => {
    const projectID = process.env.DISCOVERY_PROJECT_ID;
    if (projectID) {
      console.log('Discovery project was provided.');
      console.log(projectID);
      params.projectId = projectID;
      return resolve(params);
    } else {
      return reject(new Error('Project ID is required.'));
    }
  });
};

/**
 * Find the Discovery collection.
 * If a DISCOVERY_COLLECTION_ID is set then validate it or error out.
 * Otherwise find it by name (DISCOVERY_COLLECTION_NAME). The by name
 * search is used to find collections that we created before a restart.
 * @param {Object} params - Object discribing the existing environment.
 * @return {Promise} Promise with resolve({discovery params}) or reject(err).
 */
WatsonDiscoverySetup.prototype.findDiscoveryCollection = function(params) {
  console.log('findDiscoveryCollection');
  return new Promise((resolve, reject) => {
    this.discoveryClient.listCollections(params)
      .then(response => {
        console.log(JSON.stringify(response.result, null, 2));
        console.log('Found Discovery collection by name.');
        console.log(response.result.collections[0].name);
        params.collection_name = response.result.collections[0].name;
        params.collectionId = response.result.collections[0].collection_id;
        return resolve(params);

      })
      .catch(err => {
        console.error(err);
        return reject(new Error('Failed to get Discovery collections.'));
      });
  });
};

/**
 * Create a Discovery collection if we did not find one.
 * If params include a collection_id, then we already have one.
 * When we create one, we have to create it with our known name
 * so that we can find it later.
 * @param {Object} params - All the params needed to use Discovery.
 * @return {Promise}
 */
WatsonDiscoverySetup.prototype.createDiscoveryCollection = function(params) {
  if (params.collectionId) {
    return Promise.resolve(params);
  }
  return new Promise((resolve, reject) => {
    // No existing environment found, so create it.
    console.log('Creating discovery collection...');
    const createCollectionParams = {
      name: params.collection_name,
      description: 'Discovery collection created by watson-discovery-ui.',
      language_code: 'en_us'
    };
    Object.assign(createCollectionParams, params);

    this.discoveryClient.createCollection(createCollectionParams, (err, data) => {
      if (err) {
        console.error('Failed to create Discovery collection.');
        return reject(err);
      } else {
        console.log('Created Discovery collection: ', data);
        params.collectionId = data.result.collection_id;
        resolve(params);
      }
    });
  });
};

/**
 * Load the Discovery collection if it is not already loaded.
 * The collection should already be created/validated.
 * Currently using lazy loading of docs and only logging problems.
 * @param {Object} params - All the params needed to use Discovery.
 * @return {Promise}
 */
WatsonDiscoverySetup.prototype.loadDiscoveryCollection = function(params) {
  return new Promise((resolve, reject) => {
    console.log('Get collection to check its status.');
    this.discoveryClient.getCollection(params, (err, data) => {
      if (err) {
        console.error(err);
        return reject(err);
      } else {
        console.log('Checking status of Discovery collection:', data.result.document_counts);
        const numDocsLoaded = data.result.document_counts.available + data.result.document_counts.processing + data.result.document_counts.failed;
        if (typeof params.checkedForExistingDocs === 'undefined') {
          // first time through settings
          params.checkedForExistingDocs = false;
          params.docsAlreadyLoaded = false;
          params.numDocs = params.documents.length;
          params.docChunkSize = 5;  // number of docs to process at one time
          params.docCurrentIdx = 0;
        }
        if ((! params.checkedForExistingDocs) && (numDocsLoaded > 0)) {
          params.docsAlreadyLoaded = true;
          params.checkedForExistingDocs = true;
          console.log('Collection is already loaded with docs.');
          resolve(params);
        } else {
          // process the current chunk of documents
          const endIdx = Math.min(params.docCurrentIdx + params.docChunkSize, params.numDocs);
          const docs = params.documents.slice(params.docCurrentIdx, endIdx);
          const docCount = docs.length;
          params.checkedForExistingDocs = true;
          console.log('Next load of docs = [' + params.docCurrentIdx + ':' + endIdx + ']');

          // the following tells us when we are done with this chunk
          var totalDocsToProcess = params.docCurrentIdx + docCount;

          console.log('Loading documents into Discovery collection.');
          for (let i = 0; i < docCount; i++) {
            const doc = docs[i];
            var file = fs.readFileSync(doc);

            this.discoveryClient.addDocument({environmentId: params.environmentId,
              collectionId: params.collectionId, file: file,
              filename: doc}, (err, data) => {
              if (err) {
                // we got an error on this one doc, but keep loading the rest
                console.log('Add document error:');
                console.error(err);
              } else {
                console.log('[' + params.docCurrentIdx + '] Added document: ' + data.result.document_id);
              }
              params.docCurrentIdx += 1;
              if (params.docCurrentIdx === totalDocsToProcess) {
                this.discoveryClient.getCollection(params, (err, data) => {
                  if (err) {
                    console.error(err);
                    return reject(err);
                  } else {
                    console.log('Checking status of Discovery collection:', data.result.document_counts);
                    resolve(params);
                  }
                });
              }
            });
          }
        }
      }
    });
  });
};

/**
 * Validate and setup the Discovery service.
 */
WatsonDiscoverySetup.prototype.setupDiscovery = function(setupParams, callback) {
  this.findDiscoveryProject(setupParams)
    .then(params => this.findDiscoveryCollection(params))
    .then(params => this.createDiscoveryCollection(params))
    .then(params => callback(null, params))
    .catch(callback);
};

/**
 * Add chunk of files to Discovery collection.
 */
WatsonDiscoverySetup.prototype.loadDiscoveryData = function (collectionParams, callback) {
  this.loadDiscoveryCollection(collectionParams)
    .then(params => callback(null, params))
    .catch(callback);
};

/**
 * Manage the flow of files being added to the Discovery collection.
 */
WatsonDiscoverySetup.prototype.loadCollectionFiles = function (params) {
  return new Promise((resolve, reject) => {
    this.loadDiscoveryData(params, (err, data) => {
      if (err) {
        this.handleSetupError(err);
        console.log(err);
        return reject(err);
      } else {
        var collectionParams = data;
        if ((! collectionParams.docsAlreadyLoaded) && (collectionParams.docCurrentIdx < collectionParams.numDocs)) {
          this.loadCollectionFiles(collectionParams);
        } else {
          console.log('Discovery collection loading has completed!');
          resolve(params);
        }
      }
    });
  });
};

/**
 * Handle setup errors by logging and exiting.
 * @param {String} reason - The error message for the setup error.
 */
WatsonDiscoverySetup.prototype.handleSetupError = function (reason) {
  console.error('The app failed to initialize properly. Setup and restart needed. ' + reason);
  // Abort on a setup error allowing IBM Cloud to restart it.
  console.error('\nAborting due to setup error!');
  process.exit(1);
};

module.exports = WatsonDiscoverySetup;
