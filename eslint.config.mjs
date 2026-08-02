import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'

// Replaces the old .eslintrc.js + eslint-config-react-app setup. That preset is
// unmaintained (CRA is archived) and pinned eslint to 7, which blocked the
// React 19 upgrade.
export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      '.vercel/**',
      'coverage/**',
      '.cache/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.flat.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      'jsx-a11y/anchor-is-valid': 'off',

      // Types are the contract in this repo, propTypes were never used
      'react/prop-types': 'off',
      // Everything is forwardRef/HOC-wrapped, the inferred names are fine
      'react/display-name': 'off',
      // Prose in the docs site, not worth escaping
      'react/no-unescaped-entities': 'off',

      // This codebase predates strict typing conventions and runs with
      // `strict: false`; these would be a rewrite, not a lint pass.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-unused-vars': 'off',

      // Both are new in eslint-plugin-react-hooks v7 and both fire on load-bearing
      // design decisions here rather than on mistakes:
      //   refs               - the sheet deliberately mirrors state into refs so the
      //                        spring services and drag handler, which run outside
      //                        the render loop, read current values (see CLAUDE.md).
      //   set-state-in-effect - measurement hooks (useReady, useSnapPoints) can only
      //                        set state after the DOM has been measured.
      // Worth revisiting if this ever adopts the React Compiler.
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',

      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // The backdrop is a pointer-target for the drag gesture, not a control. The
    // dialog itself carries the a11y semantics (role, aria-modal, focus trap) and
    // Escape/close is handled on the overlay.
    files: ['src/BottomSheet.tsx'],
    rules: {
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
    },
  },
  {
    // Config files are CommonJS
    files: ['*.config.js', 'config/**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  }
)
