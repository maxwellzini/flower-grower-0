import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.d.ts'],
  },
  tseslint.configs.recommended,
  {
    files: ['packages/core/**/*.ts', 'packages/species/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'three',
              message: 'Importing three.js in core or species is strictly prohibited.',
            },
            {
              name: '@flower-grower/three',
              message:
                'Importing three package in core or species is strictly prohibited.',
            },
            {
              name: '@flower-grower/dom',
              message: 'Importing DOM package in core or species is strictly prohibited.',
            },
            {
              name: '@flower-grower/element',
              message:
                'Importing element package in core or species is strictly prohibited.',
            },
          ],
          patterns: [
            {
              group: [
                'three/*',
                '@flower-grower/three/*',
                '@flower-grower/dom/*',
                '@flower-grower/element/*',
              ],
              message:
                'Importing Three.js or DOM packages in core or species is strictly prohibited.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/core/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Math.random is prohibited in core. Use seeded RNG instead.',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'Date.now is prohibited in core. Pure time input required.',
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'window',
          message: 'DOM window object is prohibited in core.',
        },
        {
          name: 'document',
          message: 'DOM document object is prohibited in core.',
        },
      ],
    },
  },
);
