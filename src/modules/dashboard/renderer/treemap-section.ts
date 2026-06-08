import { setTooltip } from 'obsidian';

import { type DashboardViewI18n } from '../../../i18n/modules/dashboard/view';
import { type FileCategory } from '../../../shared/vault-stats';
import { type TreemapNode } from '../treemap-data';
import { squarify } from './treemap-layout';

const MAX_CHILDREN_DISPLAY = 80;
const CHART_MODES = ['treemap', 'sunburst', 'donut', 'bar'] as const;
type ChartMode = typeof CHART_MODES[number];
type FilterCategory = 'all' | FileCategory;

export function renderTreemapSection(
	parent: HTMLElement,
	root: TreemapNode,
	L: DashboardViewI18n,
	fmt: (b: number) => string
): { update: () => void; resize: () => void } {
	const card = parent.createDiv({ cls: 'vault-dashboard-panel vault-dashboard-analysis-panel' });
	const head = card.createDiv({ cls: 'vault-dashboard-panel-head' });
	const titleGroup = head.createDiv({ cls: 'vault-dashboard-panel-title-group' });
	titleGroup.createEl('h3', { text: L.analysisTitle, cls: 'vault-dashboard-panel-title' });
	titleGroup.createDiv({ text: L.analysisHint, cls: 'vault-dashboard-panel-hint' });
	const controls = head.createDiv({ cls: 'vault-dashboard-analysis-controls' });
	const filterGroup = controls.createDiv({ cls: 'vault-dashboard-segmented' });
	const chartGroup = controls.createDiv({ cls: 'vault-dashboard-segmented' });
	const breadcrumbBar = card.createDiv({ cls: 'vault-dashboard-treemap-breadcrumb' });
	const chart = card.createDiv({ cls: 'vault-dashboard-chart-surface' });
	const summary = card.createDiv({ cls: 'vault-dashboard-chart-summary' });

	let activeFilter: FilterCategory = 'all';
	let activeRoot: TreemapNode = root;
	let currentNode: TreemapNode = root;
	let navigationStack: TreemapNode[] = [];
	let chartMode: ChartMode = 'treemap';

	const filterOptions: Array<{ value: FilterCategory; label: string }> = [
		{ value: 'all', label: L.treemapFilterAll },
		{ value: 'text', label: L.treemapFilterText },
		{ value: 'image', label: L.treemapFilterImage },
		{ value: 'video', label: L.treemapFilterVideo },
		{ value: 'html', label: L.treemapFilterHtml },
		{ value: 'attachment', label: L.treemapFilterOther },
	];

	const computeActiveRoot = (): TreemapNode =>
		activeFilter === 'all'
			? root
			: (filterTree(root, activeFilter) ?? { ...root, children: [], size: 0 });

	const buildCrumbs = (): TreemapNode[] => {
		if (currentNode === activeRoot) return [activeRoot];
		return [...navigationStack, currentNode];
	};

	const redraw = () => {
		renderFilterBar(filterGroup, filterOptions, activeFilter, (value) => {
			activeFilter = value;
			activeRoot = computeActiveRoot();
			currentNode = activeRoot;
			navigationStack = [];
			redraw();
		});
		renderChartSwitcher(chartGroup, chartMode, L, (mode) => {
			chartMode = mode;
			redraw();
		});
		renderBreadcrumb(breadcrumbBar, buildCrumbs(), currentNode, L, (index, crumbs) => {
			if (index <= 0) {
				navigationStack = [];
				currentNode = activeRoot;
			} else {
				currentNode = crumbs[index] ?? activeRoot;
				navigationStack = crumbs.slice(0, index);
			}
			redraw();
		});
		renderChart(chart, summary, chartMode, currentNode, fmt, L, (node) => {
			navigationStack.push(currentNode);
			currentNode = node;
			redraw();
		});
	};

	const update = () => {
		activeRoot = computeActiveRoot();
		currentNode = activeRoot;
		navigationStack = [];
		redraw();
	};

	redraw();
	return { update, resize: redraw };
}

function renderFilterBar(
	parent: HTMLElement,
	options: Array<{ value: FilterCategory; label: string }>,
	active: FilterCategory,
	onSelect: (value: FilterCategory) => void
): void {
	parent.empty();
	for (const option of options) {
		const btn = parent.createEl('button', {
			text: option.label,
			cls: active === option.value ? 'is-active' : '',
		});
		btn.addEventListener('click', () => {
			if (option.value !== active) onSelect(option.value);
		});
	}
}

function renderChartSwitcher(
	parent: HTMLElement,
	active: ChartMode,
	L: DashboardViewI18n,
	onSelect: (mode: ChartMode) => void
): void {
	parent.empty();
	for (const mode of CHART_MODES) {
		const btn = parent.createEl('button', {
			text: chartLabel(mode, L),
			cls: active === mode ? 'is-active' : '',
		});
		btn.addEventListener('click', () => {
			if (mode !== active) onSelect(mode);
		});
	}
}

function renderBreadcrumb(
	parent: HTMLElement,
	crumbs: TreemapNode[],
	currentNode: TreemapNode,
	L: DashboardViewI18n,
	onJump: (index: number, crumbs: TreemapNode[]) => void
): void {
	parent.empty();
	crumbs.forEach((node, index) => {
		const isCurrent = node === currentNode;
		const crumb = parent.createSpan({
			text: node.name || L.breadcrumbVault,
			cls: isCurrent ? 'vault-dashboard-treemap-crumb is-current' : 'vault-dashboard-treemap-crumb is-link',
		});
		if (!isCurrent) {
			crumb.addEventListener('click', () => onJump(index, crumbs));
		}
		if (index < crumbs.length - 1) {
			parent.createSpan({ text: '/', cls: 'vault-dashboard-treemap-crumb-sep' });
		}
	});
	if (crumbs.length > 1) {
		const backBtn = parent.createEl('button', {
			text: L.treemapBack,
			cls: 'vault-dashboard-treemap-back-btn',
		});
		backBtn.addEventListener('click', () => onJump(crumbs.length - 2, crumbs));
	}
}

function renderChart(
	chart: HTMLElement,
	summary: HTMLElement,
	mode: ChartMode,
	currentNode: TreemapNode,
	fmt: (b: number) => string,
	L: DashboardViewI18n,
	onDrill: (node: TreemapNode) => void
): void {
	chart.empty();
	summary.empty();
	const children = visibleChildren(currentNode, fmt, L);
	if (children.length === 0) {
		chart.createDiv({ text: L.noData, cls: 'vault-dashboard-muted' });
		return;
	}
	renderSummaryList(summary, children, fmt);
	if (mode === 'treemap') {
		renderTreemap(chart, children, fmt, onDrill);
		return;
	}
	if (mode === 'bar') {
		renderBarChart(chart, children, fmt, onDrill);
		return;
	}
	renderRadialChart(chart, children, fmt, mode, L, onDrill);
}

function renderSummaryList(parent: HTMLElement, children: TreemapNode[], fmt: (b: number) => string): void {
	const top = children.slice(0, 6);
	const max = top[0]?.size ?? 1;
	for (const node of top) {
		const row = parent.createDiv({ cls: 'vault-dashboard-chart-summary-row' });
		row.createSpan({ text: node.name, cls: 'vault-dashboard-chart-summary-name' });
		const track = row.createDiv({ cls: 'vault-dashboard-chart-summary-track' });
		track.createDiv({
			cls: `vault-dashboard-chart-summary-bar ${node.isFolder ? 'is-folder' : 'is-file'}`,
			attr: { style: `width:${(node.size / max) * 100}%` },
		});
		row.createSpan({ text: fmt(node.size), cls: 'vault-dashboard-chart-summary-value' });
	}
}

function renderTreemap(
	parent: HTMLElement,
	children: TreemapNode[],
	fmt: (b: number) => string,
	onDrill: (node: TreemapNode) => void
): void {
	const width = Math.max(320, parent.clientWidth || 680);
	const height = 380;
	const layouts = squarify({ x: 0, y: 0, w: width, h: height }, children.map((child) => child.size));
	const surface = parent.createDiv({ cls: 'vault-dashboard-treemap-surface' });
	surface.style.height = `${height}px`;
	let folderIndex = 0;
	const folderCount = children.filter((child) => child.isFolder).length || 1;
	layouts.forEach((rect, index) => {
		const node = children[index];
		if (!node || rect.w < 4 || rect.h < 4) return;
		const nodeEl = surface.createDiv({ cls: 'vault-dashboard-treemap-node' });
		nodeEl.style.left = `${rect.x}px`;
		nodeEl.style.top = `${rect.y}px`;
		nodeEl.style.width = `${rect.w}px`;
		nodeEl.style.height = `${rect.h}px`;
		if (node.isOtherBucket) {
			nodeEl.addClass('is-other-bucket');
		} else if (node.isFolder) {
			const hue = Math.round((folderIndex / folderCount) * 360);
			folderIndex += 1;
			nodeEl.style.setProperty('--vd-node-bg', `hsla(${hue}, 62%, 46%, 0.26)`);
			nodeEl.style.setProperty('--vd-node-border', `hsla(${hue}, 68%, 58%, 0.36)`);
			nodeEl.addClass('is-folder');
			nodeEl.addClass('is-drillable');
			nodeEl.addEventListener('click', () => onDrill(node));
		} else {
			nodeEl.style.setProperty('--vd-node-bg', `hsla(${leafHue(node)}, 75%, 54%, 0.78)`);
			nodeEl.style.setProperty('--vd-node-border', `hsla(${leafHue(node)}, 70%, 65%, 0.42)`);
			nodeEl.addClass('is-file');
			nodeEl.setAttribute('data-vd-action', 'open-file');
			nodeEl.setAttribute('data-vd-path', node.path);
		}
		setTooltip(nodeEl, `${node.path || node.name}\n${fmt(node.size)}`);
		if (rect.w > 40 && rect.h > 20) {
			nodeEl.createSpan({ text: node.name, cls: 'vault-dashboard-treemap-label' });
			if (rect.w > 96 && rect.h > 38) {
				nodeEl.createSpan({ text: fmt(node.size), cls: 'vault-dashboard-treemap-meta' });
			}
		}
	});
}

function renderBarChart(
	parent: HTMLElement,
	children: TreemapNode[],
	fmt: (b: number) => string,
	onDrill: (node: TreemapNode) => void
): void {
	const list = parent.createDiv({ cls: 'vault-dashboard-bar-chart' });
	const max = children[0]?.size ?? 1;
	for (const node of children.slice(0, 10)) {
		const row = list.createDiv({ cls: 'vault-dashboard-bar-chart-row' });
		row.createDiv({ text: node.name, cls: 'vault-dashboard-bar-chart-label' });
		const track = row.createDiv({ cls: 'vault-dashboard-bar-chart-track' });
		const bar = track.createDiv({
			cls: `vault-dashboard-bar-chart-bar ${node.isFolder ? 'is-folder' : 'is-file'}`,
			attr: { style: `width:${(node.size / max) * 100}%` },
		});
		if (node.isFolder && !node.isOtherBucket) {
			bar.addClass('is-drillable');
			row.addEventListener('click', () => onDrill(node));
		}
		row.createDiv({ text: fmt(node.size), cls: 'vault-dashboard-bar-chart-value' });
	}
}

function renderRadialChart(
	parent: HTMLElement,
	children: TreemapNode[],
	fmt: (b: number) => string,
	mode: Extract<ChartMode, 'donut' | 'sunburst'>,
	L: DashboardViewI18n,
	onDrill: (node: TreemapNode) => void
): void {
	const wrap = parent.createDiv({ cls: 'vault-dashboard-radial-wrap' });
	const chart = wrap.createDiv({ cls: `vault-dashboard-radial-chart is-${mode}` });
	const total = children.reduce((sum, node) => sum + node.size, 0) || 1;
	let start = 0;
	const segments: string[] = [];
	children.slice(0, mode === 'donut' ? 6 : 8).forEach((node, index) => {
		const pct = (node.size / total) * 100;
		const end = start + pct;
		segments.push(`${radialColor(node, index)} ${start}% ${end}%`);
		start = end;
	});
	chart.style.background = `conic-gradient(${segments.join(', ')})`;
	const hole = chart.createDiv({ cls: 'vault-dashboard-radial-hole' });
	hole.createDiv({ text: mode === 'donut' ? L.analysisCenterDonut : L.analysisCenterSunburst, cls: 'vault-dashboard-radial-label' });
	hole.createDiv({ text: fmt(total), cls: 'vault-dashboard-radial-value' });
	const legend = wrap.createDiv({ cls: 'vault-dashboard-radial-legend' });
	children.slice(0, mode === 'donut' ? 6 : 8).forEach((node, index) => {
		const row = legend.createDiv({ cls: 'vault-dashboard-radial-legend-row' });
		row.createSpan({
			cls: 'vault-dashboard-radial-swatch',
			attr: { style: `background:${radialColor(node, index)}` },
		});
		const label = row.createSpan({ text: node.name, cls: 'vault-dashboard-radial-legend-label' });
		if (node.isFolder && !node.isOtherBucket) {
			label.addClass('is-drillable');
			label.addEventListener('click', () => onDrill(node));
		}
		row.createSpan({ text: fmt(node.size), cls: 'vault-dashboard-radial-legend-value' });
	});
}

function visibleChildren(currentNode: TreemapNode, fmt: (b: number) => string, L: DashboardViewI18n): TreemapNode[] {
	const children = (currentNode.children ?? []).filter((child) => child.size > 0);
	if (children.length <= MAX_CHILDREN_DISPLAY) return children;
	const visible = children.slice(0, MAX_CHILDREN_DISPLAY);
	const rest = children.slice(MAX_CHILDREN_DISPLAY);
	const bucket: TreemapNode = {
		name: L.treemapOtherBucket(rest.length, fmt(rest.reduce((sum, child) => sum + child.size, 0))),
		path: '',
		size: rest.reduce((sum, child) => sum + child.size, 0),
		isFolder: false,
		isOtherBucket: true,
	};
	return [...visible, bucket];
}

function filterTree(node: TreemapNode, category: FileCategory): TreemapNode | null {
	if (!node.isFolder) {
		return node.category === category ? node : null;
	}
	const children = (node.children ?? [])
		.map((child) => filterTree(child, category))
		.filter((child): child is TreemapNode => child !== null);
	if (children.length === 0) return null;
	return {
		...node,
		children,
		size: children.reduce((sum, child) => sum + child.size, 0),
	};
}

function chartLabel(mode: ChartMode, L: DashboardViewI18n): string {
	if (mode === 'treemap') return L.analysisChartTreemap;
	if (mode === 'sunburst') return L.analysisChartSunburst;
	if (mode === 'donut') return L.analysisChartDonut;
	return L.analysisChartBar;
}

function radialColor(node: TreemapNode, index: number): string {
	if (node.isOtherBucket) return 'var(--background-modifier-border)';
	if (!node.isFolder) return `hsl(${leafHue(node)}deg 72% 56%)`;
	return `hsl(${(index * 55) % 360}deg 58% 54%)`;
}

function leafHue(node: TreemapNode): number {
	if (node.category === 'image') return 22;
	if (node.category === 'text') return 255;
	if (node.category === 'video') return 300;
	if (node.category === 'html') return 140;
	return 165;
}

