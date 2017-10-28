module.exports = {
  env: {
    browser: true,
    es6: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 8
  },
  globals: {

  },
  rules: {
    'arrow-spacing': ['error', {
      before: true,
      after: true
    }],
    'arrow-body-style': ['error', 'as-needed'],
    'comma-spacing': ['error', {
      before: false,
      after: true
    }],
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    semi: ['error', 'always'],
    'no-console': 'off',
    'keyword-spacing': ['warn', {
      before: true,
      after: true
    }],
    'func-call-spacing': ['error', 'never'],
    // 'brace-style': ['warn', '1tbs']
    'space-before-blocks': ['warn', 'always']
  }
}
