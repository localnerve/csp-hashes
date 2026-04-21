/**
 * Test entry
 * 
 * Copyright (c) 2022-2025 Alex Grant (@localnerve), LocalNerve LLC
 * Licensed under the MIT license.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import Vinyl from 'vinyl';
import hashstream from '../lib/index.js';

function fixtures (glob) {
  return path.join(import.meta.dirname, 'fixtures', glob);
}

function parseHashFixture (fixtureFilename) {
  const result = {
    elements: [],
    attributes: [],
    get all () {
      return this.elements.concat(this.attributes);
    }
  };

  try {
    const re = /#\s*element hashes\s*(?<elements>[^#]+)#\s*attribute hashes\s*(?<attributes>[^#]+)\s*/im;
    const m = fs.readFileSync(fixtureFilename, { encoding: 'utf8' }).match(re);
    const elements = m?.groups?.elements;
    const attributes = m?.groups?.attributes;
    if (elements) {
      result.elements.push(...elements.replace(/\s+/g, ' ').split(/\s+/).filter(h => h.length > 0));
    }
    if (attributes) {
      result.attributes.push(...attributes.replace(/\s+/g, ' ').split(/\s+/).filter(h => h.length > 0));
    }
  }
  catch (e) {
    if (e.code != 'ENOENT' && e.message.test(/none\./)) { // ENOENT none.algo is expected
      console.warn('parseHashFixture threw error', e.message);
    }
  }

  return result;
}

function onStreamFinish (expectedHashes, actualHashes, done) {
  Object.keys(expectedHashes).forEach(what => {
    assert.strictEqual(actualHashes[what].all.join(' '), expectedHashes[what].all.join(' '));
    Object.keys(expectedHashes[what]).forEach(which => {
      assert.strictEqual(actualHashes[what][which].length, expectedHashes[what][which].length);
      for (let i = 0; i < expectedHashes[what][which].length; ++i) {
        assert.strictEqual(actualHashes[what][which][i], expectedHashes[what][which][i]);
      }
    });
  });
  done();
}

function run (name, algo, replace, {
  hashFixtureScript = 'none',
  hashFixtureStyle = 'none'
} = {}) {
  const srcFile = new Vinyl({
    path: fixtures(`${name}.html`),
    cwd: 'test/',
    base: fixtures(''),
    contents: fs.readFileSync(fixtures(`${name}.html`))
  });

  const scriptFixture = fixtures(`${hashFixtureScript}.${algo}`);
  const styleFixture = fixtures(`${hashFixtureStyle}.${algo}`);
  const expectedHashes = {
    script: parseHashFixture(scriptFixture),
    style: parseHashFixture(styleFixture)
  };
  const actualHashes = {
    script: {
      elements: [],
      attributes: []
    },
    style: {
      elements: [],
      attributes: []
    }
  };
  
  return new Promise((resolve, reject) => {
    const stream = hashstream({
      algo,
      replace,
      callback: (path, hashes, contents) => {
        assert.strictEqual(path, fixtures(`${name}.html`));
        if (replace) {
          assert.strictEqual(contents, srcFile.contents.toString());
        }

        Object.keys(hashes).forEach(what => {
          Object.defineProperty(actualHashes[what], 'all', {
            get: Object.getOwnPropertyDescriptor(hashes[what], 'all').get
          });
          Object.keys(hashes[what]).forEach(which => {
            actualHashes[what][which].push(...hashes[what][which].map(x => x.replace(/'/g, '')));
          });
        });

        return contents;
      }
    });

    stream.on('error', reject);
    stream.on('finish', onStreamFinish.bind(null, expectedHashes, actualHashes, resolve));

    stream.write(srcFile);
    stream.end();
  });
}

describe('should hash scripts correctly', () => {
  const name = 'single-script';
  const hashFixtureScript = name;
  it('#sha256', () => run(name, 'sha256', false, { hashFixtureScript }));
  it('#sha384', () => run(name, 'sha384', false, { hashFixtureScript }));
  it('#sha512', () => run(name, 'sha512', false, { hashFixtureScript }));
});

describe('should hash styles correctly', () => {
  const name = 'single-style';
  const hashFixtureStyle = name;
  it('#sha256', () => run(name, 'sha256', false, { hashFixtureStyle }));
  it('#sha384', () => run(name, 'sha384', false, { hashFixtureStyle }));
  it('#sha512', () => run(name, 'sha512', false, { hashFixtureStyle }));
});

describe('should hash multiple script tags', () => {
  const name = 'multiple-scripts';
  const hashFixtureScript = name;
  it('#sha256', () => run(name, 'sha256', false, { hashFixtureScript }));
  it('#sha384', () => run(name, 'sha384', false, { hashFixtureScript }));
  it('#sha512', () => run(name, 'sha512', false, { hashFixtureScript }));
});

describe('should hash multiple style tags', () => {
  const name = 'multiple-style';
  const hashFixtureStyle = name;
  it('#sha256', () => run(name, 'sha256', false, { hashFixtureStyle }));
  it('#sha384', () => run(name, 'sha384', false, { hashFixtureStyle }));
  it('#sha512', () => run(name, 'sha512', false, { hashFixtureStyle }));
});

describe('should ignore scripts with src attribute', () => {
  const name = 'script-src';
  const hashFixtureScript = name;
  it('#sha256', () => run(name, 'sha256', false, { hashFixtureScript }));
  it('#sha384', () => run(name, 'sha384', false, { hashFixtureScript }));
  it('#sha512', () => run(name, 'sha512', false, { hashFixtureScript }));
});

describe('should handle bad options', () => {
  it('should throw an exception on invalid algo', () => {
    assert.throws(() => hashstream({ algo: 'invalid' }));
  });

  it('should throw an exception on invalid callbacks', () => {
    assert.throws(() => hashstream({}));
    assert.throws(() => hashstream());
    assert.throws(() => hashstream({ callback: false }));
  });
});

describe('should hash multiple script tags and attributes', () => {
  const name = 'multiple-scripts-attr';
  const hashFixtureScript = name;
  it('#sha256', () => run(name, 'sha256', false, { hashFixtureScript }));
  it('#sha384', () => run(name, 'sha384', false, { hashFixtureScript }));
  it('#sha512', () => run(name, 'sha512', false, { hashFixtureScript }));
});

describe('should hash multiple style tags and attributes', () => {
  const name = 'multiple-style-attr';
  const hashFixtureStyle = name;
  it('#sha256', () => run(name, 'sha256', false, { hashFixtureStyle }));
  it('#sha384', () => run(name, 'sha384', false, { hashFixtureStyle }));
  it('#sha512', () => run(name, 'sha512', false, { hashFixtureStyle }));
});

describe('should hash multiple style tags and attributes (REPLACE OPTION)', () => {
  const name = 'multiple-style-attr';
  const hashFixtureStyle = name;
  it('#sha256', () => run(name, 'sha256', true, { hashFixtureStyle }));
  it('#sha384', () => run(name, 'sha384', true, { hashFixtureStyle }));
  it('#sha512', () => run(name, 'sha512', true, { hashFixtureStyle }));
});

describe('should hash multiple scripts and styles, elements and attributes', () => {
  const name = 'multiple-scripts-styles';
  const hashFixtureScript = `${name}-script`;
  const hashFixtureStyle = `${name}-style`;
  it('#sha256', () => run (name, 'sha256', false, { hashFixtureScript, hashFixtureStyle }));
  it('#sha384', () => run (name, 'sha384', false, { hashFixtureScript, hashFixtureStyle }));
  it('#sha512', () => run (name, 'sha512', false, { hashFixtureScript, hashFixtureStyle }));
});
