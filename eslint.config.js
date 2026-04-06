export default [
  {
    ignores: ['dist', 'node_modules', '*.config.ts', '*.config.js'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off',
      'react/jsx-key': 'warn',
    },
  },
];
