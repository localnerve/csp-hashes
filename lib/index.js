/**
 * CSP Hashes.
 * 
 * Return a Vinyl transform object stream to process html files for
 * generating the required CSP hashes for inline and attribute scripts, styles.
 * 
 * Copyright (c) 2022-2025 Alex Grant (@localnerve), LocalNerve LLC
 * Licensed under the MIT license.
 */
import { Transform } from 'node:stream';
import crypto from 'node:crypto';
import * as cheerio from 'cheerio';
export { removeCspMeta } from './removeCspMeta.js';

/**
 * Collect all CSP Hashes and fill the given `hashes` structure.
 *
 * @param {Function} hashFn - Creates and formats a csp hash
 * @param {Buffer} html - The html content
 * @param {Object} hashes - The hash structure to fill
 */
function collectHashes (hashFn, html, hashes) {
  const $ = cheerio.load(html);

  Object.keys(hashes).forEach(what => {
    hashes[what].elements = $(`${what}:not([src])`).map(
      (i, el) => hashFn($(el).html())
    ).toArray();
  });

  hashes.style.attributes.push(
    ...$('[style]').map((i, el) => hashFn($(el).attr('style'))).toArray()
  );

  const eventHandlerRe = /^on/i;
  const jsUrlRe = /^javascript:/i;

  $('*').each(function (i, el) {
    for (const attrName in el.attribs) {
      if (eventHandlerRe.test(attrName)) {
        hashes.script.attributes.push(
          hashFn(el.attribs[attrName])
        );
      }
      if (jsUrlRe.test(el.attribs[attrName])) {
        hashes.script.attributes.push(
          hashFn(el.attribs[attrName].split(jsUrlRe)[1])
        );
      }
    }
  });
}

/**
 * Makes a CSP hash string for the given input and algorithm.
 * 
 * @param {String} algo - The hash algorithm to use.
 * @param {String} input - A string of text to generate a hash for.
 * @returns {String} The hash value of the given input.
 */
function makeCspHash (algo, input) {
  const createHash = r => crypto.createHash(algo).update(r).digest('base64');
  const formatHash = h => `'${algo}-${h}'`;
  return formatHash(createHash(input));
}
/**
 * Makes a CSP hash string for the given input and algorithm.
 *
 * @param {String} input - A string of text to generate a hash for.
 * @param {String} [algo] - hash algorithm, default sha256. Can be sha384, sha512.
 * @returns 
 */
export function createCspHash(input, algo = 'sha256') {
  return makeCspHash(algo, input);
}

/**
 * hashstream
 * Accepts the processing options and returns the Vinyl transform object stream.
 *
 * @param {Object} options
 * @param {Function} options.callback - Function to call to process the csp hashes.
 * @param {String} [options.algo] - hash algorithm, default sha256. Can be sha384, sha512.
 * @param {Boolean} [options.replace] - True if callback is used for meta html replacements, defaults to false.
 * @returns Transform object stream to process Vinyl objects.
 */
export function hashstream ({
  algo = 'sha256',
  replace = false,
  callback = null
} = {}) {

  if (!/^sha(256|384|512)$/.test(algo)) {
    throw new Error('algo option must be one of "sha256", "sha384", or "sha512" only.');
  }

  if (typeof callback !== 'function') {
    throw new Error('callback option must be a valid function.');
  }

  const transformObjectStream = new Transform({
    objectMode: true,
    transform: (vinyl, enc, done) => {
      const path = vinyl.path;
      const content = vinyl.contents;
  
      const hashes = {
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
      };
  
      collectHashes(makeCspHash.bind(null, algo), content, hashes);
  
      if (replace) {
        const s = callback(path, hashes, content.toString());
        vinyl.contents = Buffer.from(s, enc);
      } else {
        callback(path, hashes);
      }
  
      done(null, vinyl);
    }
  });

  return transformObjectStream;
}

export { hashstream as default }