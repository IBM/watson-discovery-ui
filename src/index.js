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

const React = require('react');
const PropTypes = require('prop-types');
const DefaultLayout = require('./layouts/default');
const Main = require('./main');
const objectWithoutProperties = require('../lib/utils').objectWithoutProperties;

class Application extends React.Component {
  render() {
    const props = objectWithoutProperties(this.props, ['settings', '_locals', 'cache']);

    return (
      <DefaultLayout
        title={props.title}
        initialData={JSON.stringify(props)}
        hideHeader={Boolean(props.searchQuery)}
      >
        <Main {...props} />
      </DefaultLayout>
    );
  }
}

Application.propTypes = {
  searchQuery: PropTypes.string,
};

module.exports = Application;
