import type { DashboardViewI18n } from 'i18n/modules/dashboard/view';
import type { FileSizeEntry, FileCategory } from 'shared/vault-stats';
import { categoryForFile } from 'shared/vault-stats';
import { createIcon } from './icon';

const COUNT_OPTIONS = [10, 20, 50] as const;
const CATEGORY_OPTIONS = ['all', 'text', 'image', 'attachment'] as const;

type SortMode = 'size' | 'recent';
type CategoryFilter = typeof CATEGORY_OPTIONS[number];

export interface TopFilesController {
	toggleSearchMode: () => void;
	toggleCategoryPicker: () => void;
	getCategory: () => CategoryFilter;
	hasQuery: () => boolean;
	isCategoryPickerOpen: () => boolean;
	isSearchModeOpen: () => boolean;
}

export function renderTop10Section(
	parent: HTMLElement,
	fileSizes: FileSizeEntry[],
	L: DashboardViewI18n,
	fmt: (b: number) => string,
	options?: {
		categoryPickerOpen?: boolean;
		onStateChange?: () => void;
	}
): TopFilesController {
	const card = parent.createDiv({ cls: 'vault-dashboard-panel vault-dashboard-top-files-panel' });
	card.setAttribute('data-vd-section', 'top-files');
	let count = 10;
	let sortMode: SortMode = 'size';
	let query = '';
	let category: CategoryFilter = 'all';
	let searchOpen = false;
	let categoryPickerOpen = options?.categoryPickerOpen ?? false;

	const header = card.createDiv({ cls: 'vault-dashboard-panel-head' });
	const titleGroup = header.createDiv({ cls: 'vault-dashboard-panel-title-group' });
	titleGroup.createEl('h3', { text: L.topFilesTitle, cls: 'vault-dashboard-panel-title' });
	titleGroup.createDiv({ text: L.topFilesHint, cls: 'vault-dashboard-panel-hint' });

	const searchRow = card.createDiv({ cls: 'vault-dashboard-top-files-search-row' });
	const searchWrap = searchRow.createDiv({ cls: 'vault-dashboard-top-files-search' });
	createIcon(searchWrap, 'search');
	const searchInput = searchWrap.createEl('input', { type: 'search', attr: { placeholder: L.topFilesSearchPlaceholder, 'data-vd-search-input': 'top-files' } });
	searchInput.addEventListener('input', () => {
		query = searchInput.value.trim().toLowerCase();
		render();
	});
	const categoryGroup = searchRow.createDiv({ cls: 'vault-dashboard-segmented vault-dashboard-top-files-category' });
	const stateRow = card.createDiv({ cls: 'vault-dashboard-top-files-state-row' });

	const controls = header.createDiv({ cls: 'vault-dashboard-panel-controls' });
	const countGroup = controls.createDiv({ cls: 'vault-dashboard-segmented' });
	const sortGroup = controls.createDiv({ cls: 'vault-dashboard-segmented' });
	const table = card.createDiv({ cls: 'vault-dashboard-table' });

	const render = () => {
		searchWrap.toggleClass('vault-dashboard-top-files-search--hidden', !searchModeVisible(query, searchOpen));
		renderSegmented(countGroup, COUNT_OPTIONS.map(String), String(count), (value) => {
			count = Number(value);
			render();
		});
		renderSegmented(sortGroup, ['size', 'recent'], sortMode, (value) => {
			sortMode = value as SortMode;
			render();
		}, (value) => (value === 'size' ? L.topFilesSortSize : L.topFilesSortRecent));
			renderSegmented(categoryGroup, [...CATEGORY_OPTIONS], category, (value) => {
				category = value as CategoryFilter;
				render();
			}, (value) => categoryLabel(value as CategoryFilter, L));
			categoryGroup.toggleClass('vault-dashboard-top-files-category--hidden', !categoryPickerOpen);
		renderStateRow(stateRow, category, query, L);
		renderTable(table, fileSizes, count, sortMode, category, query, L, fmt);
		options?.onStateChange?.();
	};

	render();

	return {
		toggleSearchMode: () => {
			searchOpen = query.length > 0 ? true : !searchOpen;
			if (searchOpen) {
				categoryPickerOpen = false;
			}
			render();
			card.scrollIntoView({ behavior: 'smooth', block: 'start' });
			window.setTimeout(() => searchInput.focus(), 180);
			searchInput.classList.add('is-focused-by-shell');
			window.setTimeout(() => searchInput.classList.remove('is-focused-by-shell'), 1400);
		},
		toggleCategoryPicker: () => {
			categoryPickerOpen = !categoryPickerOpen;
			if (categoryPickerOpen) {
				searchOpen = false;
			}
			render();
		},
		getCategory: () => category,
		hasQuery: () => query.length > 0,
		isCategoryPickerOpen: () => categoryPickerOpen,
		isSearchModeOpen: () => searchModeVisible(query, searchOpen),
	};
}

function searchModeVisible(query: string, searchOpen: boolean): boolean {
	return searchOpen || query.length > 0;
}

function renderStateRow(
	parent: HTMLElement,
	category: CategoryFilter,
	query: string,
	L: DashboardViewI18n
): void {
	parent.empty();
	if (category !== 'all') {
		parent.createDiv({
			text: `${L.shellActionTags} · ${categoryLabel(category, L)}`,
			cls: 'vault-dashboard-state-pill',
		});
	}
	if (query) {
		parent.createDiv({
			text: `${L.shellActionSearch} · ${query}`,
			cls: 'vault-dashboard-state-pill',
		});
	}
}

function renderSegmented(
	parent: HTMLElement,
	options: readonly string[],
	active: string,
	onSelect: (value: string) => void,
	toLabel: (value: string) => string = (value) => value
): void {
	parent.empty();
	for (const value of options) {
		const btn = parent.createEl('button', { text: toLabel(value), cls: active === value ? 'is-active' : '' });
		btn.addEventListener('click', () => {
			if (value !== active) onSelect(value);
		});
	}
}

function renderTable(
	parent: HTMLElement,
	fileSizes: FileSizeEntry[],
	count: number,
	sortMode: SortMode,
	category: CategoryFilter,
	query: string,
	L: DashboardViewI18n,
	fmt: (b: number) => string
): void {
	parent.empty();
	const header = parent.createDiv({ cls: 'vault-dashboard-table-head' });
	for (const text of ['', L.topFilesPathColumn, L.topFilesShareColumn, L.topFilesSizeColumn, L.topFilesModifiedColumn]) {
		header.createDiv({ text, cls: 'vault-dashboard-table-cell is-head' });
	}
	const rows = [...fileSizes]
		.filter((item) => {
			const matchesQuery = !query || item.file.path.toLowerCase().includes(query) || item.file.name.toLowerCase().includes(query);
			const fileCategory = normalizeCategory(categoryForFile(item.file));
			const matchesCategory = category === 'all' || fileCategory === category;
			return matchesQuery && matchesCategory;
		})
		.sort((left, right) => sortMode === 'size' ? right.size - left.size : right.file.stat.mtime - left.file.stat.mtime)
		.slice(0, count);

	if (rows.length === 0) {
		const empty = parent.createDiv({ cls: 'vault-dashboard-table-empty' });
		empty.setText(L.topFilesEmpty);
		return;
	}

	const max = rows[0]?.size ?? 1;
	for (const item of rows) {
		const row = parent.createDiv({ cls: 'vault-dashboard-table-row' });
		const categoryKey = normalizeCategory(categoryForFile(item.file));
		const iconCell = row.createDiv({ cls: `vault-dashboard-table-icon is-${categoryKey}` });
		createIcon(iconCell, iconForCategory(categoryKey));
		const pathCell = row.createDiv({ cls: 'vault-dashboard-table-path' });
		const name = pathCell.createSpan({ text: item.file.name, cls: 'vault-dashboard-table-title' });
		name.setAttribute('data-vd-action', 'open-file');
		name.setAttribute('data-vd-path', item.file.path);
		pathCell.createDiv({ text: item.file.path, cls: 'vault-dashboard-table-subtitle' });
		const shareCell = row.createDiv({ cls: 'vault-dashboard-table-share' });
		const track = shareCell.createDiv({ cls: 'vault-dashboard-table-share-track' });
		track.createDiv({ cls: `vault-dashboard-table-share-bar is-${categoryKey}`, attr: { style: `width:${Math.max(6, (item.size / max) * 100)}%` } });
		row.createDiv({ text: fmt(item.size), cls: 'vault-dashboard-table-size' });
		row.createDiv({ text: formatDate(item.file.stat.mtime), cls: 'vault-dashboard-table-modified' });
	}
}

function normalizeCategory(category: FileCategory): CategoryFilter {
	if (category === 'text') return 'text';
	if (category === 'image') return 'image';
	return 'attachment';
}

function categoryLabel(category: CategoryFilter, L: DashboardViewI18n): string {
	switch (category) {
		case 'text': return L.metricText;
		case 'image': return L.metricImages;
		case 'attachment': return L.metricAttachments;
		default: return L.treemapFilterAll;
	}
}

function iconForCategory(category: CategoryFilter): string {
	switch (category) {
		case 'image': return 'image';
		case 'text': return 'file-text';
		default: return 'paperclip';
	}
}

function formatDate(timestamp: number): string {
	return new Date(timestamp).toISOString().slice(0, 10);
}
