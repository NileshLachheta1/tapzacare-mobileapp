module.exports = {
  preset: '@react-native/jest-preset',
  resolver: 'react-native-reanimated/jest/resolver',
  transform: { '^.+\\.[cm]?[jt]sx?$': 'babel-jest' },
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|react-native-.*|@react-native(-community)?|@react-native-async-storage|@react-navigation|lucide-react-native)/)',
  ],
};
