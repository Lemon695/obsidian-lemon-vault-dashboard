import type { I18nDict } from 'i18n/locale';

export interface IdentitySettingsI18n {
	heading: string;
	showBadgeName: string;
	showBadgeDesc: string;
	customTextName: string;
	customTextDesc: string;
	customTextPlaceholder: string;
	badgeColorName: string;
	badgeColorDesc: string;
	opacityName: string;
	opacityDesc: string;
}

export const identitySettingsI18n: I18nDict<IdentitySettingsI18n> = {
	zh: {
		heading: '名片显示设置',
		showBadgeName: '显示库标识名片',
		showBadgeDesc: '在 Obsidian 窗口右下角显示当前仓库的名称。',
		customTextName: '自定义库名称',
		customTextDesc: '如果为空，将自动显示当前仓库的真实文件夹名称。',
		customTextPlaceholder: '例如：工作笔记本',
		badgeColorName: '名片主题色',
		badgeColorDesc: '为名片设置一个醒目的颜色，留空则使用默认主题色。',
		opacityName: '名片透明度',
		opacityDesc: '调整名片的半透明效果。',
	},
	en: {
		heading: 'Badge Display Settings',
		showBadgeName: 'Show Vault Identity Badge',
		showBadgeDesc: 'Display the name of the current vault in the bottom-right corner of the window.',
		customTextName: 'Custom Vault Name',
		customTextDesc: 'If empty, the actual vault folder name will be used.',
		customTextPlaceholder: 'e.g. Work Notes',
		badgeColorName: 'Badge Theme Color',
		badgeColorDesc: 'Set a distinct color for the badge. Leave empty for default theme color.',
		opacityName: 'Badge Opacity',
		opacityDesc: 'Adjust the transparency effect of the badge.',
	},
};
