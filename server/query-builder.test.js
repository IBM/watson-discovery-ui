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

import queryBuilder from './query-builder';
import moment from 'moment';

beforeEach(() => {
  queryBuilder.setCollectionId('collection');
  queryBuilder.setEnvironmentId('environment');
});

describe('Query builder returns params for discovery service', () => {
  test('when opts are NOT passed', () => {
    expect(queryBuilder.trending()).toEqual({
      environment_id: 'environment',
      collection_id: 'collection',
      return: 'enriched_title.entities.text',
      aggregation: [
        'term(enriched_title.entities.text,count:20).top_hits(1)'
      ],
      filter: `crawl_date>${moment().subtract(24,'h').toISOString().slice(0, -5)}`
    });
  });

  test('when opts are passed', () => {
    expect(queryBuilder.trending({
      filter: 'enriched_text.categories.label:"test"'
    })).toEqual({
      environment_id: 'environment',
      collection_id: 'collection',
      return: 'enriched_title.entities.text',
      aggregation: [
        'term(enriched_title.entities.text,count:20).top_hits(1)'
      ],
      filter: `enriched_text.categories.label:"test",crawl_date>${moment().subtract(24,'h').toISOString().slice(0, -5)}`
    });
  });
});
