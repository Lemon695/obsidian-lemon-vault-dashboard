import type { I18nDict } from 'i18n/locale';

export interface DashboardModuleI18n {
	name: string;
	description: string;
}

export const dashboardModuleI18n: I18nDict<DashboardModuleI18n> = {
	zh: {
		name: '仓库看板',
		description: '展示仓库物理信息与存储容量统计，帮助找出大文件和孤儿附件。',
	},
	en: {
		name: 'Vault Dashboard',
		description: 'Physical vault info and storage statistics. Locate large files and orphan attachments.',
	},
};
