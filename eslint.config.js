import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
	{
		ignores: ['artifacts/**', 'build/**', 'coverage/**', 'node_modules/**', 'tests/**', 'dist/**', 'lib/**', 'scripts/**', 'eslint.config.js']
	},
	js.configs.recommended,
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'module',
			parser: typescriptParser,
			parserOptions: {
				project: './tsconfig.json'
			},
			globals: {
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				global: 'readonly',
				module: 'readonly',
				require: 'readonly',
				exports: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': typescript,
			prettier: prettier
		},
		rules: {
			...typescript.configs.recommended.rules,
			...prettierConfig.rules,
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { args: 'after-used' }],
			semi: 2,
			eqeqeq: [2, 'allow-null'],
			'no-console': 0,
			'no-irregular-whitespace': 2,
			'no-useless-escape': 0,
			indent: ['error', 'tab'],
			'space-before-function-paren': [
				'error',
				{
					anonymous: 'always',
					named: 'never',
					asyncArrow: 'always'
				}
			],
			'brace-style': [2, '1tbs', { allowSingleLine: true }],
			'arrow-body-style': [2, 'as-needed'],
			'array-bracket-spacing': [2, 'never'],
			'object-curly-spacing': [2, 'always'],
			'prettier/prettier': ['error'],
			'key-spacing': ['error', { beforeColon: false }]
		}
	}
];