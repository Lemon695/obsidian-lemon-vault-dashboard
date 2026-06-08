import {
	ItemView,
	WorkspaceLeaf,
	TFile,
	FileSystemAdapter,
	Platform,
	Notice,
} from 'obsidian';
import { t } from 'i18n/locale';
import {
	dashboardViewI18n,
	type DashboardViewI18n,
} from 'i18n/modules/dashboard/view';
import { dashboardCommandsI18n } from 'i18n/modules/dashboard/commands';
import type { VaultDashboardPluginLike } from 'core/types';
import {
	parseIgnorePrefixes,
	findOrphanAttachments,
	detectDevDirectories,
	type FileSizeEntry,
	type OrphanScanResult,
} from 'shared/vault-stats';
import { formatBytes } from 'shared/format';
import { scanVaultStorage, estimateVaultDiskBytes, buildReferencedPathSet } from './scanner';
import { getAbsolutePathOnDisk } from './vault-references';
import { renderProfileSection } from './renderer/profile-section';
import { renderStatsSection } from './renderer/stats-section';
import { renderTop10Section } from './renderer/top10-section';
import {
	renderOrphanSection,
	renderOrphanListContent,
	renderBrokenLinksPanel,
	renderOrphanDetailsPanel,
} from './renderer/orphan-section';
import { buildFolderTree } from './treemap-data';
import { renderTreemapSection } from './renderer/treemap-section';
import { buildDashboardInsights } from './insights';
import {
	renderActivityPanel,
	renderGrowthPanel,
	renderRecentPanel,
} from './renderer/insight-panels';
import { createIcon } from './renderer/icon';

export const VAULT_DASHBOARD_VIEW = 'vault-dashboard-view';

type ElectronShell = {
	openPath: (path: string) => Promise<string>;
	showItemInFolder: (path: string) => void;
};

function getElectronShell(): ElectronShell | null {
	const runtime = window as Window & {
		require?: (module: string) => unknown;
	};
	const requireFn: ((module: string) => unknown) | undefined = runtime.require;
	if (!requireFn) return null;
	const electronModule = requireFn('electron');
	if (typeof electronModule !== 'object' || electronModule === null || !('shell' in electronModule)) {
		return null;
	}
	const { shell } = electronModule as { shell?: ElectronShell };
	return shell ?? null;
}

export class VaultDashboardView extends ItemView {
	private fileIndex: FileSizeEntry[] = [];
	private delegationBound = false;
	private scanAbort: AbortController | null = null;
	private orphanScanAbort: AbortController | null = null;
	private treemapObserver: ResizeObserver | null = null;
	private treemapRafId: number | null = null;
	private dismissedDevWarnings = new Set<string>();
	private orphanResult: OrphanScanResult | null = null;
	private showBrokenLinksDetails = false;
	private showOrphanDetails = false;
	private topFilesController: {
		toggleSearchMode: () => void;
		toggleCategoryPicker: () => void;
		getCategory: () => 'all' | 'text' | 'image' | 'attachment';
		hasQuery: () => boolean;
		isCategoryPickerOpen: () => boolean;
		isSearchModeOpen: () => boolean;
	} | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: VaultDashboardPluginLike
	) {
		super(leaf);
	}

	getViewType(): string {
		return VAULT_DASHBOARD_VIEW;
	}

	getDisplayText(): string {
		return t(dashboardCommandsI18n).viewTitle;
	}

	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass('vault-dashboard-root');
		if (!this.delegationBound) {
			this.registerDomEvent(this.contentEl, 'click', (ev) => {
				void this.handleDelegatedClick(ev);
			});
			this.delegationBound = true;
		}
		await this.renderDashboard();
	}

	private async handleDelegatedClick(ev: MouseEvent): Promise<void> {
		const L = t(dashboardViewI18n);
		const el = (ev.target as HTMLElement | null)?.closest('[data-vd-action]') as HTMLElement | null;
		if (!el) return;
		const action = el.getAttribute('data-vd-action');
		if (action === 'cancel-scan') {
			this.scanAbort?.abort();
			return;
		}
		if (action === 'cancel-orphan-scan') {
			this.orphanScanAbort?.abort();
			return;
		}
		if (action === 'refresh') {
			this.plugin.cache = undefined;
			await this.renderDashboard();
			new Notice(L.noticeRefreshed);
			return;
		}
		if (action === 'export-summary') {
			await this.copyDashboardSummary(L);
			return;
		}
		if (action === 'shell-search') {
			this.topFilesController?.toggleSearchMode();
			this.syncShellButtonState();
			return;
		}
		if (action === 'shell-tags') {
			this.topFilesController?.toggleCategoryPicker();
			this.syncShellButtonState();
			this.jumpToSelector(`[data-vd-section="top-files"]`);
			return;
		}
		if (action === 'shell-links') {
			this.showBrokenLinksDetails = !this.showBrokenLinksDetails;
			if (this.showBrokenLinksDetails) {
				this.showOrphanDetails = false;
			}
			await this.renderDashboard();
			this.jumpToSelector(`[data-vd-highlight="broken-links"]`);
			return;
		}
		if (action === 'shell-attachments') {
			this.showOrphanDetails = !this.showOrphanDetails || this.orphanResult === null;
			if (this.showOrphanDetails) {
				this.showBrokenLinksDetails = false;
			}
			await this.renderDashboard();
			this.jumpToSelector(`[data-vd-highlight="orphans"]`);
			if (!this.orphanResult) {
				const scanBtn = this.contentEl.querySelector<HTMLButtonElement>(
					`.vault-dashboard-orphans [data-vd-action="scan-orphans"]`
				);
				if (scanBtn) scanBtn.click();
			}
			return;
		}
		if (action === 'copy-path') {
			await this.copyText(el.getAttribute('data-vd-path') ?? '', L.noticeCopied, L.noticeCopyFailed, L.noticePathUnavailable, L.pathUnavailable);
			return;
		}
		if (action === 'copy-vault-path') {
			await this.copyText(el.getAttribute('data-vd-path') ?? '', L.noticeCopiedVaultPath, L.noticeCopyFailed, L.noticePathUnavailable);
			return;
		}
		if (action === 'open-in-system') {
			await this.openInSystem(el.getAttribute('data-vd-path') ?? '', L);
			return;
		}
		if (action === 'open-file') {
			const path = el.getAttribute('data-vd-path');
			if (path) await this.openVaultFile(path);
			return;
		}
		if (action === 'reveal-in-system') {
			const path = el.getAttribute('data-vd-path');
			if (path) await this.revealInSystem(path, L);
			return;
		}
		if (action === 'auto-ignore') {
			await this.addIgnorePrefix(el.getAttribute('data-vd-path') ?? '', L);
			return;
		}
		if (action === 'scan-orphans') {
			const btn = el as HTMLButtonElement;
			const mount = el.closest('.vault-dashboard-orphans')?.querySelector('.vault-dashboard-orphans-result') as HTMLElement | null;
			if (mount) void this.runOrphanScan(mount, btn, L);
		}
	}

	private syncShellButtonState(): void {
		const map: Record<string, boolean> = {
			'shell-search': this.topFilesController?.isSearchModeOpen() ?? false,
			'shell-tags':
				(this.topFilesController?.getCategory() ?? 'all') !== 'all' ||
				(this.topFilesController?.isCategoryPickerOpen() ?? false),
			'shell-links': this.showBrokenLinksDetails,
			'shell-attachments': this.showOrphanDetails,
		};
		for (const [action, active] of Object.entries(map)) {
			const btn = this.contentEl.querySelector<HTMLElement>(`.vault-dashboard-shell-tool[data-vd-action="${action}"]`);
			if (!btn) continue;
			btn.toggleClass('is-active', active);
		}
	}

	private jumpToSelector(selector: string): void {
		const target = this.contentEl.querySelector<HTMLElement>(selector);
		if (!target) return;
		target.scrollIntoView({ behavior: 'smooth', block: 'center' });
		target.classList.add('vault-dashboard-target-ping');
		window.setTimeout(() => target.classList.remove('vault-dashboard-target-ping'), 1400);
	}

	private async runOrphanScan(mount: HTMLElement, btn: HTMLButtonElement, L: DashboardViewI18n): Promise<void> {
		const label = btn.textContent;
		btn.disabled = true;
		btn.textContent = L.scanning;
		this.orphanScanAbort?.abort();
		this.orphanScanAbort = new AbortController();
		const signal = this.orphanScanAbort.signal;
		mount.empty();
		const progressRow = mount.createDiv({ cls: 'vault-dashboard-orphan-progress' });
		const progressText = progressRow.createDiv({ text: L.buildingReferenceIndex, cls: 'vault-dashboard-muted' });
		const cancelBtn = progressRow.createEl('button', { text: L.cancelScan, cls: 'mod-warning' });
		cancelBtn.setAttribute('data-vd-action', 'cancel-orphan-scan');
		const deep = this.plugin.settings.dashboard.deepLinkScanForOrphans;
		const body = this.plugin.settings.dashboard.useBodyLinkScan;
		if (!deep && !body) cancelBtn.addClass('vault-dashboard-cancel--hidden');
		try {
			const referenced = await buildReferencedPathSet(this.app, {
				includeMetadataLinks: deep,
				useBodyLinkScan: body,
				yieldEvery: 25,
				signal,
				onMarkdownProgress: (done, total) => {
					progressText.setText(L.referenceScanProgress(done, total));
				},
			});
			this.orphanResult = findOrphanAttachments({ fileSizes: this.fileIndex, referencedPaths: referenced });
			progressRow.remove();
			renderOrphanListContent(mount, L, this.orphanResult);
			await this.renderDashboard();
		} catch (error) {
			progressRow.remove();
			if (error instanceof DOMException && error.name === 'AbortError') {
				mount.createDiv({ text: L.scanCancelled, cls: 'vault-dashboard-warn' });
			} else {
				mount.createDiv({ text: L.orphanScanFailed, cls: 'vault-dashboard-warn' });
			}
		} finally {
			this.orphanScanAbort = null;
			btn.disabled = false;
			btn.textContent = label ?? L.scanOrphans;
		}
	}

	private async renderDashboard(): Promise<void> {
		const L = t(dashboardViewI18n);
		const root = this.contentEl;
		root.empty();
		this.renderShell(root);
		const scrollEl = root.createDiv({ cls: 'vault-dashboard-scroll' });
		const page = scrollEl.createDiv({ cls: 'vault-dashboard-page' });
		const header = page.createDiv({ cls: 'vault-dashboard-header' });
		this.renderHeader(header, L, this.plugin.cache?.timestamp ?? Date.now(), this.plugin.cache?.scanResult.fileSizes.length ?? this.fileIndex.length);
		const statusRow = page.createDiv({ cls: 'vault-dashboard-status' });
		const progressEl = statusRow.createDiv({ cls: 'vault-dashboard-muted' });
		const cancelBtn = statusRow.createEl('button', { text: L.cancelScan, cls: 'mod-warning vault-dashboard-cancel' });
		cancelBtn.setAttribute('data-vd-action', 'cancel-scan');
		const body = page.createDiv({ cls: 'vault-dashboard-body' });
		this.scanAbort?.abort();
		const ac = new AbortController();
		this.scanAbort = ac;
		const signal = ac.signal;
		const fmt = (b: number) => formatBytes(b, L.byteUnits, L.byteZero);
		const prefixes = parseIgnorePrefixes(this.plugin.settings.dashboard.ignorePathPrefixes);
		progressEl.setText(L.calculating);
		let scanResult = this.plugin.cache?.scanResult;
		let diskBytes: number | null = this.plugin.cache?.diskBytes ?? null;
		try {
			if (!scanResult) {
				scanResult = await scanVaultStorage(this.app, {
					ignorePrefixes: prefixes,
					signal,
					yieldEvery: this.plugin.settings.dashboard.scanYieldEvery,
					onProgress: (done, total) => progressEl.setText(L.scanProgress(done, total)),
				});
				if (this.plugin.settings.dashboard.showDiskFolderEstimate && Platform.isDesktopApp && this.app.vault.adapter instanceof FileSystemAdapter) {
					progressEl.setText(L.scanningDiskEntries(0));
					diskBytes = await estimateVaultDiskBytes(this.app.vault.adapter, {
						signal,
						ignorePrefixes: prefixes,
						yieldEvery: Math.max(25, this.plugin.settings.dashboard.scanYieldEvery * 2 || 25),
						onProgress: (visited) => progressEl.setText(L.scanningDiskEntries(visited)),
					});
				}
				this.plugin.cache = { scanResult, diskBytes, timestamp: Date.now() };
			}
			const headerTimestamp = this.plugin.cache?.timestamp ?? Date.now();
			const headerCount = scanResult.fileSizes.length;
			header.empty();
			this.renderHeader(header, L, headerTimestamp, headerCount);
			statusRow.addClass('vault-dashboard-status--hidden');
			this.fileIndex = scanResult.fileSizes;
			const insights = buildDashboardInsights(this.app, scanResult, this.orphanResult?.orphans.length ?? 0);
			this.renderDevWarnings(page, scanResult, prefixes, L);
			const vaultName = this.app.vault.getName();
			const basePath = this.app.vault.adapter instanceof FileSystemAdapter ? this.app.vault.adapter.getBasePath() : L.pathUnavailable;
			renderProfileSection(body, scanResult, insights, diskBytes, L, fmt);
			const grid = body.createDiv({ cls: 'vault-dashboard-grid' });
			const main = grid.createDiv({ cls: 'vault-dashboard-grid-main' });
			const side = grid.createDiv({ cls: 'vault-dashboard-grid-side' });
			const tree = buildFolderTree(scanResult.fileSizes);
			const treemap = renderTreemapSection(main, tree, L, fmt);
			renderGrowthPanel(main, insights.growth, L);
			renderActivityPanel(main, insights.activity, {
				lastSevenDayAverageEdits: insights.lastSevenDayAverageEdits,
				lastDayEditedTotal: insights.lastDayEditedTotal,
				lastDayCreatedTotal: insights.lastDayCreatedTotal,
				weekEditedTotal: insights.weekEditedTotal,
			}, L);
				this.topFilesController = renderTop10Section(main, scanResult.fileSizes, L, fmt, {
					onStateChange: () => this.syncShellButtonState(),
				});
				renderStatsSection(side, L, vaultName, basePath, insights.initializedDays);
				renderOrphanSection(side, L, insights.health, {
					showBrokenDetails: this.showBrokenLinksDetails,
					showOrphanDetails: this.showOrphanDetails,
				});
				if (this.showBrokenLinksDetails) {
					renderBrokenLinksPanel(side, L, insights.health);
				}
				if (this.showOrphanDetails) {
					renderOrphanDetailsPanel(side, L, this.orphanResult);
				}
				renderRecentPanel(side, insights.recentItems, L);
				if (this.orphanResult) {
					const mount = side.querySelector('.vault-dashboard-orphans-result');
					if (mount instanceof HTMLElement) renderOrphanListContent(mount, L, this.orphanResult);
				}
				this.syncShellButtonState();
				window.setTimeout(() => treemap.update(), 80);
				this.bindTreemapResize(main, treemap.resize);
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				body.empty();
				body.createDiv({ text: L.scanCancelled, cls: 'vault-dashboard-warn' });
				progressEl.setText('');
				cancelBtn.addClass('vault-dashboard-cancel--hidden');
				return;
			}
			throw error;
		}
	}

	private renderShell(root: HTMLElement): void {
		const L = t(dashboardViewI18n);
		const shell = root.createDiv({ cls: 'vault-dashboard-shell' });
		const inner = shell.createDiv({ cls: 'vault-dashboard-shell-inner' });
		inner.createDiv({ cls: 'vault-dashboard-shell-dots' });
		const tabs = inner.createDiv({ cls: 'vault-dashboard-shell-tabs' });
		this.createShellTab(tabs, 'pie-chart', L.title, true);
		this.createShellTab(tabs, 'file-text', L.shellHome);
		this.createShellTab(tabs, 'calendar', new Date().toLocaleDateString());
		const tools = inner.createDiv({ cls: 'vault-dashboard-shell-tools' });
		for (const item of [
			{ icon: 'search', action: 'shell-search', label: L.shellActionSearch },
			{ icon: 'tag', action: 'shell-tags', label: L.shellActionTags },
			{ icon: 'link', action: 'shell-links', label: L.shellActionLinks },
			{ icon: 'paperclip', action: 'shell-attachments', label: L.shellActionAttachments },
		]) {
			const btn = tools.createEl('button', { cls: 'vault-dashboard-shell-tool', attr: { 'aria-label': item.label, title: item.label } });
			btn.setAttribute('data-vd-action', item.action);
			createIcon(btn, item.icon);
		}
	}

	private createShellTab(parent: HTMLElement, icon: string, label: string, active = false): void {
		const tab = parent.createDiv({ cls: active ? 'vault-dashboard-shell-tab is-active' : 'vault-dashboard-shell-tab' });
		createIcon(tab, icon);
		tab.createSpan({ text: label });
	}

	private renderHeader(header: HTMLElement, L: DashboardViewI18n, timestamp: number, fileCount: number): void {
		const left = header.createDiv({ cls: 'vault-dashboard-header-main' });
		const breadcrumb = left.createDiv({ cls: 'vault-dashboard-header-breadcrumb' });
		createIcon(breadcrumb, 'database', 'vault-dashboard-inline-icon');
		breadcrumb.createSpan({ text: L.breadcrumbVault });
		breadcrumb.createSpan({ text: '›' });
		breadcrumb.createSpan({ text: this.app.vault.getName() });
		breadcrumb.createSpan({ text: '›' });
		breadcrumb.createSpan({ text: L.title, cls: 'is-current' });
		left.createEl('h1', { text: L.title, cls: 'vault-dashboard-page-title' });
		left.createDiv({ text: L.headerSubtitle(timestamp, fileCount), cls: 'vault-dashboard-page-subtitle' });
		const actions = header.createDiv({ cls: 'vault-dashboard-header-actions' });
		const range = actions.createDiv({ cls: 'vault-dashboard-pill vault-dashboard-pill--icon' });
		createIcon(range, 'calendar');
		range.createSpan({ text: L.rangeLast90Days });
		const refreshBtn = actions.createEl('button', { cls: 'vault-dashboard-btn vault-dashboard-btn--icon' });
		refreshBtn.setAttribute('data-vd-action', 'refresh');
		createIcon(refreshBtn, 'refresh-cw');
		refreshBtn.createSpan({ text: L.refresh });
		const exportBtn = actions.createEl('button', { cls: 'vault-dashboard-btn vault-dashboard-btn--icon' });
		exportBtn.setAttribute('data-vd-action', 'export-summary');
		createIcon(exportBtn, 'download');
		exportBtn.createSpan({ text: L.exportSummary });
	}

	private renderDevWarnings(page: HTMLElement, scanResult: { fileSizes: FileSizeEntry[] }, prefixes: string[], L: DashboardViewI18n): void {
		const devDirs = detectDevDirectories(scanResult.fileSizes, prefixes);
		for (const { path: devPath, fileCount } of devDirs) {
			if (this.dismissedDevWarnings.has(devPath)) continue;
			const banner = page.createDiv({ cls: 'vault-dashboard-dev-warning' });
			const info = banner.createDiv({ cls: 'vault-dashboard-dev-warning-info' });
			createIcon(info, 'triangle-alert');
			info.createSpan({ text: L.devDirWarning(devPath, fileCount) });
			const actions = banner.createDiv({ cls: 'vault-dashboard-dev-warning-actions' });
			const ignoreBtn = actions.createEl('button', { text: L.devDirAddIgnore });
			ignoreBtn.setAttribute('data-vd-action', 'auto-ignore');
			ignoreBtn.setAttribute('data-vd-path', devPath);
			const dismissBtn = actions.createEl('button', { text: L.devDirDismiss, cls: 'mod-muted' });
			dismissBtn.addEventListener('click', () => {
				this.dismissedDevWarnings.add(devPath);
				banner.remove();
			});
		}
	}

	private bindTreemapResize(main: HTMLElement, onResize: () => void): void {
		if (!window.ResizeObserver) return;
		this.treemapObserver?.disconnect();
		this.treemapObserver = new ResizeObserver(() => {
			if (this.treemapRafId !== null) cancelAnimationFrame(this.treemapRafId);
			this.treemapRafId = window.requestAnimationFrame(() => {
				this.treemapRafId = null;
				onResize();
			});
		});
		this.treemapObserver.observe(main);
	}

	private async addIgnorePrefix(path: string, L: DashboardViewI18n): Promise<void> {
		if (!path) return;
		const current = this.plugin.settings.dashboard.ignorePathPrefixes.trim();
		this.plugin.settings.dashboard.ignorePathPrefixes = current ? `${current}\n${path}` : path;
		await this.plugin.saveSettings();
		this.plugin.cache = undefined;
		new Notice(L.noticeIgnoreAdded);
		await this.renderDashboard();
	}

	private async copyDashboardSummary(L: DashboardViewI18n): Promise<void> {
		if (!this.plugin.cache) {
			new Notice(L.noticeExportUnavailable);
			return;
		}
		const summary = [
			L.title,
			`${L.totalStorage}: ${formatBytes(this.plugin.cache.scanResult.totalSize, L.byteUnits, L.byteZero)}`,
			`${L.totalFiles}: ${this.plugin.cache.scanResult.fileSizes.length}`,
			`${L.totalFolders}: ${this.plugin.cache.scanResult.folderCount}`,
		].join('\n');
		await this.copyText(summary, L.noticeExported, L.noticeCopyFailed);
	}

	private async copyText(
		text: string,
		successNotice: string,
		failureNotice: string,
		emptyNotice?: string,
		emptySentinel?: string
	): Promise<void> {
		if (!text || (emptySentinel && text === emptySentinel)) {
			if (emptyNotice) new Notice(emptyNotice);
			return;
		}
		try {
			await navigator.clipboard.writeText(text);
			new Notice(successNotice);
		} catch {
			new Notice(failureNotice);
		}
	}

	private async openInSystem(path: string, L: DashboardViewI18n): Promise<void> {
		if (!path || path === L.pathUnavailable) {
			new Notice(L.noticeFilesystemUnavailable);
			return;
		}
		if (!Platform.isDesktopApp) {
			new Notice(L.noticeDesktopOnly);
			return;
		}
		try {
			const shell = getElectronShell();
			if (!shell) throw new Error('Electron shell unavailable');
			const error = await shell.openPath(path);
			if (error) new Notice(error);
		} catch {
			new Notice(L.noticeOpenFolderFailed);
		}
	}

	private async openVaultFile(path: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return;
		const leaf = this.app.workspace.getLeaf(false);
		if (leaf) await leaf.openFile(file);
	}

	private async revealInSystem(path: string, L: DashboardViewI18n): Promise<void> {
		if (!Platform.isDesktopApp) {
			new Notice(L.noticeDesktopOnly);
			return;
		}
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) return;
		const absolute = getAbsolutePathOnDisk(file, this.app);
		if (!absolute) {
			new Notice(L.noticeRevealUnavailable);
			return;
		}
		try {
			const shell = getElectronShell();
			if (!shell) throw new Error('Electron shell unavailable');
			shell.showItemInFolder(absolute);
		} catch {
			new Notice(L.noticeRevealFailed);
		}
	}

	async onClose(): Promise<void> {
		this.scanAbort?.abort();
		this.orphanScanAbort?.abort();
		if (this.treemapRafId !== null) {
			cancelAnimationFrame(this.treemapRafId);
			this.treemapRafId = null;
		}
		this.treemapObserver?.disconnect();
		this.treemapObserver = null;
		this.contentEl.empty();
	}
}
