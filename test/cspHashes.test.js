/**
 * Test cspHashes function
 * 
 * Copyright (c) 2022-2025 Alex Grant (@localnerve), LocalNerve LLC
 * Licensed under the MIT license.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { cspHashes } from '../lib/index.js';

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

function run (name, algo, {
  hashFixtureScript = 'none',
  hashFixtureStyle = 'none'
} = {}) {
  const content = fs.readFileSync(fixtures(`${name}.html`));

  const scriptFixture = fixtures(`${hashFixtureScript}.${algo}`);
  const styleFixture = fixtures(`${hashFixtureStyle}.${algo}`);
  const expectedHashes = {
    script: parseHashFixture(scriptFixture),
    style: parseHashFixture(styleFixture)
  };

  const actualHashes = cspHashes(algo, content);

  Object.keys(expectedHashes).forEach(what => {
    // Strip quotes from actual hashes for comparison with fixture files (which don't have quotes)
    const actualAll = actualHashes[what].all.map(h => h.replace(/'/g, ''));
    assert.strictEqual(actualAll.join(' '), expectedHashes[what].all.join(' '));
    Object.keys(expectedHashes[what]).forEach(which => {
      if (which === 'all') return;
      const actualWhich = actualHashes[what][which].map(h => h.replace(/'/g, ''));
      assert.strictEqual(actualWhich.length, expectedHashes[what][which].length);
      for (let i = 0; i < expectedHashes[what][which].length; ++i) {
        assert.strictEqual(actualWhich[i], expectedHashes[what][which][i]);
      }
    });
  });
}

describe('cspHashes should hash scripts correctly', () => {
  const name = 'single-script';
  const hashFixtureScript = name;
  it('#sha256', () => run(name, 'sha256', { hashFixtureScript }));
  it('#sha384', () => run(name, 'sha384', { hashFixtureScript }));
  it('#sha512', () => run(name, 'sha512', { hashFixtureScript }));
});

describe('cspHashes should hash styles correctly', () => {
  const name = 'single-style';
  const hashFixtureStyle = name;
  it('#sha256', () => run(name, 'sha256', { hashFixtureStyle }));
  it('#sha384', () => run(name, 'sha384', { hashFixtureStyle }));
  it('#sha512', () => run(name, 'sha512', { hashFixtureStyle }));
});

describe('cspHashes should hash multiple script tags', () => {
  const name = 'multiple-scripts';
  const hashFixtureScript = name;
  it('#sha256', () => run(name, 'sha256', { hashFixtureScript }));
  it('#sha384', () => run(name, 'sha384', { hashFixtureScript }));
  it('#sha512', () => run(name, 'sha512', { hashFixtureScript }));
});

describe('cspHashes should hash multiple style tags', () => {
  const name = 'multiple-style';
  const hashFixtureStyle = name;
  it('#sha256', () => run(name, 'sha256', { hashFixtureStyle }));
  it('#sha384', () => run(name, 'sha384', { hashFixtureStyle }));
  it('#sha512', () => run(name, 'sha512', { hashFixtureStyle }));
});

describe('cspHashes should ignore scripts with src attribute', () => {
  const name = 'script-src';
  const hashFixtureScript = name;
  it('#sha256', () => run(name, 'sha256', { hashFixtureScript }));
  it('#sha384', () => run(name, 'sha384', { hashFixtureScript }));
  it('#sha512', () => run(name, 'sha512', { hashFixtureScript }));
});

describe('cspHashes should handle bad options', () => {
  it('should throw an exception on invalid algo', () => {
    assert.throws(() => cspHashes('invalid', '<script>alert(1)</script>'));
  });
});

describe('cspHashes should hash multiple script tags and attributes', () => {
  const name = 'multiple-scripts-attr';
  const hashFixtureScript = name;
  it('#sha256', () => run(name, 'sha256', { hashFixtureScript }));
  it('#sha384', () => run(name, 'sha384', { hashFixtureScript }));
  it('#sha512', () => run(name, 'sha512', { hashFixtureScript }));
});

describe('cspHashes should hash multiple style tags and attributes', () => {
  const name = 'multiple-style-attr';
  const hashFixtureStyle = name;
  it('#sha256', () => run(name, 'sha256', { hashFixtureStyle }));
  it('#sha384', () => run(name, 'sha384', { hashFixtureStyle }));
  it('#sha512', () => run(name, 'sha512', { hashFixtureStyle }));
});

describe('cspHashes should hash multiple scripts and styles, elements and attributes', () => {
  const name = 'multiple-scripts-styles';
  const hashFixtureScript = `${name}-script`;
  const hashFixtureStyle = `${name}-style`;
  it('#sha256', () => run(name, 'sha256', { hashFixtureScript, hashFixtureStyle }));
  it('#sha384', () => run(name, 'sha384', { hashFixtureScript, hashFixtureStyle }));
  it('#sha512', () => run(name, 'sha512', { hashFixtureScript, hashFixtureStyle }));
});

describe('cspHashes should work with string content', () => {
  it('should accept a string instead of Buffer', () => {
    const html = '<script>alert(\'world\')</script>';
    const hashes = cspHashes('sha256', html);
    assert.strictEqual(hashes.script.elements.length, 1);
    assert.ok(hashes.script.elements[0].startsWith('\'' + 'sha256-'));
  });
});

describe('cspHashes should return correct structure', () => {
  it('should have script and style properties with elements, attributes, and all getter', () => {
    const hashes = cspHashes('sha256', '<div></div>');
    assert.ok(hashes.script);
    assert.ok(hashes.style);
    assert.strictEqual(Array.isArray(hashes.script.elements), true);
    assert.strictEqual(Array.isArray(hashes.script.attributes), true);
    assert.strictEqual(Array.isArray(hashes.style.elements), true);
    assert.strictEqual(Array.isArray(hashes.style.attributes), true);
    // `all` is a getter property that returns an array
    assert.ok('all' in hashes.script);
    assert.ok('all' in hashes.style);
    assert.strictEqual(Array.isArray(hashes.script.all), true);
    assert.strictEqual(Array.isArray(hashes.style.all), true);
  });

  it('should have empty arrays for content with no scripts or styles', () => {
    const hashes = cspHashes('sha256', '<div>no inline scripts</div>');
    assert.strictEqual(hashes.script.elements.length, 0);
    assert.strictEqual(hashes.script.attributes.length, 0);
    assert.strictEqual(hashes.style.elements.length, 0);
    assert.strictEqual(hashes.style.attributes.length, 0);
  });
});

describe('cspHashes should use default algo when not specified', () => {
  it('should default to sha256', () => {
    const html = '<script>alert(1)</script>';
    const hashesDefault = cspHashes(undefined, html);
    const hashesExplicit = cspHashes('sha256', html);
    assert.strictEqual(hashesDefault.script.elements[0], hashesExplicit.script.elements[0]);
  });
});
