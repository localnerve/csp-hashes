/**
 * Test root index.js exports
 * 
 * Copyright (c) 2022-2025 Alex Grant (@localnerve), LocalNerve LLC
 * Licensed under the MIT license.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import rootDefault, { hashstream, removeCspMeta, createCspHash, cspHashes } from '../index.js';
import libDefault from '../lib/index.js';

describe('root index.js should export all functions correctly', () => {
  it('should have the same default export as lib/index.js', () => {
    assert.strictEqual(rootDefault, hashstream);
    assert.strictEqual(rootDefault, libDefault);
  });

  it('should export hashstream function', () => {
    assert.strictEqual(typeof hashstream, 'function');
    assert.strictEqual(hashstream.name, 'hashstream');
  });

  it('should export removeCspMeta function', () => {
    assert.strictEqual(typeof removeCspMeta, 'function');
    assert.strictEqual(removeCspMeta.name, 'removeCspMeta');
  });

  it('should export createCspHash function', () => {
    assert.strictEqual(typeof createCspHash, 'function');
    assert.strictEqual(createCspHash.name, 'createCspHash');
  });

  it('should export cspHashes function', () => {
    assert.strictEqual(typeof cspHashes, 'function');
    assert.strictEqual(cspHashes.name, 'cspHashes');
  });
});

describe('root index.js exports should match lib/index.js exports', () => {
  it('hashstream should be the same function as in lib/index.js', async () => {
    const { hashstream: libHashstream } = await import('../lib/index.js');
    assert.strictEqual(hashstream, libHashstream);
  });

  it('removeCspMeta should be the same function as in lib/index.js', async () => {
    const { removeCspMeta: libRemoveCspMeta } = await import('../lib/index.js');
    assert.strictEqual(removeCspMeta, libRemoveCspMeta);
  });

  it('createCspHash should be the same function as in lib/index.js', async () => {
    const { createCspHash: libCreateCspHash } = await import('../lib/index.js');
    assert.strictEqual(createCspHash, libCreateCspHash);
  });

  it('cspHashes should be the same function as in lib/index.js', async () => {
    const { cspHashes: libcspHashes } = await import('../lib/index.js');
    assert.strictEqual(cspHashes, libcspHashes);
  });
});
