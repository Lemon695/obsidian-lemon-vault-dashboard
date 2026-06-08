import { Setting } from 'obsidian';
import type VaultDashboardPlugin from '../../main';
import type { PluginModule } from 'core/types';
import { t } from 'i18n/locale';
import { identityModuleI18n } from 'i18n/modules/identity/module';
import { identitySettingsI18n } from 'i18n/modules/identity/settings';
import { IdentityBadge } from './identity-badge';

export class IdentityModule implements PluginModule {
	readonly id = 'identity';
	private badge: IdentityBadge | null = null;

	constructor(private readonly plugin: VaultDashboardPlugin) {}

	get name(): string {
		return t(identityModuleI18n).name;
	}

	get description(): string {
		return t(identityModuleI18n).description;
	}

	async onload(): Promise<void> {
		this.badge = new IdentityBadge(this.plugin);
		this.plugin.addChild(this.badge);

		const L = t(identityModuleI18n);
		this.plugin.addCommand({
			id: 'toggle-identity-badge',
			name: L.toggleCommand,
			callback: async () => {
				this.plugin.settings.identity.showBadge = !this.plugin.settings.identity.showBadge;
				await this.plugin.saveSettings();
				this.badge?.update();
			},
		});
	}

	onunload(): void {
		if (this.badge) {
			this.plugin.removeChild(this.badge);
			this.badge = null;
		}
	}

	renderSettings(containerEl: HTMLElement): void {
		const S = t(identitySettingsI18n);

		new Setting(containerEl).setName(S.heading).setHeading();

		new Setting(containerEl)
			.setName(S.showBadgeName)
			.setDesc(S.showBadgeDesc)
			.addToggle((tg) => {
				tg.setValue(this.plugin.settings.identity.showBadge).onChange(async (v) => {
					this.plugin.settings.identity.showBadge = v;
					await this.plugin.saveSettings();
					this.badge?.update();
				});
			});

		new Setting(containerEl)
			.setName(S.customTextName)
			.setDesc(S.customTextDesc)
			.addText((text) => {
				text.setPlaceholder(S.customTextPlaceholder)
					.setValue(this.plugin.settings.identity.customText)
					.onChange(async (v) => {
						this.plugin.settings.identity.customText = v;
						await this.plugin.saveSettings();
						this.badge?.update();
					});
			});

		new Setting(containerEl)
			.setName(S.badgeColorName)
			.setDesc(S.badgeColorDesc)
			.addColorPicker((cp) => {
				cp.setValue(this.plugin.settings.identity.badgeColor).onChange(async (v) => {
					this.plugin.settings.identity.badgeColor = v;
					await this.plugin.saveSettings();
					this.badge?.update();
				});
			});

		new Setting(containerEl)
			.setName(S.opacityName)
			.setDesc(S.opacityDesc)
			.addSlider((sl) => {
				sl.setLimits(0.1, 1, 0.1)
					.setValue(this.plugin.settings.identity.opacity)
					.setDynamicTooltip()
					.onChange(async (v) => {
						this.plugin.settings.identity.opacity = v;
						await this.plugin.saveSettings();
						this.badge?.update();
					});
			});
	}
}
