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

import queryBuilderTrending from '../server/query-builder-trending';

beforeEach(() => {
  queryBuilderTrending.setCollectionId('collection');
  queryBuilderTrending.setEnvironmentId('environment');
});

describe('Trending query builder returns params for discovery service', () => {
  test('when opts are NOT passed', () => {
    expect(queryBuilderTrending.search()).toEqual({
      environmentId: 'environment',
      collectionId: 'collection',
      aggregation: 'timeslice(date,1month).average(enriched_text.sentiment.document.score)'
    });
  });

  test('when opts are passed', () => {
    expect(queryBuilderTrending.search({
      filter: 'enriched_text.categories.label::"test"',
      count: 500,
      query: 'enriched_text.categories.label::"test"',
    })).toEqual({
      environmentId: 'environment',
      collectionId: 'collection',
      aggregation: 'timeslice(date,1month).average(enriched_text.sentiment.document.score)',
      query: 'enriched_text.categories.label::"test"',
      filter: 'enriched_text.categories.label::"test"',
      count: 500
    });
  });
});
