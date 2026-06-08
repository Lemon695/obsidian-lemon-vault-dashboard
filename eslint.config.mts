import tseslint from 'typescript-eslint';
import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import { globalIgnores } from 'eslint/config';

const typedOnlyRules = {
	'obsidianmd/no-plugin-as-component': 'off',
	'obsidianmd/no-view-references-in-plugin': 'off',
	'obsidianmd/no-unsupported-api': 'off',
	'obsidianmd/prefer-file-manager-trash-file': 'off',
	'obsidianmd/prefer-instanceof': 'off',
} as const;

const sourceCompatibilityRules = {
	'obsidianmd/no-unsupported-api': 'error',
} as const;

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.mts'],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json'],
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		files: ['src/**/*.ts'],
		rules: sourceCompatibilityRules,
	},
	{
		files: ['**/*.json'],
		rules: typedOnlyRules,
	},
	globalIgnores([
		'.claude/**',
		'.omx/**',
		'node_modules',
		'dist',
		'esbuild.config.mjs',
		'eslint.config.js',
		'manifest.json',
		'package-lock.json',
		'tsconfig.json',
		'version-bump.mjs',
		'versions.json',
		'main.js',
	]),
);
