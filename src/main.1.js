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

import 'isomorphic-fetch';
import React from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import Matches from './Matches';
import SearchField from './SearchField';
import Entities from './Entities';
import queryBuilder from '../server/query-builder';
import { Grid, Dimmer, Loader } from 'semantic-ui-react';

class Main extends React.Component {

  constructor(...props) {
    super(...props);
    const { entities, data, searchQuery, error } = this.props;

    this.state = {
      error: error,
      data: data && parseData(data),
      entities: entities && parseEntities(entities),
      loading: false,
      searchQuery: searchQuery || ''
    };
  }

  fetchData(query) {
    const { searchQuery } = query;

    this.setState({
      loading: true,
      searchQuery,
      entities: entities
    });

    scrollToMain();
    history.pushState({}, {}, `/${searchQuery.replace(/ /g, '+')}`);

    const qs = queryString.stringify({ query: searchQuery });
    console.log("In fetchData(): query = " + query);
    fetch(`/api/search?${qs}`)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw response;
      }
    })
    .then(json => {
      this.setState({ entities: entities, data: parseData(json), loading: false, error: null });
      scrollToMain();
    })
    .catch(response => {
      this.setState({
        error: (response.status === 429) ? 'Number of free queries per month exceeded' : 'Error fetching results',
        loading: false,
        data: null,
        entities: entities
      });
      // eslint-disable-next-line no-console
      console.error(response);
    });
  }

  getMatches() {
    const { data } = this.state;

    if (!data) {
      return null;
    }

    return <Matches matches={data.results} />;
  }

  getEntities() {
    const { entities } = this.state;

    if (!entities) {
      return null;
    }

    return <Entities entities={entities.results} />;
  }

  render() {
    const { entities, loading, data, error, searchQuery } = this.state;

    return (
      <Grid celled className='search-grid'>
        <Grid.Row>
          <Grid.Column width={16} textAlign='center'>
            <SearchField
              onSearchQueryChange={this.fetchData.bind(this)}
              searchQuery={searchQuery}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={4} textAlign='center'>
            <div className="row">
              {this.getEntities()}
            </div>
          </Grid.Column>
          <Grid.Column width={12} textAlign='center'>
            {loading ? (
              <div className="results">
                <div className="loader--container">
                  <Dimmer active>
                    <Loader>Loading</Loader>
                  </Dimmer>
                </div>
              </div>
            ) : data ? (
              <div className="results">
                <div className="_container _container_large">
                  <div className="row">
                    {this.getMatches()}
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="results">
                <div className="_container _container_large">
                  <div className="row">
                    {JSON.stringify(error)}
                  </div>
                </div>
              </div>
            ) : null}
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}

Main.propTypes = {
  entities: PropTypes.object,
  data: PropTypes.object,
  searchQuery: PropTypes.string,
  error: PropTypes.object
};

const getTitleForItem = item => item.title ? item.title : 'Untitled';

const parseData = data => ({
  rawResponse: Object.assign({}, data),
  sentiment: data
    .aggregations[0]
    .results.reduce((accumulator, result) =>
      Object.assign(accumulator, { [result.key]: result.matching_results }), {}),
  results: data.results
});

const parseEntities = entities => ({
  rawResponse: Object.assign({}, entities),
  results: entities.aggregations[0].results
});

function scrollToMain() {
  setTimeout(() => {
    const scrollY = document.querySelector('main').getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, scrollY);
  }, 0);
}

module.exports = Main;
