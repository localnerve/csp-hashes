/**
 * Test entry
 * 
 * Copyright (c) 2022-2024 Alex Grant (@localnerve), LocalNerve LLC
 * Licensed under the MIT license.
 */
/* eslint-env jest */
import * as path from 'path';
import * as fs from 'fs/promises';
import { createCspHash } from './lib';

async function run (algo) {
  const fixtureBase = path.join(__dirname, 'fixtures');
  const fixturePath = path.join(fixtureBase, `create-csp-hash.${algo || 'sha256'}`);
  const data = await fs.readFile(fixturePath, { encoding: 'utf8' });
  const [inputText, inputHash] = data.split(',');
  const outputHash = createCspHash(inputText, algo);
  expect(outputHash).toEqual(`'${inputHash}'`);
}

describe('createCSPHash', () => {
  it('should run sha256 by default', () => run());
  it('should run sha256', () => run('sha256'));
  it('should run sha384', () => run('sha384'));
  it('should run sha512', () => run('sha512'));
});