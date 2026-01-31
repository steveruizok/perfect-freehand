/** @type {import('lazyrepo').LazyConfig} */
export default {
  scripts: {
    // Build the library packages
    build: {
      cache: {
        inputs: [
          'src/**/*',
          'rolldown.config.mjs',
          'package.json',
          'tsconfig.json',
          'tsconfig.build.json',
        ],
        outputs: ['dist/**/*'],
      },
    },
    // Run tests
    test: {
      cache: {
        inputs: [
          'src/**/*',
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/*.spec.ts',
          '**/*.spec.tsx',
        ],
        outputs: [],
        inheritsInputFromDependencies: true,
      },
    },
    // Lint the codebase
    lint: {
      cache: {
        inputs: ['src/**/*', '.eslintrc*', 'eslint.config.*'],
        outputs: [],
      },
    },
    // Development mode - run in parallel, no caching
    start: {
      execution: 'independent',
      cache: 'none',
    },
  },
}
