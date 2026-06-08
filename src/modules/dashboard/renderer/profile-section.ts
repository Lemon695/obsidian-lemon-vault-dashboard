import type { DashboardViewI18n } from 'i18n/modules/dashboard/view';
import type { DashboardInsights } from '../insights';
import type { VaultScanResult } from 'shared/vault-stats';
import { createIcon } from './icon';

export function renderProfileSection(
	body: HTMLElement,
	scan: VaultScanResult,
	insights: DashboardInsights,
	diskBytes: number | null,
	L: DashboardViewI18n,
	fmt: (b: number) => string
): void {
	renderKpiRow(body, insights, L);
	renderCompositionCard(body, scan, insights, diskBytes, L, fmt);
}

function renderKpiRow(body: HTMLElement, insights: DashboardInsights, L: DashboardViewI18n): void {
	const row = body.createDiv({ cls: 'vault-dashboard-kpi-row' });
	for (const kpi of insights.kpis) {
		const card = row.createDiv({ cls: 'vault-dashboard-kpi-card' });
		const head = card.createDiv({ cls: 'vault-dashboard-kpi-head' });
		head.createDiv({ text: labelForKpi(kpi.label, L), cls: 'vault-dashboard-kpi-label' });
		createIcon(head, iconForKpi(kpi.icon), 'vault-dashboard-kpi-icon');
		const metric = card.createDiv({ cls: 'vault-dashboard-kpi-metric' });
		metric.createSpan({ text: kpi.value, cls: 'vault-dashboard-kpi-value' });
		if (kpi.unit) metric.createSpan({ text: kpi.unit, cls: 'vault-dashboard-kpi-unit' });
		const foot = card.createDiv({ cls: 'vault-dashboard-kpi-foot' });
		if (kpi.delta) {
			foot.createSpan({
				text: kpi.delta.text,
				cls: `vault-dashboard-kpi-delta ${kpi.delta.positive ? 'is-positive' : 'is-negative'}`,
			});
		}
		foot.createSpan({ text: subtitleForKpi(kpi.label, insights, L), cls: 'vault-dashboard-kpi-subtitle' });
	}
}

function renderCompositionCard(
	body: HTMLElement,
	scan: VaultScanResult,
	insights: DashboardInsights,
	diskBytes: number | null,
	L: DashboardViewI18n,
	fmt: (b: number) => string
): void {
	const card = body.createDiv({ cls: 'vault-dashboard-panel vault-dashboard-composition-panel' });
	card.setAttribute('data-vd-section', 'composition');
	const head = card.createDiv({ cls: 'vault-dashboard-panel-head' });
	const titleGroup = head.createDiv({ cls: 'vault-dashboard-panel-title-group' });
	titleGroup.createEl('h3', { text: L.compositionTitle, cls: 'vault-dashboard-panel-title' });
	titleGroup.createDiv({ text: L.compositionHint(fmt(scan.totalSize)), cls: 'vault-dashboard-panel-hint' });
	head.createDiv({ text: L.compositionShareLabel, cls: 'vault-dashboard-panel-tag' });
	const stack = card.createDiv({ cls: 'vault-dashboard-stack-bar' });
	for (const item of insights.breakdown) {
		stack.createDiv({ cls: `vault-dashboard-stack-segment is-${item.key}`, attr: { style: `width:${item.percent}%` } });
	}
	const grid = card.createDiv({ cls: 'vault-dashboard-composition-grid' });
	for (const item of insights.breakdown) {
		const stat = grid.createDiv({ cls: 'vault-dashboard-composition-stat' });
		const label = stat.createDiv({ cls: 'vault-dashboard-composition-label' });
		label.createSpan({ cls: `vault-dashboard-swatch is-${item.key}` });
		label.createSpan({ text: breakdownLabel(item.key, L) });
		label.createSpan({ text: item.subtitle, cls: 'vault-dashboard-composition-sub' });
		const values = stat.createDiv({ cls: 'vault-dashboard-composition-values' });
		values.createSpan({ text: (item.size / (1024 * 1024)).toFixed(2), cls: 'vault-dashboard-composition-size' });
		values.createSpan({ text: 'MB', cls: 'vault-dashboard-composition-unit' });
		values.createSpan({ text: L.compositionFiles(item.files, item.percent), cls: 'vault-dashboard-composition-meta' });
	}
	if (diskBytes != null) {
		const disk = card.createDiv({ cls: 'vault-dashboard-disk-note' });
		disk.createDiv({ text: L.diskFolderTotal, cls: 'vault-dashboard-disk-note-title' });
		disk.createDiv({ text: fmt(diskBytes), cls: 'vault-dashboard-disk-note-value' });
		disk.createDiv({ text: L.diskFolderNote, cls: 'vault-dashboard-disk-note-help' });
	}
}

function labelForKpi(label: string, L: DashboardViewI18n): string {
	switch (label) {
		case 'totalStorage': return L.totalStorage;
		case 'totalFiles': return L.totalFiles;
		case 'totalFolders': return L.totalFolders;
		case 'linksTotal': return L.linksTotalTitle;
		default: return label;
	}
}

function subtitleForKpi(label: string, insights: DashboardInsights, L: DashboardViewI18n): string {
	switch (label) {
		case 'totalStorage': return L.kpiStorageSubtitle(insights.growth[0]?.size ?? 0, insights.growth[insights.growth.length - 1]?.size ?? 0);
		case 'totalFiles': return L.kpiFilesSubtitle(insights.weekCreatedTotal);
		case 'totalFolders': return L.kpiFoldersSubtitle(insights.averageDepth);
		case 'linksTotal': return L.kpiLinksSubtitle(insights.health.brokenLinks);
		default: return '';
	}
}

function breakdownLabel(key: 'text' | 'image' | 'attachment', L: DashboardViewI18n): string {
	if (key === 'text') return L.metricText;
	if (key === 'image') return L.metricImages;
	return L.metricAttachments;
}

function iconForKpi(icon: string): string {
	switch (icon) {
		case 'database': return 'database';
		case 'file': return 'file-text';
		case 'folder': return 'folder';
		case 'link': return 'link';
		default: return 'circle';
	}
}
