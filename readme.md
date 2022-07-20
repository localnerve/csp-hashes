# csp-hashes

> Flexible build library to generate script and style hashes for CSP headers or Meta tags

[![npm version](https://badge.fury.io/js/%40localnerve%2Fcsp-hashes.svg)](https://badge.fury.io/js/%40localnerve%2Fcsp-hashes)
![Verify](https://github.com/localnerve/csp-hashes/workflows/Verify/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/localnerve/csp-hashes/badge.svg?branch=master)](https://coveralls.io/github/localnerve/csp-hashes?branch=master)

## Contents
+ [Overview](#overview)
+ [API](#api)
+ [Example Usage](#example-usage)
+ [MIT License](#license)

## Overview
This library generates script and style inline element and attribute hashes. It is intended for use in the generation of HTTP content security policy (CSP) headers or to replace/update Meta tags as a website build step.

## API

The library exports a single function that takes options and returns a Stream.
Here's the signature:

```
Stream cspHashes (Options)
```

### Input

A quick look at all the input and the types. All options are optional. For a more detailed explanation of input [skip to here](#input-detail).

```
folderId: String,
userId: String,
[Options: Object]
  outputDirectory: String,
  scopes: Array<String>,
  fileQuery: String,
  auth: GoogleAuth | OAuth2Client | JWT | String, 
  exportMimeMap: Object<key:String, value:String>,
  transformer: Function
```

### Output

The returned Promise resolves to a `Stream` in object mode to receive data objects for each downloaded file as it arrives.

#### Stream Data Format

The format of the data objects you will receive on `data` events:

```
  {
    input: {
      data,         // Buffer | String, data from Google Drive, Buffer if binary, 'utf-8' String otherwise
      name,         // String of the file name
      ext,          // String of the file extension
      binary,       // Boolean, true if binary data content
      downloadMeta, // Object
        mimeType | alt  // String, mimeType for export, alt for get
    },
    // If converted is true, the converted data. Otherwise, a reference to input
    output: {
      data,     // String (utf-8) or Buffer if input was binary
      name,     // String of the file name
      ext       // String of the file extension
    },
    converted   // Boolean, true if conversion occurred, false otherwise
  }
```

The `input` is data as downloaded from Google Drive.
The `output` is data as converted by a [transformer](#transformer-function).
If no conversion occurs (`converted === false`), output is a referece to `input`.

## Input Detail

`SVC_ACCT_CREDENTIALS` environment variable must point to a valid Google Service Account credential file **UNLESS** Auth is supplied using the `auth` option.

### Google Drive Parameters

* `folderId` {String} -  Uniquely identifies your folder in the google drive service. Found on the web in the url.
* `userId` {String} - The email address of the folder owner that SVC_ACCT_CREDENTIALS will impersonate. If you supply the `auth` option, this parameter is ignored.

### Options

All options are optional.

* `[Options]` {Object} - The general options object.
* `[Options.scopes]` {Array<String>} - Scopes to use for auth (if required) in a special case. Defaults to the `drive.readonly` scope.
* `[Options.fileQuery]` {String} - A file query string used to filter files to download by specific characteristics. Defaults to downloading all files in the `folderId` that are NOT deleted (`trashed = false`). @see [file reference search terms](https://developers.google.com/drive/api/v3/ref-search-terms).
* `[Options.auth]` {GoogleAuth | OAuth2Client | JWT | String} - Given directly to the Google Drive NodeJS Client `auth` option. Use this option to override the default behavior of the `SVC_ACCT_CREDENTIALS` environment variable path to a service account credentials. This will also cause the `userId` parameter to be ignored.
* `[Options.outputDirectory]` {String} - Absolute path to the output directory. Defaults to falsy. If supplied, files are written out as data arrives. Does not touch the directory other than to write files. The directory must already exist.

#### Conversion Options

* `[Options.exportMimeMap]` {Object} - A name-value map of Google Workspace mime-types to a conversion mime-type to be performed by the Google Drive service prior to sending the data to the `transformer` function. If this option is supplied, the Google Drive Files 'export' method is used, and therefore the types are presumed to conform to the service capabilities outlined in the [Google Export Reference](https://developers.google.com/drive/api/v3/ref-export-formats). For detail on Google Workspace mime-types, see [Google Workspace MimeTypes](https://developers.google.com/drive/api/v3/mime-types). If this option is not supplied, the Google Drive Files 'get' method is used for download.
* `[Options.transformer]` {Function} - Transforms the input after download (or optional export conversion) and before it goes out to the stream (and optional `outputDirectory`, if supplied). Defaults to pass-through. Returns a Promise that resolves to an object that conforms to the [stream data format](#stream-data-format).

##### Transformer Function

A Transformer function receives input from the download and returns a Promise that resolves to the [data stream object format](#data-stream-format)

###### Transformer Input Object

A supplied `transformer` function receives a single object from the download of the following format:

```
{ 
  name: String,
  ext: String,
  data: <Buffer | String>,  // Buffer if binary, 'utf-8' String otherwise
  binary: Boolean,
  downloadMeta: Object
    method: String,         // 'get' or 'export'
    parameters: Object      // parameters used in the download (mimeType from exportMimeMap or alt='media')
}
```

###### Transformer Example
This example downloads all files from the given Google Drive Folder.
It presumes they are all Google Workspace GoogleDocs files that are markdown documents.
Downloads them as `text/plain`, converts them to 'html', and outputs the result to the stream.

```js
import googleDriveFolder from '@localnerve/google-drive-folder';

process.env.SVC_ACCT_CREDENTIALS = '/path/to/svcacctcredential.json';

const folderId = 'ThEfOlDeRiDyOuSeEiNyOuRbRoWsErOnGoOgLeDrIvE';
const userId = 'email-of-the-folder-owner@will-be-impersonated.by-svc-acct';

// Use remark for markdown to html conversion
const remark = require('remark');
const remarkHtml = require('remark-html');

/**
 * The transformer definition.
 * Receives an input object from the Google Drive download, outputs a conversion object
 * in the form of #stream-data-format defined in this readme.md
 * 
 * @param input (Object) The file input object
 * @param input.name {String} The name of the file downloaded
 * @param input.ext {String} The extension of the file download (if available)
 * @param input.data {String} The utf-8 encoded string data from the 'text/plain' download.
 * @param input.binary {Boolean} False in this case, true if content binary.
 * @param input.downloadMeta {Object} download meta data
 * @param input.downloadMeta.method {String} 'export' or 'get', 'export' in this case.
 * @param input.downloadMeta.parameters {Object} the download parameters
 * @param input.downloadMeta.parameters.mimeType {String} The mimeType used, 'text/plain' in this case.
 * @param input.downloadMeta.parameters.alt {String} 'meta' when 'get' method is used, undefined in this case.
 */
function myTransformer (input) {
  return new Promise((resolve, reject) => {
    remark()
      .use(remarkHtml)
      .process(input.data, (err, res) => {
        if (err) {
          err.message = `Failed to convert '${input.name}'` + err.message;
          return reject(err);
        }
        resolve({
          input,
          output: {
            name: input.name,
            ext: '.html',
            data: String(res)
          },
          converted: true
        });
      });
  });
}

// let's do this:
try {
  // blocks until object flow begins
  const stream = await googleDriveFolder(folderId, userId, {
    exportMimeMap: {
      'application/vnd.google-apps.document': 'text/plain'
    },
    transformer: myTransformer 
  });
  stream.on('data', data => {
    // data.input.data has markdown
    // data.output.data has html
    console.log(`Received converted data for '${data.output.name}'`, data);
  });
  stream.on('end', () => {
    console.log('downloads are done, we got all the files.');
  });
  stream.on('error', e => {
    throw e;
  });
}
catch (e) {
  console.error(e); // something went wrong
}
```

## Example Usage

### Code Example using minimal options

```js
import googleDriveFolder from '@localnerve/google-drive-folder';

process.env.SVC_ACCT_CREDENTIALS = '/path/to/svcacctcredential.json';

const folderId = 'ThEfOlDeRiDyOuSeEiNyOuRbRoWsErOnGoOgLeDrIvE';
const userId = 'email-of-the-folder-owner@will-be-impersonated.by-svc-acct';

try {
  // Blocks until object flow begins (while auth and file list is downloaded)
  const stream = await googleDriveFolder(folderId, userId);
  stream.on('data', data => {
    console.log(`Received a data object for '${data.input.name}'`, data);
  });
  stream.on('end', () => {
    console.log('downloads are done, we got all the files');
  });
  stream.on('error', e => {
    throw e;
  });
} catch (e) {
  console.error(e); // something went wrong
}
```

### Code Example using most options

All the prerequisites and possible arguments as code (except for `auth` option):

```js
import googleDriveFolder from '@localnerve/google-drive-folder';
import myTransformer from './myTransformer'; // your transform function

process.env.SVC_ACCT_CREDENTIALS = '/path/to/svcacctcredential.json';

const folderId = 'ThEfOlDeRiDyOuSeEiNyOuRbRoWsErOnGoOgLeDrIvE';
const userId = 'email-of-the-folder-owner@will-be-impersonated.by-svc-acct';

// all optional, if outputDirectory omitted, returns ReadableStream
const options = {
  outputDirectory: '/tmp/mydrivefolder/mustexist',
  scopes: [
    'special/google.auth/scope/you/might/need/other/than/drive.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
  ],
  fileQuery: 'name contains ".md"', // download GoogleDocs markdown files
  exportMimeMap: {
    'application/vnd.google-apps.document': 'text/plain'
  },
  transformer: myTransformer
};

try {
  // Blocks until object flow begins
  const stream = await googleDriveFolder(folderId, userId, options);
  stream.on('data', data => {
    console.log(`Received a data object for '${data.input.name}'`, data);
  });
  stream.on('end', () => {
    console.log('downloads are done, we got all the files');
  });
  stream.on('error', e => {
    throw e;
  });
} catch (e) {
  console.error(e); // something went wrong
}

```

## LICENSE

* [MIT, Alex Grant, LocalNerve, LLC](license.md)
