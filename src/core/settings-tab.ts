import { App, PluginSettingTab } from 'obsidian';
import type { VaultDashboardPluginLike } from './types';

export class VaultDashboardSettingTab extends PluginSettingTab {
	private readonly dashboardPlugin: VaultDashboardPluginLike;

	constructor(app: App, plugin: VaultDashboardPluginLike) {
		super(app, plugin);
		this.dashboardPlugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		for (const module of this.dashboardPlugin.moduleManager.getAll()) {
			module.renderSettings?.(containerEl);
		}
	}
}
