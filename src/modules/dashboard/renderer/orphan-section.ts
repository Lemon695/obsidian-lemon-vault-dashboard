import type { DashboardViewI18n } from 'i18n/modules/dashboard/view';
import type { OrphanScanResult } from 'shared/vault-stats';
import { formatBytes } from 'shared/format';
import { renderFileRow } from './file-row';
import type { DashboardHealthStats } from '../insights';

export function renderOrphanSection(
	parent: HTMLElement,
	L: DashboardViewI18n,
	health: DashboardHealthStats,
	options: { showBrokenDetails: boolean; showOrphanDetails: boolean }
): void {
	const card = parent.createDiv({ cls: 'vault-dashboard-panel vault-dashboard-side-panel vault-dashboard-orphans' });
	card.setAttribute('data-vd-section', 'health');
	const head = card.createDiv({ cls: 'vault-dashboard-panel-head is-compact' });
	const titleGroup = head.createDiv({ cls: 'vault-dashboard-panel-title-group' });
	titleGroup.createEl('h3', { text: L.healthTitle, cls: 'vault-dashboard-panel-title' });
	head.createDiv({
		text: L.healthScore(health.score),
		cls: `vault-dashboard-health-badge ${health.score >= 90 ? 'is-positive' : 'is-warning'}`,
	});
	const issues = card.createDiv({ cls: 'vault-dashboard-health-list' });
	for (const item of [
		{ key: 'orphans', label: L.healthOrphans, value: health.orphans, tone: 'warning' },
		{ key: 'broken', label: L.healthBrokenLinks, value: health.brokenLinks, tone: 'negative' },
		{ key: 'empty', label: L.healthEmptyNotes, value: health.emptyNotes, tone: 'warning' },
		{ key: 'untagged', label: L.healthUntagged, value: health.untagged, tone: 'muted' },
	]) {
		const row = issues.createDiv({ cls: 'vault-dashboard-health-row' });
		row.setAttribute('data-vd-highlight', item.key === 'broken' ? 'broken-links' : item.key === 'orphans' ? 'orphans' : item.key);
		row.createDiv({ text: item.label, cls: 'vault-dashboard-health-label' });
		row.createDiv({ text: String(item.value), cls: `vault-dashboard-health-value is-${item.tone}` });
	}
	const scanBtn = card.createEl('button', { text: L.scanOrphans, cls: 'vault-dashboard-primary-btn' });
	scanBtn.setAttribute('data-vd-action', 'scan-orphans');
	const result = card.createDiv({ cls: 'vault-dashboard-orphans-result' });
	if (!options.showOrphanDetails) {
		result.addClass('vault-dashboard-orphans-result--hidden');
	}
}

export function renderBrokenLinksPanel(
	parent: HTMLElement,
	L: DashboardViewI18n,
	health: DashboardHealthStats
): void {
	const card = parent.createDiv({ cls: 'vault-dashboard-panel vault-dashboard-side-panel vault-dashboard-broken-links-panel' });
	card.setAttribute('data-vd-highlight', 'broken-links');
	card.createDiv({ text: L.healthBrokenDetailsTitle, cls: 'vault-dashboard-panel-title' });
	if (health.brokenTargets.length === 0) {
		card.createDiv({ text: L.healthBrokenDetailsEmpty, cls: 'vault-dashboard-muted' });
		return;
	}
	const list = card.createDiv({ cls: 'vault-dashboard-broken-links-list' });
	for (const item of health.brokenTargets) {
		const row = list.createDiv({ cls: 'vault-dashboard-broken-links-row' });
		row.createSpan({ text: item.target, cls: 'vault-dashboard-broken-links-target' });
		row.createSpan({ text: String(item.count), cls: 'vault-dashboard-broken-links-count' });
	}
}

export function renderOrphanDetailsPanel(
	parent: HTMLElement,
	L: DashboardViewI18n,
	result: OrphanScanResult | null
): void {
	const card = parent.createDiv({ cls: 'vault-dashboard-panel vault-dashboard-side-panel vault-dashboard-orphans vault-dashboard-orphan-detail-panel' });
	card.setAttribute('data-vd-highlight', 'orphans');
	card.createDiv({ text: L.shellActionAttachments, cls: 'vault-dashboard-panel-title' });
	const button = card.createEl('button', { text: L.scanOrphans, cls: 'vault-dashboard-primary-btn' });
	button.setAttribute('data-vd-action', 'scan-orphans');
	const mount = card.createDiv({ cls: 'vault-dashboard-orphans-result' });
	if (result) {
		renderOrphanListContent(mount, L, result);
	} else {
		mount.createDiv({ text: L.orphanDetailsHint, cls: 'vault-dashboard-muted' });
	}
}

export function renderOrphanListContent(
	mount: HTMLElement,
	L: DashboardViewI18n,
	result: OrphanScanResult
): void {
	mount.empty();
	const fmt = (b: number) => formatBytes(b, L.byteUnits, L.byteZero);
	const { orphans, orphansTotalSize } = result;
	if (orphans.length === 0) {
		mount.createDiv({ text: L.noOrphans, cls: 'vault-dashboard-success' });
		return;
	}
	mount.createDiv({ text: L.foundOrphans(orphans.length, fmt(orphansTotalSize)), cls: 'vault-dashboard-warn vault-dashboard-orphan-summary' });
	const list = mount.createEl('ul', { cls: 'vault-dashboard-list vault-dashboard-list-scroll vault-dashboard-orphan-results' });
	for (const item of orphans) {
		renderFileRow(list, item, L, fmt);
	}
}
