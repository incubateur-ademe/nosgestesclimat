module.exports = {
  root: true,
  env: { node: true, commonjs: true, browser: true, es2020: true },
  extends: 'eslint:recommended',
  ignorePatterns: ['dist', '.eslintrc.js'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  }
}
