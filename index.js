/**
 * CSP Hashes.
 * 
 * Return a Vinyl transform object stream to process html files for
 * generating the required CSP hashes for inline and attribute scripts, styles.
 * 
 * Copyright (c) 2022-2024 Alex Grant (@localnerve), LocalNerve LLC
 * Licensed under the MIT license.
 */
/* eslint-env node */
export { hashstream as default, hashstream, removeCspMeta, createCspHash } from './lib/index.js';