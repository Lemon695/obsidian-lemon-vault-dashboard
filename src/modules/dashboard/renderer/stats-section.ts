import { Platform } from 'obsidian';
import type { DashboardViewI18n } from 'i18n/modules/dashboard/view';

export function renderStatsSection(
	parent: HTMLElement,
	L: DashboardViewI18n,
	vaultName: string,
	basePath: string,
	initializedDays: number
): void {
	const card = parent.createDiv({ cls: 'vault-dashboard-panel vault-dashboard-side-panel' });
	card.createDiv({ text: L.vaultInfoTitle, cls: 'vault-dashboard-side-kicker' });
	card.createDiv({ text: vaultName, cls: 'vault-dashboard-side-title' });
	card.createDiv({
		text: L.vaultInitialized(initializedDays),
		cls: 'vault-dashboard-side-subtitle',
	});
	card.createDiv({ text: L.absolutePath, cls: 'vault-dashboard-side-label' });
	card.createDiv({ text: basePath, cls: 'vault-dashboard-side-path' });
	const actions = card.createDiv({ cls: 'vault-dashboard-side-actions' });
	const copyBtn = actions.createEl('button', { text: L.copyPath });
	copyBtn.setAttribute('data-vd-action', 'copy-path');
	copyBtn.setAttribute('data-vd-path', basePath);
	const openBtn = actions.createEl('button', {
		text: Platform.isDesktopApp ? L.showInFileManagerShort : L.showInFileManagerDesktopOnly,
	});
	openBtn.setAttribute('data-vd-action', 'open-in-system');
	openBtn.setAttribute('data-vd-path', basePath);
	if (!Platform.isDesktopApp) openBtn.disabled = true;
}
