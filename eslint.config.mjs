import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'docs/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.ts'],
  })),
  {
    files: ['**/*.ts'],
    rules: {
      // Prismic field helpers deliberately accept loosely-shaped CMS and fallback data.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  ...eslintPluginAstro.configs['flat/recommended'],
  {
    // Client-side <script> blocks inside .astro files
    files: ['**/*.astro/*.js', '**/*.astro/*.ts'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    // Cloudflare Worker: runs on the service-worker style runtime (fetch, Response, caches...)
    files: ['scripts/cloudflare-worker.js'],
    languageOptions: {
      globals: { ...globals.serviceworker },
    },
  },
  {
    // Node ESM scripts
    files: ['scripts/**/*.mjs', 'src/data/*.mjs', '*.mjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];
