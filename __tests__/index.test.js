/**
 * Test entry
 */
/* eslint-env jest */
const path = require('path');
const fs = require('fs');
const hashstream = require('./lib').default;
const Vinyl = require('vinyl');

require('@babel/register');

function fixtures (glob) {
  return path.join(__dirname, 'fixtures', glob);
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
  catch (e) { /* ignore */ }

  return result;
}

function onStreamError (err) {
  throw new Error(err.message);
}

function onStreamFinish (expectedHashes, actualHashes, done) {
  Object.keys(expectedHashes).forEach(what => {
    expect(actualHashes[what].all.join(' ')).toEqual(expectedHashes[what].all.join(' '));
    Object.keys(expectedHashes[what]).forEach(which => {
      expect(actualHashes[what][which].length).toEqual(expectedHashes[what][which].length);
      for (let i = 0; i < expectedHashes[what][which].length; ++i) {
        expect(actualHashes[what][which][i]).toEqual(expectedHashes[what][which][i]);
      }
    });
  });
  done();
}

function run (name, algo, replace, {
  hashFixtureScript = 'none',
  hashFixtureStyle = 'none'
} = {}, done) {
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
  
  const stream = hashstream({
    algo,
    replace,
    callback: (path, hashes, contents) => {
      expect(path).toEqual(fixtures(`${name}.html`));
      if (replace) {
        expect(contents).toEqual(srcFile.contents.toString());
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

  stream.on('error', onStreamError);
  stream.on('finish', onStreamFinish.bind(null, expectedHashes, actualHashes, done));

  stream.write(srcFile);
  stream.end();
}

describe('should hash scripts correctly', () => {
  const name = 'single-script';
  const hashFixtureScript = name;
  it('#sha256', done => { run(name, 'sha256', false, { hashFixtureScript }, done); });
  it('#sha384', done => { run(name, 'sha384', false, { hashFixtureScript }, done); });
  it('#sha512', done => { run(name, 'sha512', false, { hashFixtureScript }, done); });
});

describe('should hash styles correctly', () => {
  const name = 'single-style';
  const hashFixtureStyle = name;
  it('#sha256', done => { run(name, 'sha256', false, { hashFixtureStyle }, done); });
  it('#sha384', done => { run(name, 'sha384', false, { hashFixtureStyle }, done); });
  it('#sha512', done => { run(name, 'sha512', false, { hashFixtureStyle }, done); });
});

describe('should hash multiple script tags', () => {
  const name = 'multiple-scripts';
  const hashFixtureScript = name;
  it('#sha256', done => { run(name, 'sha256', false, { hashFixtureScript }, done); });
  it('#sha384', done => { run(name, 'sha384', false, { hashFixtureScript }, done); });
  it('#sha512', done => { run(name, 'sha512', false, { hashFixtureScript }, done); });
});

describe('should hash multiple style tags', () => {
  const name = 'multiple-style';
  const hashFixtureStyle = name;
  it('#sha256', done => { run(name, 'sha256', false, { hashFixtureStyle }, done); });
  it('#sha384', done => { run(name, 'sha384', false, { hashFixtureStyle }, done); });
  it('#sha512', done => { run(name, 'sha512', false, { hashFixtureStyle }, done); });
});

describe('should ignore scripts with src attribute', () => {
  const name = 'script-src';
  const hashFixtureScript = name;
  it('#sha256', done => { run(name, 'sha256', false, { hashFixtureScript }, done); });
  it('#sha384', done => { run(name, 'sha384', false, { hashFixtureScript }, done); });
  it('#sha512', done => { run(name, 'sha512', false, { hashFixtureScript }, done); });
});

describe('should handle bad options', () => {
  it('should throw an exception on invalid algo', () => {
    expect(() => hashstream({ algo: 'invalid' })).toThrow();
  });

  it('should throw an exception on invalid callbacks', () => {
    expect(() => hashstream({})).toThrow();
    expect(() => hashstream()).toThrow();
    expect(() => hashstream({ callback: false })).toThrow();
  });
});

describe('should hash multiple script tags and attributes', () => {
  const name = 'multiple-scripts-attr';
  const hashFixtureScript = name;
  it('#sha256', done => { run(name, 'sha256', false, { hashFixtureScript }, done); });
  it('#sha384', done => { run(name, 'sha384', false, { hashFixtureScript }, done); });
  it('#sha512', done => { run(name, 'sha512', false, { hashFixtureScript }, done); });
});

describe('should hash multiple style tags and attributes', () => {
  const name = 'multiple-style-attr';
  const hashFixtureStyle = name;
  it('#sha256', done => { run(name, 'sha256', false, { hashFixtureStyle }, done); });
  it('#sha384', done => { run(name, 'sha384', false, { hashFixtureStyle }, done); });
  it('#sha512', done => { run(name, 'sha512', false, { hashFixtureStyle }, done); });
});

describe('should hash multiple style tags and attributes (REPLACE OPTION)', () => {
  const name = 'multiple-style-attr';
  const hashFixtureStyle = name;
  it('#sha256', done => { run(name, 'sha256', true, { hashFixtureStyle }, done); });
  it('#sha384', done => { run(name, 'sha384', true, { hashFixtureStyle }, done); });
  it('#sha512', done => { run(name, 'sha512', true, { hashFixtureStyle }, done); });
});

describe('should hash multiple scripts and styles, elements and attributes', () => {
  const name = 'multiple-scripts-styles';
  const hashFixtureScript = `${name}-script`;
  const hashFixtureStyle = `${name}-style`;
  it('#sha256', done => { run (name, 'sha256', false, { hashFixtureScript, hashFixtureStyle }, done); });
  it('#sha384', done => { run (name, 'sha384', false, { hashFixtureScript, hashFixtureStyle }, done); });
  it('#sha512', done => { run (name, 'sha512', false, { hashFixtureScript, hashFixtureStyle }, done); });
});
