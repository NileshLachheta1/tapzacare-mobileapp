module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'no-void': ['error', { allowAsStatement: true }],
    'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
  },
  overrides: [{ files: ['jest.setup.js'], env: { jest: true } }],
};
