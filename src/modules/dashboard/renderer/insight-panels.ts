import type { DashboardViewI18n } from 'i18n/modules/dashboard/view';
import type {
	DashboardActivityDay,
	DashboardGrowthPoint,
	DashboardRecentItem,
} from '../insights';
import { createIcon } from './icon';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function renderGrowthPanel(
	parent: HTMLElement,
	growth: DashboardGrowthPoint[],
	L: DashboardViewI18n
): void {
	const doc = parent.ownerDocument;
	const card = createCard(parent, 'vault-dashboard-panel vault-dashboard-growth-panel');
	const first = growth[0]?.size ?? 0;
	const last = growth[growth.length - 1]?.size ?? 0;
	const delta = last - first;
	const pct = first > 0 ? (delta / first) * 100 : 0;
	createSectionHeader(card, L.growthTitle, L.growthHint);
	const metrics = card.createDiv({ cls: 'vault-dashboard-panel-inline-metrics' });
	metrics.createDiv({ text: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} MB`, cls: 'vault-dashboard-panel-inline-value' });
	metrics.createDiv({ text: `${delta >= 0 ? '+' : ''}${pct.toFixed(1)}%`, cls: `vault-dashboard-panel-inline-badge ${delta >= 0 ? 'is-positive' : 'is-negative'}` });
	card.appendChild(createAreaChart(growth, doc));
}

export function renderActivityPanel(
	parent: HTMLElement,
	activity: DashboardActivityDay[],
	stats: {
		lastSevenDayAverageEdits: number;
		lastDayEditedTotal: number;
		lastDayCreatedTotal: number;
		weekEditedTotal: number;
	},
	L: DashboardViewI18n
): void {
	const doc = parent.ownerDocument;
	const card = createCard(parent, 'vault-dashboard-panel vault-dashboard-activity-panel');
	createSectionHeader(card, L.activityTitle, L.activityHint);
	const meta = card.createDiv({ cls: 'vault-dashboard-activity-meta' });
	meta.setText(L.activityAverageEdits(stats.lastSevenDayAverageEdits));
	const body = card.createDiv({ cls: 'vault-dashboard-activity-body' });
	body.appendChild(createHeatmap(activity, L, doc));
	const aside = body.createDiv({ cls: 'vault-dashboard-activity-aside' });
	createMiniStat(aside, L.activityEditedToday, String(stats.lastDayEditedTotal));
	createMiniStat(aside, L.activityCreatedToday, String(stats.lastDayCreatedTotal));
	createMiniStat(aside, L.activityEditedWeek, String(stats.weekEditedTotal));
}

export function renderRecentPanel(
	parent: HTMLElement,
	recentItems: DashboardRecentItem[],
	L: DashboardViewI18n
): void {
	const card = createCard(parent, 'vault-dashboard-panel vault-dashboard-side-panel');
	const header = createSectionHeader(card, L.recentTitle, undefined, true);
	header.createEl('span', { text: L.recentViewAll, cls: 'vault-dashboard-inline-link' });
	const list = card.createDiv({ cls: 'vault-dashboard-recent-list' });
	for (const item of recentItems) {
		const row = list.createDiv({ cls: 'vault-dashboard-recent-row' });
		const marker = row.createDiv({ cls: `vault-dashboard-recent-marker is-${item.action}` });
		createIcon(marker, item.action === 'created' ? 'plus' : 'file-text');
		const body = row.createDiv({ cls: 'vault-dashboard-recent-body' });
		body.createDiv({ text: item.path.split('/').pop() ?? item.path, cls: 'vault-dashboard-recent-title' });
		const meta = body.createDiv({ cls: 'vault-dashboard-recent-meta' });
		meta.createSpan({ text: item.action === 'created' ? L.recentCreated : L.recentEdited });
		meta.createSpan({ text: '·' });
		meta.createSpan({ text: formatTimestamp(item.timestamp) });
	}
}

function createCard(parent: HTMLElement, cls: string): HTMLElement {
	return parent.createDiv({ cls });
}

function createSectionHeader(parent: HTMLElement, title: string, hint?: string, compact = false): HTMLElement {
	const header = parent.createDiv({ cls: compact ? 'vault-dashboard-panel-head is-compact' : 'vault-dashboard-panel-head' });
	const titleGroup = header.createDiv({ cls: 'vault-dashboard-panel-title-group' });
	titleGroup.createEl('h3', { text: title, cls: 'vault-dashboard-panel-title' });
	if (hint) titleGroup.createDiv({ text: hint, cls: 'vault-dashboard-panel-hint' });
	return header;
}

function createMiniStat(parent: HTMLElement, label: string, value: string): void {
	const card = parent.createDiv({ cls: 'vault-dashboard-mini-stat' });
	card.createSpan({ text: label, cls: 'vault-dashboard-mini-stat-label' });
	card.createSpan({ text: value, cls: 'vault-dashboard-mini-stat-value' });
}

function createAreaChart(points: DashboardGrowthPoint[], doc: Document): SVGSVGElement {
	const width = 720;
	const height = 190;
	const padLeft = 40;
	const padRight = 12;
	const padTop = 18;
	const padBottom = 26;
	const values = points.map((item) => item.size);
	const min = Math.min(...values, 0);
	const max = Math.max(...values, 1);
	const svg = createSvg(doc, 'svg', { viewBox: `0 0 ${width} ${height}`, class: 'vault-dashboard-svg' });
	const chartWidth = width - padLeft - padRight;
	const chartHeight = height - padTop - padBottom;
	const xFor = (index: number) => padLeft + (index / Math.max(1, points.length - 1)) * chartWidth;
	const yFor = (value: number) => padTop + chartHeight - ((value - min) / Math.max(1, max - min)) * chartHeight;
	for (let i = 0; i <= 4; i++) {
		const value = min + ((max - min) / 4) * i;
		const y = yFor(value);
		svg.appendChild(createSvg(doc, 'line', { x1: String(padLeft), x2: String(width - padRight), y1: String(y), y2: String(y), class: 'vault-dashboard-chart-grid' }));
		const label = createSvg(doc, 'text', { x: String(padLeft - 8), y: String(y + 4), class: 'vault-dashboard-chart-axis' });
		label.textContent = String(Math.round(value));
		svg.appendChild(label);
	}
	const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(point.size)}`).join(' ');
	const area = `${line} L ${xFor(points.length - 1)} ${height - padBottom} L ${padLeft} ${height - padBottom} Z`;
	const defs = createSvg(doc, 'defs');
	const gradient = createSvg(doc, 'linearGradient', { id: 'vault-dashboard-growth-fill', x1: '0', x2: '0', y1: '0', y2: '1' });
	gradient.appendChild(createSvg(doc, 'stop', { offset: '0%', stopColor: 'var(--interactive-accent)', stopOpacity: '0.28' }));
	gradient.appendChild(createSvg(doc, 'stop', { offset: '100%', stopColor: 'var(--interactive-accent)', stopOpacity: '0' }));
	defs.appendChild(gradient);
	svg.appendChild(defs);
	svg.appendChild(createSvg(doc, 'path', { d: area, fill: 'url(#vault-dashboard-growth-fill)' }));
	svg.appendChild(createSvg(doc, 'path', { d: line, class: 'vault-dashboard-chart-line' }));
	points.forEach((point, index) => {
		const x = xFor(index);
		const y = yFor(point.size);
		svg.appendChild(createSvg(doc, 'circle', { cx: String(x), cy: String(y), r: '2.5', class: 'vault-dashboard-chart-dot' }));
		if (index === 0 || index === points.length - 1 || index % 3 === 0) {
			const label = createSvg(doc, 'text', { x: String(x), y: String(height - 8), textAnchor: 'middle', class: 'vault-dashboard-chart-axis' });
			label.textContent = point.monthKey.slice(5);
			svg.appendChild(label);
		}
	});
	return svg;
}

function createHeatmap(activity: DashboardActivityDay[], L: DashboardViewI18n, doc: Document): HTMLElement {
	const grid = doc.createElement('div');
	grid.className = 'vault-dashboard-heatmap';
	const max = Math.max(...activity.map((item) => item.edited), 1);
	for (const day of activity) {
		const cell = doc.createElement('div');
		cell.className = 'vault-dashboard-heatmap-cell';
		cell.style.setProperty('--vd-heat', (day.edited / max).toFixed(2));
		cell.setAttribute('aria-label', `${day.dayKey}: ${day.edited}`);
		grid.appendChild(cell);
	}
	const legend = doc.createElement('div');
	legend.className = 'vault-dashboard-heatmap-legend';
	legend.append(doc.createTextNode(L.activityLow));
	for (const step of [0.15, 0.35, 0.55, 0.75, 0.95]) {
		const swatch = doc.createElement('span');
		swatch.style.setProperty('--vd-heat', step.toFixed(2));
		swatch.className = 'vault-dashboard-heatmap-cell';
		legend.appendChild(swatch);
	}
	legend.append(doc.createTextNode(L.activityHigh));
	const wrap = doc.createElement('div');
	wrap.className = 'vault-dashboard-heatmap-wrap';
	wrap.appendChild(grid);
	wrap.appendChild(legend);
	return wrap;
}

function createSvg<K extends keyof SVGElementTagNameMap>(doc: Document, tag: K, attrs: Record<string, string> = {}): SVGElementTagNameMap[K] {
	const el = doc.createElementNS(SVG_NS, tag);
	for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
	return el;
}

function formatTimestamp(timestamp: number): string {
	return new Date(timestamp).toLocaleString();
}
