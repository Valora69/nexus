/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['@repo/eslint-config/next.js'],
  parserOptions: {
    project: true,
  },
  // Plain-JS config files aren't part of tsconfig — typed linting can't parse them.
  ignorePatterns: ['postcss.config.mjs'],
};
