import { Setting } from 'obsidian';
import type VaultDashboardPlugin from '../../main';
import type { PluginModule } from 'core/types';
import { t } from 'i18n/locale';
import { dashboardModuleI18n } from 'i18n/modules/dashboard/module';
import { dashboardSettingsI18n } from 'i18n/modules/dashboard/settings';

export { VAULT_DASHBOARD_VIEW, VaultDashboardView } from './dashboard-view';
export {
	scanVaultStorage,
	findOrphanAttachments,
	formatBytes,
	categoryForFile,
	countFoldersUnder,
	parseIgnorePrefixes,
	estimateVaultDiskBytes,
	shouldIgnoreVaultPath,
	ORPHAN_SKIP_EXTENSIONS,
	type VaultScanResult,
	type FileSizeEntry,
	type FileCategory,
	type ScanVaultStorageOptions,
	type OrphanScanResult,
} from './vault-stats';
export {
	buildReferencedPathSet,
	getAbsolutePathOnDisk,
	type BuildReferenceSetOptions,
} from './vault-references';

export class DashboardModule implements PluginModule {
	readonly id = 'dashboard';

	constructor(private readonly plugin: VaultDashboardPlugin) {}

	get name(): string {
		return t(dashboardModuleI18n).name;
	}

	get description(): string {
		return t(dashboardModuleI18n).description;
	}

	async onload(): Promise<void> {}

	onunload(): void {}

	renderSettings(containerEl: HTMLElement): void {
		const S = t(dashboardSettingsI18n);

		new Setting(containerEl).setName(S.heading).setHeading();

		new Setting(containerEl)
			.setName(S.ignorePrefixesName)
			.setDesc(S.ignorePrefixesDesc)
			.addTextArea((tc) => {
				tc.setPlaceholder(S.ignorePrefixesPlaceholder)
					.setValue(this.plugin.settings.dashboard.ignorePathPrefixes)
					.onChange(async (v) => {
						this.plugin.settings.dashboard.ignorePathPrefixes = v;
						await this.plugin.saveSettings();
					});
				tc.inputEl.rows = 6;
				tc.inputEl.addClass('vault-dashboard-settings-textarea');
			});

		new Setting(containerEl)
			.setName(S.diskEstimateName)
			.setDesc(S.diskEstimateDesc)
			.addToggle((tg) => {
				tg.setValue(this.plugin.settings.dashboard.showDiskFolderEstimate).onChange(
					async (v) => {
						this.plugin.settings.dashboard.showDiskFolderEstimate = v;
						await this.plugin.saveSettings();
					}
				);
			});

		new Setting(containerEl)
			.setName(S.yieldEveryName)
			.setDesc(S.yieldEveryDesc)
			.addSlider((sl) => {
				sl.setLimits(0, 100, 5)
					.setValue(this.plugin.settings.dashboard.scanYieldEvery)
					.setDynamicTooltip()
					.onChange(async (v) => {
						this.plugin.settings.dashboard.scanYieldEvery = v;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(S.deepOrphanScanName)
			.setDesc(S.deepOrphanScanDesc)
			.addToggle((tg) => {
				tg.setValue(this.plugin.settings.dashboard.deepLinkScanForOrphans).onChange(
					async (v) => {
						this.plugin.settings.dashboard.deepLinkScanForOrphans = v;
						await this.plugin.saveSettings();
					}
				);
			});
		new Setting(containerEl)
			.setName(S.useBodyLinkScanName)
			.setDesc(S.useBodyLinkScanDesc)
			.addToggle((tg) => {
				tg.setValue(this.plugin.settings.dashboard.useBodyLinkScan).onChange(async (v) => {
					this.plugin.settings.dashboard.useBodyLinkScan = v;
					await this.plugin.saveSettings();
				});
			});
	}
}

