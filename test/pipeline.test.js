/**
 * Pipeline tests using native Node.js streams and plain file-like objects.
 * 
 * Copyright (c) 2022-2025 Alex Grant (@localnerve), LocalNerve LLC
 * Licensed under the MIT license.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { pipeline, Transform } from 'node:stream';
import hashstream from '../lib/index.js';

function fixtures (glob) {
  return path.join(import.meta.dirname, 'fixtures', glob);
}

/**
 * Wrap raw buffer chunks into plain file-like objects for the transform stream.
 */
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

/**
 * Unwrap file-like objects back to raw buffers for writing.
 */
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

/**
 * Run a pipeline test: read fixture -> wrap in file object -> hashstream -> unwrap -> write to temp.
 */
function runPipeline (name, algo, replace) {
  const srcPath = fixtures(`${name}.html`);

  return new Promise((resolve, reject) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'csp-hashes-test-'));
    const destPath = path.join(tmpDir, `${name}.html`);

    const collectedHashes = {
      script: { elements: [], attributes: [] },
      style: { elements: [], attributes: [] }
    };

    pipeline(
      fs.createReadStream(srcPath),
      wrapFileObject(srcPath),
      hashstream({
        algo,
        replace,
        callback: (filePath, hashes, contents) => {
          assert.strictEqual(filePath, srcPath);

          Object.keys(hashes).forEach(what => {
            Object.defineProperty(collectedHashes[what], 'all', {
              get: Object.getOwnPropertyDescriptor(hashes[what], 'all').get
            });
            Object.keys(hashes[what]).forEach(which => {
              collectedHashes[what][which].push(...hashes[what][which].map(x => x.replace(/'/g, '')));
            });
          });

          if (replace) {
            return contents;
          }
        }
      }),
      unwrapFileObject(),
      fs.createWriteStream(destPath),
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        try {
          // Verify the output file was written and matches input (when not replacing)
          const output = fs.readFileSync(destPath);
          const input = fs.readFileSync(srcPath);
          assert.strictEqual(output.toString(), input.toString());

          // Cleanup temp dir
          fs.rmSync(tmpDir, { recursive: true, force: true });
          resolve(collectedHashes);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

/**
 * Compare collected hashes against expected fixture values.
 */
function assertHashesEqual (expectedPath, actual, what = 'script') {
  const re = /#\s*element hashes\s*(?<elements>[^#]+)#\s*attribute hashes\s*(?<attributes>[^#]+)\s*/im;
  const content = fs.readFileSync(expectedPath, { encoding: 'utf8' });
  const m = content.match(re);

  if (!m) return; // No expected hashes (none fixture)

  const expectedElements = m.groups.elements.replace(/\s+/g, ' ').split(/\s+/).filter(h => h.length > 0);
  const expectedAttributes = m.groups.attributes.replace(/\s+/g, ' ').split(/\s+/).filter(h => h.length > 0);

  assert.strictEqual(actual[what].elements.join(' '), expectedElements.join(' '));
  assert.strictEqual(actual[what].attributes.join(' '), expectedAttributes.join(' '));
}

describe('pipeline with plain file objects', () => {
  describe('should hash scripts correctly via pipeline', () => {
    const name = 'single-script';
    it('#sha256', async () => {
      const actual = await runPipeline(name, 'sha256', false);
      assertHashesEqual(fixtures(`${name}.sha256`), actual);
    });
    it('#sha384', async () => {
      const actual = await runPipeline(name, 'sha384', false);
      assertHashesEqual(fixtures(`${name}.sha384`), actual);
    });
    it('#sha512', async () => {
      const actual = await runPipeline(name, 'sha512', false);
      assertHashesEqual(fixtures(`${name}.sha512`), actual);
    });
  });

  describe('should hash styles correctly via pipeline', () => {
    const name = 'single-style';
    it('#sha256', async () => {
      const actual = await runPipeline(name, 'sha256', false);
      assertHashesEqual(fixtures(`${name}.sha256`), actual, 'style');
    });
    it('#sha384', async () => {
      const actual = await runPipeline(name, 'sha384', false);
      assertHashesEqual(fixtures(`${name}.sha384`), actual, 'style');
    });
    it('#sha512', async () => {
      const actual = await runPipeline(name, 'sha512', false);
      assertHashesEqual(fixtures(`${name}.sha512`), actual, 'style');
    });
  });

  describe('should hash multiple scripts and styles via pipeline', () => {
    const name = 'multiple-scripts-styles';
    it('#sha256', async () => {
      const actual = await runPipeline(name, 'sha256', false);
      assertHashesEqual(fixtures(`${name}-script.sha256`), actual);
    });
  });

  describe('should handle replace option via pipeline', () => {
    const name = 'multiple-style-attr';
    it('#sha256 with replace', async () => {
      const actual = await runPipeline(name, 'sha256', true);
      assertHashesEqual(fixtures(`${name}.sha256`), actual, 'style');
    });
  });

  describe('should process multiple files via pipeline', () => {
    it('should process several html files in sequence', async () => {
      const tests = [
        { name: 'single-script', what: 'script' },
        { name: 'single-style', what: 'style' }
      ];
      const results = await Promise.all(
        tests.map(t => runPipeline(t.name, 'sha256', false))
      );

      assert.strictEqual(results.length, 2);
      results.forEach((actual, i) => {
        const { name, what } = tests[i];
        assertHashesEqual(fixtures(`${name}.sha256`), actual, what);
      });
    });
  });
});
