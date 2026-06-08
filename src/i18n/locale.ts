import { getLanguage } from 'obsidian';

/**
 * Bilingual dictionary: zh / en variants.
 */
export type I18nDict<T> = { zh: T; en: T };

/**
 * Returns the correct translation for the current Obsidian UI language.
 * Requires Obsidian ≥ 1.8.7 (minAppVersion in manifest.json).
 */
export function t<T>(dict: I18nDict<T>): T {
	return getLanguage().startsWith('zh') ? dict.zh : dict.en;
}
