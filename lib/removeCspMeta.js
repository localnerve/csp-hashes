/**
 * removeCspMeta.js
 * 
 * A convenience method to remove the content of a Content-Security-Policy in a meta tag.
 * Useful for development builds that need to ignore CSP meta tags.
 * 
 * Copyright (c) 2022-2023 Alex Grant (@localnerve), LocalNerve LLC
 * Licensed under the MIT license.
 */
import { Transform } from 'stream';

export function removeCspMeta () {
  return new Transform({
    objectMode: true,
    transform: (vinyl, enc, done) => {
      let e = null;
      const input = vinyl?.contents?.toString();
      if (input) {
        const output = input.replace(
          /("?Content-Security-Policy"?)(\s+)(content=")([^"]+)"/i, '$1$2$3$2"'
        );
        vinyl.contents = Buffer.from(output, enc);
      } else {
        e = new Error('removeCspMeta could not get Vinyl object file contents');
        e.errorCode = 'EBADINPUT';
      }
      done(e, vinyl);
    }
  });
}

export { removeCspMeta as default }