import type { I18nDict } from 'i18n/locale';

export interface IdentityModuleI18n {
	name: string;
	description: string;
	badgeSub: string;
	toggleCommand: string;
}

export const identityModuleI18n: I18nDict<IdentityModuleI18n> = {
	zh: {
		name: '库身份标识',
		description: '在窗口边缘显示当前库名称的名片，方便在多个库之间快速识别。',
		badgeSub: 'Obsidian 知识库',
		toggleCommand: '切换库身份名片显示',
	},
	en: {
		name: 'Vault Identity',
		description: 'Show a badge with the vault name to help identify it when switching between multiple vaults.',
		badgeSub: 'Obsidian Vault',
		toggleCommand: 'Toggle vault identity badge',
	},
};
