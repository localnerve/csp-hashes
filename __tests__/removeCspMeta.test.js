/**
 * Test removeCspMeta function.
 * 
 * Copyright (c) 2022-2023 Alex Grant (@localnerve), LocalNerve LLC
 * Licensed under the MIT license.
 */
/* eslint-env jest */
import { Transform } from 'stream';
import path from 'path';
import fs from 'fs';
import Vinyl from 'vinyl';
import { removeCspMeta } from './lib/removeCspMeta';

describe('removeCspMeta', () => {
  describe('API', () => {
    it('should return a Tranform Stream', done => {
      const stream = removeCspMeta();
      expect(stream).toBeInstanceOf(Transform);
      done();
    });
  });
  describe('Stream', () => {
    it('should handle a bad input object', done => {
      const stream = removeCspMeta();
      stream.on('error', e => {
        expect(e).toBeInstanceOf(Error);
        expect(e.errorCode).toBeDefined();
        expect(e.errorCode).toEqual('EBADINPUT');
        done();
      });
      stream.write({
        whatami: 'imanunexpectedobject'
      });
    });
    it ('should remove CSP content', done => {
      const fixtureBase = path.join(__dirname, 'fixtures');
      const fixturePath = path.join(fixtureBase, 'csp-meta.html');
      const srcFile = new Vinyl({
        path: fixturePath,
        cwd: 'test/',
        base: fixtureBase,
        contents: fs.readFileSync(fixturePath)
      });
      const stream = removeCspMeta();

      stream.on('finish', () => {
        const string = srcFile.contents.toString();
        const m = string.match(
          /"?Content-Security-Policy"?\s+content="(?<content>[^"]*)"/i
        );
        const content = m?.groups?.content;
        expect(content).toBeDefined();
        expect(content.trim()).toBeFalsy();
        done();
      });
      stream.write(srcFile);
      stream.end();
    });
  });
});