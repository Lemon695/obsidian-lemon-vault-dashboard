import type VaultDashboardPlugin from '../main';
import type { PluginModule } from './types';

export class ModuleManager {
	private readonly registry: Map<string, PluginModule> = new Map();
	private readonly loaded: Set<string> = new Set();

	constructor(private readonly plugin: VaultDashboardPlugin) {}

	register(module: PluginModule): void {
		this.registry.set(module.id, module);
	}

	async loadAll(): Promise<void> {
		for (const module of this.registry.values()) {
			if (this.isEnabled(module.id)) {
				await module.onload();
				this.loaded.add(module.id);
			}
		}
	}

	unloadAll(): void {
		for (const module of this.registry.values()) {
			if (this.loaded.has(module.id)) {
				module.onunload();
				this.loaded.delete(module.id);
			}
		}
	}

	async enableModule(id: string): Promise<void> {
		const module = this.registry.get(id);
		if (!module || this.loaded.has(id)) return;
		this.plugin.settings.moduleEnabled[id] = true;
		await this.plugin.saveSettings();
		await module.onload();
		this.loaded.add(id);
	}

	async disableModule(id: string): Promise<void> {
		const module = this.registry.get(id);
		if (!module || !this.loaded.has(id)) return;
		module.onunload();
		this.loaded.delete(id);
		this.plugin.settings.moduleEnabled[id] = false;
		await this.plugin.saveSettings();
	}

	getAll(): PluginModule[] {
		return [...this.registry.values()];
	}

	isEnabled(id: string): boolean {
		return this.plugin.settings.moduleEnabled[id] !== false;
	}
}
