import type { I18nDict } from 'i18n/locale';

export interface DashboardCommandsI18n {
	ribbonTooltip: string;
	commandOpenPanel: string;
	viewTitle: string;
}

export const dashboardCommandsI18n: I18nDict<DashboardCommandsI18n> = {
	zh: {
		ribbonTooltip: '仓库仪表盘',
		commandOpenPanel: '打开信息面板',
		viewTitle: '仓库仪表盘',
	},
	en: {
		ribbonTooltip: 'Vault dashboard',
		commandOpenPanel: 'Open info panel',
		viewTitle: 'Vault dashboard',
	},
};
