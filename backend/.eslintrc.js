module.exports = {
  env: {
    node: true,
    jest: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    // adjust rules to your preference
    'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
  },
};
