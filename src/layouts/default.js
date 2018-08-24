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

import React from 'react';
import PropTypes from 'prop-types';

class DefaultLayout extends React.Component {
  getDescription() {
    return (
      <div>
        <div>
          This is a web app to demonstrates how to query your own Watson Discovery Collection and display it in a variety of ways.
        </div>
      </div>
    );
  }

  render() {
    return (
      <html>
        <head>
          <title>Watson Discovery UI</title>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="og:title" content="Watson Discovery Search UI" />
          <meta name="og:description" content={this.props.description || 'Search using Watson Discovery Service'} />
          <link rel="stylesheet" type="text/css" href="/css/application.css"/>
          <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.12/semantic.min.css"/>
          <link rel="icon" type="image/x-icon" href="/images/favicon.ico"/>
          <link rel="icon" href="data:,"/>
        </head>
        <body>
          <main>{this.props.children}</main>
          <script
            type="text/javascript"
            id="bootstrap-data"
            dangerouslySetInnerHTML={{__html: `window.__INITIAL_STATE__ = ${this.props.initialData};`}}
          ></script>
          <script type="text/javascript" src="/js/bundle.js" />
        </body>
      </html>
    );
  }
}

DefaultLayout.propTypes = {
  hideHeader: PropTypes.bool,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  initialData: PropTypes.string.isRequired
};

module.exports = DefaultLayout;
