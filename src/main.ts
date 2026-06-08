import { Plugin, WorkspaceLeaf } from 'obsidian';
import { t } from 'i18n/locale';
import { dashboardCommandsI18n } from 'i18n/modules/dashboard/commands';
import { VaultDashboardSettingTab } from 'core/settings-tab';
import { ModuleManager } from 'core/module-manager';
import { DEFAULT_SETTINGS, migrateSettings, type PluginSettings, type DashboardCache } from 'core/types';
import { DashboardModule, VAULT_DASHBOARD_VIEW, VaultDashboardView } from './modules/dashboard';
import { IdentityModule } from './modules/identity';

export default class VaultDashboardPlugin extends Plugin {
	settings: PluginSettings = { ...DEFAULT_SETTINGS };
	moduleManager!: ModuleManager;
	cache?: DashboardCache;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.moduleManager = new ModuleManager(this);

		const dashboardModule = new DashboardModule(this);
		this.moduleManager.register(dashboardModule);

		const identityModule = new IdentityModule(this);
		this.moduleManager.register(identityModule);

		const cmd = t(dashboardCommandsI18n);

		this.registerView(
			VAULT_DASHBOARD_VIEW,
			(leaf: WorkspaceLeaf) => new VaultDashboardView(leaf, this)
		);

		this.addRibbonIcon('pie-chart', cmd.ribbonTooltip, () => {
			void this.activateView();
		});

		this.addCommand({
			id: 'open-info-panel',
			name: cmd.commandOpenPanel,
			callback: () => {
				void this.activateView();
			},
		});

		this.addSettingTab(new VaultDashboardSettingTab(this.app, this));

		await this.moduleManager.loadAll();
	}

	onunload(): void {
		this.moduleManager?.unloadAll();
	}

	async loadSettings(): Promise<void> {
		this.settings = migrateSettings(await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;

		const leaves = workspace.getLeavesOfType(VAULT_DASHBOARD_VIEW);

		if (leaves.length > 0) {
			const leaf = leaves[0];
			if (leaf) {
				void workspace.revealLeaf(leaf);
			}
		} else {
			const leaf = workspace.getLeaf('tab');
			if (leaf) {
				await leaf.setViewState({ type: VAULT_DASHBOARD_VIEW, active: true });
				void workspace.revealLeaf(leaf);
			}
		}
	}
}
