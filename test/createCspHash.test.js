/**
 * Test entry
 * 
 * Copyright (c) 2022-2025 Alex Grant (@localnerve), LocalNerve LLC
 * Licensed under the MIT license.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { createCspHash } from '../lib/index.js';

async function run (algo) {
  const fixtureBase = path.join(import.meta.dirname, 'fixtures');
  const fixturePath = path.join(fixtureBase, `create-csp-hash.${algo || 'sha256'}`);
  const data = await fs.readFile(fixturePath, { encoding: 'utf8' });
  const [inputText, inputHash] = data.split(',');
  const outputHash = createCspHash(inputText, algo);
  assert.strictEqual(outputHash, `'${inputHash}'`);
}

describe('createCSPHash', () => {
  it('should run sha256 by default', () => run());
  it('should run sha256', () => run('sha256'));
  it('should run sha384', () => run('sha384'));
  it('should run sha512', () => run('sha512'));
});