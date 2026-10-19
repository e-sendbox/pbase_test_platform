/* Frontend lint config: ESLint 4.x (compatible with react-scripts 1.x prod build). */
module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    jest: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:react/recommended"],
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 2018,
    sourceType: "module",
  },
  settings: { react: { version: "16.14" } },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/no-deprecated": "off",
    "no-case-declarations": "off",
    "no-unused-vars": "off",
    "no-console": "off",
  },
};
