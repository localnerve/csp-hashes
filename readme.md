# csp-hashes

> Flexible build library to generate script and style hashes for CSP headers or meta tags

[![npm version](https://badge.fury.io/js/@localnerve%2Fcsp-hashes.svg)](https://badge.fury.io/js/@localnerve%2Fcsp-hashes)
![Verify](https://github.com/localnerve/csp-hashes/workflows/Verify/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/localnerve/csp-hashes/badge.svg?branch=main)](https://coveralls.io/github/localnerve/csp-hashes?branch=main)

## Contents
- [csp-hashes](#csp-hashes)
  - [Contents](#contents)
  - [Overview](#overview)
  - [Breaking Changes](#breaking-changes)
  - [API](#api)
    - [hashstream (also the default export)](#hashstream-also-the-default-export)
    - [cspHashes](#csphashes)
    - [createCspHash](#createcsphash)
    - [removeCspMeta](#removecspmeta)
    - [Hashstream Options](#hashstream-options)
      - [Callback Function](#callback-function)
        - [Callback Hashes Object](#callback-hashes-object)
  - [Example Usage](#example-usage)
    - [Build Step to Maintain CSP Headers](#build-step-to-maintain-csp-headers)
    - [Build Step to Maintain CSP Meta Tags](#build-step-to-maintain-csp-meta-tags)
    - [Build Step to Remove CSP Meta Tag Content](#build-step-to-remove-csp-meta-tag-content)
    - [Native Node.js Streams (No Gulp/Vinyl Required)](#native-nodejs-streams-no-gulpvinyl-required)
    - [Non-ESM usage](#non-esm-usage)
  - [LICENSE](#license)

## Overview
This Node.js library generates script and style inline element and attribute hashes. It is for use in the generation of HTTP content security policy (CSP) headers or to replace/update Meta tags as a website build step. Works with [Gulp](https://github.com/gulpjs/gulp) via Vinyl objects, or directly with native Node.js streams using plain file-like objects.

## Breaking Changes
+ As of Version 2+, this is an ES Module. See [Non-Esm Usage](#non-esm-usage) for how to use outside of ESM.
+ As of Version 6+, requires Node 20+
+ As of Version 7+, requires Node 22+

## API

### hashstream (also the default export)
This library exports a function that takes options and returns a transform stream in object mode. The transform stream operates on [Vinyl](https://github.com/gulpjs/vinyl) objects or a compatible file object with `path` and `contents` properties. The only required option is a [`callback`](#callback-function) function.

```
Stream hashstream ({
  callback,
  replace = false,
  algo = 'sha256'
})
```

See [`hashstream options`](#hashstream-options) for a detailed explanation of the input options.

### cspHashes
This library exports a convenience function that takes an algorithm and HTML content, and returns a hashes object containing all CSP hashes for inline scripts and styles. This is useful for users who just have a few files to process and will handle I/O themselves, without needing a stream.

```
Object cspHashes(content, algo = 'sha256')
```

+ {Buffer|String} **content** - Required - The HTML content to extract hashes from.
+ {String} **\[algo\]** - Optional - Defaults to `'sha256'`, can be one of 'sha256', 'sha384' or 'sha512'.

Returns a [`hashes` object](#callback-hashes-object) with the same structure as the `hashstream` callback receives:

```javascript
{
  script: {
    elements: [],
    attributes: [],
    get all () { return this.elements.concat(this.attributes); }
  },
  style: {
    elements: [],
    attributes: [],
    get all () { return this.elements.concat(this.attributes); }
  }
}
```

### createCspHash
This library exports the helper method it uses to make CSP formatted hashes. This is useful if you have a picece of code you need to hash and place into your hash list outside the scope of the page as rendered.

```
String createCSPHash(inputString, algo = 'sha256')
```

+ {String} **inputString** - Required - The input content to hash.
+ {String} **\[algo\]** - Optional - Defaults to `'sha256'`, can be one of 'sha256', 'sha384' or 'sha512'.

Returns a ready to use csp hash string (with quotes) in the form of `'sha256-d3ii1Pel57UO62xosCMNgTaZJhJa87Gd/X6e7UdlEU8='`.

### removeCspMeta
This library also exports a convenience helper method, `removeCspMeta` that is useful for some types of development builds. This method takes no options and returns a stream that operates on [Vinyl](https://github.com/gulpjs/vinyl) objects or plain file-like objects with `path` and `contents` properties, removing any `Content-Security-Policy` content found in the files.

```
Stream removeCspMeta ()
```

### Hashstream Options

+ {Function} **callback** - Required - A [function](#callback-function) to process the hashes. Receives file contents and must return new file contents if `replace` option is true.
+ {Boolean} **\[replace\]** - Optional - Defaults to `false`, set to true to indicate your `callback` function returns new file contents to replace the original.
+ {String} **\[algo\]** - Optional - Defaults to `'sha256'`, can be one of 'sha256', 'sha384' or 'sha512'.


#### Callback Function
A callback function is required to process the CSP hashes collected by this library for your build.

```
callback(path, hashes[, contents])
```

+ {String} **path** - The local filesystem path to the original file. Use to create your own rules and/or a path to the web resource for writing header rules.
+ {Object} **hashes** - The script and style inline element and attribute hashes for the current file. See object [format](callback-hashes-object) for details.
+ {String} **\[contents\]** - The original file contents. Only sent if the `replace` option is true, in which case you **must** return new file contents.

##### Callback Hashes Object
The callback hashes object contains all of the inline element and attribute hashes for scripts and styles in the current file being processed. The object has the following format:

```javascript
// `hashes` object:
{
  script: {
    elements: [],
    attributes: [],
    get all () {
      return this.elements.concat(this.attributes);
    }
  },
  style: {
    elements: [],
    attributes: [],
    get all () {
      return this.elements.concat(this.attributes);
    }
  }
}
```

The object structure allows you to direct the hashes to any CSP header directive layout you might use. You can use `script-src` or `style-src` alone and concatenate the element and attribute hashes together into one list using the `all` getter property, or you can use `script-src-attr` and `style-src-attr` separately, whatever is a more secure/optimal policy for your situation.  
**NOTE**  
The `hashes` object structure is always the same. If there are no elements or attributes of script or style in the current file, the arrays are just empty (not null).

## Example Usage

### Build Step to Maintain CSP Headers
In this example, a build step gets the hashes for every html file under the `dist` directory, then for each html file, updates the header rules for the host service being deployed to.

```javascript
import gulp from 'gulp';
import path from 'path';
import hashstream from '@localnerve/csp-hashes';
import { cspHeaderRules } from './host-header-rules';

export function cspHeaders (settings) {
  const { dist } = settings;

  return gulp.src(`${dist}/**/*.html`)
    .pipe(hashstream({
      callback: (p, hashes) => {
        const webPath = p.replace(path.resolve(dist), '');
        cspHeaderRules.updateHashes(webPath, 'script-src', hashes.script.elements.join(' '));
        cspHeaderRules.updateHashes(webPath, 'script-src-attr', hashes.script.attributes.join(' '));
        cspHeaderRules.updateHashes(webPath, 'style-src', hashes.style.elements.join(' '));
        cspHeaderRules.updateHashes(webPath, 'style-src-attr', hashes.style.attributes.join(' '));
      }
    }))
}
```

### Build Step to Maintain CSP Meta Tags
In this example, a build step gets the hashes for every html file under the `dist` directory, then updates each html file's meta tags to include the hashes after 'self', preserving any other rules before it. This example uses the `all` property to get the combined element and attribute hashes together.

```javascript
import gulp from 'gulp';
import hashstream from '@localnerve/csp-hashes';

export function cspMetaTags (settings) {
  const { dist } = settings;

  return gulp.src(`${dist}/**/*.html`)
    .pipe(hashstream({
      replace: true,
      callback: (p /* not used */, hashes, contents) => {
        return contents
          .replace(/script-src (.+) 'self'/, `script-src $1 'self' ${hashes.script.all.join(' ')}`)
          .replace(/style-src (.+) 'self'/, `style-src $1 'self' ${hashes.style.all.join(' ')}`);
      }
    }))
    .pipe(gulp.dest(dist));
}
```

### Build Step to Remove CSP Meta Tag Content
In this example, a build step removes any content from a `Content-Security-Policy` in a development build that wishes to ignore it.

```javascript
import gulp from 'gulp';
import { removeCspMeta } from '@localnerve/csp-hashes';

export function stripCspMetaContents (settings) {
  const { dist } = settings;

  return gulp.src(`${dist}/**/*.html`)
    .pipe(removeCspMeta())
    .pipe(gulp.dest(dist));
}
```

### Simple File Processing (No Stream Required)
If you just have a few files to process and want to handle I/O yourself, use `cspHashes` instead of `hashstream`:

```javascript
import fs from 'node:fs';
import { cspHashes } from '@localnerve/csp-hashes';

const html = fs.readFileSync('./dist/index.html', { encoding: 'utf8' });
const hashes = cspHashes(html, 'sha256');

console.log('Script element hashes:', hashes.script.elements.join(' '));
console.log('Style attribute hashes:', hashes.style.attributes.join(' '));
```

### Native Node.js Streams (No Gulp/Vinyl Required)
You can use `hashstream` directly with native Node.js streams by wrapping raw file buffers into plain file-like objects. This example reads HTML files from a source directory, processes them through `hashstream`, and writes the output to a destination:

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { pipeline, Transform } from 'node:stream';
import hashstream from '@localnerve/csp-hashes';

const srcDir = './src/html';
const destDir = './dist/html';

// Wrap raw buffer chunks into plain file-like objects for the transform stream.
function wrapFileObject (filePath) {
  return new Transform({
    readableObjectMode: true,
    construct (callback) { callback(); },
    transform (chunk, enc, done) {
      this.push({ path: filePath, contents: chunk });
      done();
    }
  });
}

// Unwrap file-like objects back to raw buffers for writing.
function unwrapFileObject () {
  return new Transform({
    writableObjectMode: true,
    construct (callback) { callback(); },
    transform (fileObj, enc, done) {
      this.push(fileObj.contents);
      done();
    }
  });
}

async function processFile (filePath) {
  const destPath = path.join(destDir, path.relative(srcDir, filePath));
  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  await new Promise((resolve, reject) => {
    pipeline(
      fs.createReadStream(filePath),
      wrapFileObject(filePath),
      hashstream({
        algo: 'sha256',
        callback: (filePath, hashes) => {
          console.log(`Processed ${path.basename(filePath)}:`);
          console.log(`  Script hashes: ${hashes.script.all.length}`);
          console.log(`  Style hashes:  ${hashes.style.all.length}`);
        }
      }),
      unwrapFileObject(),
      fs.createWriteStream(destPath),
      (err) => err ? reject(err) : resolve()
    );
  });
}

// Process all .html files in the source directory
const htmlFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.html')).map(f => path.join(srcDir, f));
await Promise.all(htmlFiles.map(processFile));
```

### Non-ESM usage
As of Version 2, this package is an ES Module, making it incompatible with `require`. To use outside of ESM, you can use this with a dynamic import as in the following example:

```javascript
import('@localnerve/csp-hashes').then(({ hashstream }) => {
  hashstream({
    callback: (p, hashes, contents) => {
      // do stuff
    }
  });
});
```

## LICENSE

* [MIT, Alex Grant, LocalNerve, LLC](license.md)

## Author

* Alex Grant, alex@localnerve.com, https://localnerve.com
