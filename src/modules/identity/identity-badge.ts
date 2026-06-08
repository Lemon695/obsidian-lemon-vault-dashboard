import { Component, setIcon } from 'obsidian';
import type VaultDashboardPlugin from '../../main';
import { t } from 'i18n/locale';
import { identityModuleI18n } from 'i18n/modules/identity/module';

const RIGHT_SIDEBAR_SELECTOR = '.workspace-split.mod-right-split';
const STATUS_BAR_SELECTOR = '.status-bar';
const FALLBACK_STATUS_BAR_HEIGHT = 32;

export class IdentityBadge extends Component {
	private badgeEl: HTMLDivElement | null = null;
	private layoutObserver: ResizeObserver | null = null;

	constructor(private readonly plugin: VaultDashboardPlugin) {
		super();
	}

	onload(): void {
		this.plugin.app.workspace.onLayoutReady(() => {
			this.render();
			this.setupLayoutObserver();
			// Also resubscribe and sync on layout changes (sidebar toggle, pane open/close)
			this.registerEvent(
				this.plugin.app.workspace.on('layout-change', () => {
					this.setupLayoutObserver();
					this.syncLayout();
				})
			);
		});
	}

	onunload(): void {
		this.layoutObserver?.disconnect();
		this.layoutObserver = null;
		this.removeBadge();
	}

	update(): void {
		this.render();
		this.setupLayoutObserver();
		this.syncLayout();
	}

	private getDoc(): Document {
		return this.plugin.app.workspace.containerEl.ownerDocument;
	}

	private render(): void {
		const settings = this.plugin.settings.identity;
		const doc = this.getDoc();

		if (!settings.showBadge) {
			this.removeBadge();
			return;
		}

		const badgeEl = this.badgeEl ?? doc.body.createDiv('vault-identity-badge');
		this.badgeEl = badgeEl;
		badgeEl.onclick = () => { void this.plugin.activateView(); };

		const L = t(identityModuleI18n);
		const vaultName = settings.customText || this.plugin.app.vault.getName();
		const initial = vaultName.charAt(0).toUpperCase();

		badgeEl.empty();

		// Avatar: colored rounded square with vault initial
		const avatarEl = badgeEl.createDiv('vault-identity-avatar');
		avatarEl.setText(initial);

		// Text block: vault name + sub-label
		const infoEl = badgeEl.createDiv('vault-identity-info');
		infoEl.createDiv('vault-identity-name').setText(vaultName);
		infoEl.createDiv('vault-identity-sub').setText(L.badgeSub);

		// Chevron — appears on hover via CSS
		const actionEl = badgeEl.createDiv('vault-identity-action');
		setIcon(actionEl, 'chevron-right');

		// CSS custom properties
		badgeEl.style.setProperty('--badge-opacity', settings.opacity.toString());
		if (settings.badgeColor) {
			badgeEl.style.setProperty('--badge-color', settings.badgeColor);
		} else {
			badgeEl.style.removeProperty('--badge-color');
		}

		this.syncLayout();
	}

	private setupLayoutObserver(): void {
		this.layoutObserver?.disconnect();
		if (!window.ResizeObserver) return;
		const doc = this.getDoc();

		this.layoutObserver = new ResizeObserver(() => { this.syncLayout(); });
		const sidebarEl = doc.querySelector<HTMLElement>(RIGHT_SIDEBAR_SELECTOR);
		const statusBarEl = doc.querySelector<HTMLElement>(STATUS_BAR_SELECTOR);

		if (sidebarEl) {
			this.layoutObserver.observe(sidebarEl);
		}

		if (statusBarEl) {
			this.layoutObserver.observe(statusBarEl);
		}
	}

	private syncLayout(): void {
		if (!this.badgeEl) return;
		const doc = this.getDoc();

		const sidebarEl = doc.querySelector<HTMLElement>(RIGHT_SIDEBAR_SELECTOR);
		const width = sidebarEl?.offsetWidth ?? 0;

		if (width <= 0) {
			this.badgeEl.hide();
		} else {
			this.badgeEl.show();
			this.badgeEl.style.width = `${width}px`;
			this.badgeEl.style.bottom = `${this.getBottomOffset()}px`;
		}
	}

	private getBottomOffset(): number {
		const doc = this.getDoc();
		const statusBarEl = doc.querySelector<HTMLElement>(STATUS_BAR_SELECTOR);
		if (statusBarEl) {
			const rect = statusBarEl.getBoundingClientRect();
			const occupiedHeight = window.innerHeight - rect.top;
			if (occupiedHeight > 0) {
				return Math.round(occupiedHeight);
			}
		}

		const cssHeight = getComputedStyle(doc.body)
			.getPropertyValue('--status-bar-height')
			.trim();
		const parsedHeight = Number.parseFloat(cssHeight);
		if (Number.isFinite(parsedHeight) && parsedHeight > 0) {
			return parsedHeight;
		}

		return FALLBACK_STATUS_BAR_HEIGHT;
	}

	private removeBadge(): void {
		if (this.badgeEl) {
			this.badgeEl.remove();
			this.badgeEl = null;
		}
	}
}
