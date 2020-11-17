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

import Dropzone from 'react-dropzone';
import React from 'react';
// import PropTypes from 'prop-types';

export default class FileUploader extends React.Component {
  constructor(...props) {
    super(...props);

    this.onImageDrop = this.onImageDrop.bind(this);
  }

  onImageDrop(acceptedFiles) {
    const data = new FormData();
    for (let i = 0; i < acceptedFiles.length; i += 1) {
      data.append('file', acceptedFiles[i]);
    }

    $.ajax({
      url: '/file-upload',
      data,
      processData: false,
      contentType: false,
      method: 'POST',
      dataType: 'json',
      success: (response) => {
        if (response.success) {
          alert('success');
        } else {
          alert('failed');
        }
      },
      error: (jqXHR) => {
        const res = jqXHR.responseJSON;
        alert('error: ' + JSON.stringify(res));
      },
    });
  }

  render() {
    return (
      <div>
        <Dropzone
          multiple
          onDrop={this.onImageDrop}
        >
          <p>Drop images or click to select a file to upload</p>
        </Dropzone>
      </div>
    );
  }
}

