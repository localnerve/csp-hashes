import js from '@eslint/js';
import globals from 'globals';
import jest from 'eslint-plugin-jest';

export default [{
  name: 'global',
  ignores: [
    '__tests__/lib/**',
    'coverage/**',
    'dist/**',
    'private/**',
    'tmp/**'
  ]
}, {
  name: 'tests',
  files: ['__tests__/**'],
  ...jest.configs['flat/recommended'],
  rules: {
    ...jest.configs['flat/recommended'].rules,
    'jest/no-done-callback': 'off',
    'jest/expect-expect': 'off'
  }
}, {
  name: 'lib',
  files: ['lib/**'],
  languageOptions: {
    globals: {
      ...globals.node
    }
  },
  rules: {
    ...js.configs.recommended.rules,
    indent: [2, 2, {
      SwitchCase: 1,
      MemberExpression: 1
    }],
    quotes: [2, 'single'],
    'dot-notation': [2, {allowKeywords: true}]
  }
}];
