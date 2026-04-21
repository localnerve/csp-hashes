/**
 * Test removeCspMeta function.
 * 
 * Copyright (c) 2022-2025 Alex Grant (@localnerve), LocalNerve LLC
 * Licensed under the MIT license.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Transform } from 'node:stream';
import path from 'node:path';
import fs from 'node:fs';
import Vinyl from 'vinyl';
import { removeCspMeta } from '../lib/removeCspMeta.js';

describe('removeCspMeta', () => {
  describe('API', () => {
    it('should return a Tranform Stream', () => {
      const stream = removeCspMeta();
      assert.ok(stream instanceof Transform);
    });
  });
  describe('Stream', () => {
    it('should handle a bad input object', () => {
      return new Promise(resolve => {
        const stream = removeCspMeta();
        stream.on('error', e => {
          assert.ok(e instanceof Error);
          assert.ok('errorCode' in e);
          assert.strictEqual(e.errorCode, 'EBADINPUT');
          resolve();
        });
        stream.write({
          whatami: 'imanunexpectedobject'
        });
      });
    });
    it ('should remove CSP content', () => {
      const fixtureBase = path.join(import.meta.dirname, 'fixtures');
      const fixturePath = path.join(fixtureBase, 'csp-meta.html');
      const srcFile = new Vinyl({
        path: fixturePath,
        cwd: 'test/',
        base: fixtureBase,
        contents: fs.readFileSync(fixturePath)
      });

      return new Promise(resolve => {
        const stream = removeCspMeta();
        stream.on('finish', () => {
          const string = srcFile.contents.toString();
          const m = string.match(
            /"?Content-Security-Policy"?\s+content="(?<content>[^"]*)"/i
          );
          const content = m?.groups?.content;
          assert.ok(content);
          assert.ok(!content.trim());
          resolve();
        });
        stream.write(srcFile);
        stream.end();
      });
    });
  });
});