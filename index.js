/**
 * CSP Hashes.
 * 
 * Return a Transform object stream to process Vinyl or plain file-like
 * objects for generating the required CSP hashes for inline and attribute
 * scripts, styles.
 * 
 * Copyright (c) 2022-2025 Alex Grant (@localnerve), LocalNerve LLC
 * Licensed under the MIT license.
 */
export { hashstream as default, hashstream, removeCspMeta, createCspHash, cspHashes } from './lib/index.js';