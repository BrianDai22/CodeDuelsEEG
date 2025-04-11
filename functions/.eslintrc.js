module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:promise/recommended",
  ],
  rules: {
    // Override eslint rules here
    "no-console": "warn",
    "promise/always-return": "off",
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
}; 