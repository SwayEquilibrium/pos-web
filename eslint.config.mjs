import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import nextjs from '@next/eslint-plugin-next'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
      '@next/next': nextjs,
    },
    rules: {
      // ================================================
      // CORE RULES
      // ================================================
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off', // Use TypeScript version
      'prefer-const': 'error',
      'no-var': 'error',
      
      // ================================================
      // TYPESCRIPT RULES
      // ================================================
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-const': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      
      // ================================================
      // REACT RULES
      // ================================================
      'react/jsx-uses-react': 'off', // Not needed in React 17+
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // Use TypeScript instead
      'react/display-name': 'off',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-danger': 'warn',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unescaped-entities': 'warn',
      'react/no-unknown-property': 'error',
      'react/no-unsafe': 'warn',
      'react/self-closing-comp': 'error',
      
      // ================================================
      // REACT HOOKS RULES
      // ================================================
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // ================================================
      // NEXTJS RULES
      // ================================================
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'warn',
      
      // ================================================
      // CUSTOM RULES - ARCHITECTURE ENFORCEMENT
      // ================================================
      
      // Ban direct fetch calls from components - must use hooks/repos
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'Direct fetch calls are not allowed. Use hooks or repositories instead. See MIGRATION_NOTES.md for details.',
        },
      ],
      
      // Ban direct API calls - must use consolidated endpoints
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.property.name="fetch"]',
          message: 'Direct fetch calls are not allowed. Use hooks or repositories instead.',
        },
        {
          selector: 'CallExpression[callee.name="fetch"]',
          message: 'Direct fetch calls are not allowed. Use hooks or repositories instead.',
        },
      ],
      
      // Enforce repository pattern usage
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/lib/mock*'],
              message: 'Mock data files are deprecated. Use real data from repositories.',
            },
            {
              group: ['**/lib/menuData*'],
              message: 'Menu data files are deprecated. Use menu repository instead.',
            },
          ],
        },
      ],
      
      // ================================================
      // CODE QUALITY RULES
      // ================================================
      'complexity': ['warn', 10],
      'max-depth': ['warn', 4],
      'max-lines': ['warn', 300],
      'max-params': ['warn', 5],
      'max-statements': ['warn', 20],
      
      // ================================================
      // IMPORT RULES
      // ================================================
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      
      // ================================================
      // NAMING CONVENTIONS
      // ================================================
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['I'],
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    // Override for test files
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}', '**/__tests__/**/*'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Override for API route files
    files: ['**/app/api/**/*', '**/pages/api/**/*'],
    rules: {
      'no-console': 'off', // Allow console in API routes for logging
    },
  },
  {
    // Override for repository files
    files: ['**/lib/repos/**/*'],
    rules: {
      'no-console': 'off', // Allow console in repositories for error logging
    },
  },
]
