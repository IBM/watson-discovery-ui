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

const moment = require('moment');
const util = require('util');

module.exports = {
  setEnvironmentId(environmentId) {
    this.environment_id = environmentId;
  },
  setCollectionId(collectionId) {
    this.collection_id = collectionId;
  },
  search(queryOpts) {
    const params = Object.assign({
      environment_id: this.environment_id,
      collection_id: this.collection_id,
      count: 100,
      sort: '-_score',
      return: 'title,text,url,host,html,crawl_date,score,id,' +
              'enriched_text.entities.text,enriched_text.sentiment.document.label',
      aggregation: '[term(enriched_text.entities.text, count:12),' + 
                   'term(enriched_text.categories.label, count:10),' +
                   'term(enriched_text.concepts.text,count:12)]'
    }, queryOpts);

  console.log("params: ");
  console.log(util.inspect(params, false, null));
  return params;
  }
};
