module.exports = {
  "env": {
    "browser": true,
    "es6": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/eslint-recommended"
  ],
  "globals": {
    "Atomics": "readonly",
    "SharedArrayBuffer": "readonly"
  },
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 2018,
    "sourceType": "module"
  },
  "plugins": [
    "react",
    "@typescript-eslint"
  ],
  "rules": {
    "array-bracket-newline": [
      "error",
      { multiline: true }
    ],
    "array-bracket-spacing": [
      "error",
      "always"
    ],
    "eslint block-spacing": "error",
    "arrow-parens": [2, "as-needed", { "requireForBlockBody": true }],
    "indent": [
      "error",
      2
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "object-curly-spacing": [
      "error",
      "never",
      { "arraysInObjects": true, "objectsInObjects": true }
    ],
    "quotes": [
      "error",
      "double"
    ],
    "semi": [
      "error",
      "always"
    ]
  }
};