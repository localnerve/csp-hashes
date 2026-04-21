import js from '@eslint/js';
import globals from 'globals';
import nodePlugin from 'eslint-plugin-n';

export default [{
  name: 'global',
  ignores: [
    '__tests__/lib/**',
    'coverage/**',
    'dist/**',
    'private/**',
    'tmp/**'
  ]
}, nodePlugin.configs['flat/recommended'], {
  name: 'lib_and_tests',
  files: ['**/*.js'],
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
