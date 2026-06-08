import { Platform } from 'obsidian';
import type { DashboardViewI18n } from 'i18n/modules/dashboard/view';
import type { FileSizeEntry } from 'shared/vault-stats';

/**
 * Renders a single file row (used by both Top 10 and Orphan sections).
 * Row styling (hover, border) is handled entirely by CSS.
 */
export function renderFileRow(
	list: HTMLElement,
	item: FileSizeEntry,
	L: DashboardViewI18n,
	fmt: (b: number) => string
): void {
	const li = list.createEl('li', {
		cls: 'vault-dashboard-list-row vault-dashboard-orphan-row',
	});

	const mainRow = li.createDiv({ cls: 'vault-dashboard-orphan-main' });

	const nameEl = mainRow.createSpan({
		text: item.file.path,
		cls: 'vault-dashboard-link',
	});
	nameEl.setAttribute('data-vd-action', 'open-file');
	nameEl.setAttribute('data-vd-path', item.file.path);

	mainRow.createSpan({ text: fmt(item.size), cls: 'vault-dashboard-size' });

	const actions = li.createDiv({ cls: 'vault-dashboard-orphan-actions' });

	const copyBtn = actions.createEl('button', { text: L.copyPath, cls: 'mod-muted' });
	copyBtn.setAttribute('data-vd-action', 'copy-vault-path');
	copyBtn.setAttribute('data-vd-path', item.file.path);

	if (Platform.isDesktopApp) {
		const revealBtn = actions.createEl('button', { text: L.showInFileManagerShort, cls: 'mod-muted' });
		revealBtn.setAttribute('data-vd-action', 'reveal-in-system');
		revealBtn.setAttribute('data-vd-path', item.file.path);
	}
}
