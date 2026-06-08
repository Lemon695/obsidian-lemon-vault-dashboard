import type { Plugin } from 'obsidian';
import type { VaultScanResult } from '../shared/vault-stats';

// ── Shared Cache ──────────────────────────────────────────────────────────

export interface DashboardCache {
	scanResult: VaultScanResult;
	diskBytes: number | null;
	timestamp: number;
}

// ── Per-module settings ────────────────────────────────────────────────────

export interface DashboardModuleSettings {
	ignorePathPrefixes: string;
	showDiskFolderEstimate: boolean;
	scanYieldEvery: number;
	deepLinkScanForOrphans: boolean;
	useBodyLinkScan: boolean;
}


export interface IdentityModuleSettings {
	showBadge: boolean;
	customText: string;
	badgeColor: string;
	opacity: number;
}

// ── Top-level plugin settings (v0.6+) ─────────────────────────────────────

export interface PluginSettings {
	moduleEnabled: Record<string, boolean>;
	dashboard: DashboardModuleSettings;
	identity: IdentityModuleSettings;
}

const DEFAULT_DASHBOARD_SETTINGS: DashboardModuleSettings = {
	ignorePathPrefixes: '',
	showDiskFolderEstimate: false,
	scanYieldEvery: 25,
	deepLinkScanForOrphans: true,
	useBodyLinkScan: false,
};


const DEFAULT_IDENTITY_SETTINGS: IdentityModuleSettings = {
	showBadge: true,
	customText: '',
	badgeColor: '',
	opacity: 0.8,
};

export const DEFAULT_SETTINGS: PluginSettings = {
	moduleEnabled: {},
	dashboard: { ...DEFAULT_DASHBOARD_SETTINGS },
	identity: { ...DEFAULT_IDENTITY_SETTINGS },
};

// ── Settings migration ─────────────────────────────────────────────────────

interface LegacySettings {
	ignorePathPrefixes?: string;
	showDiskFolderEstimate?: boolean;
	scanYieldEvery?: number;
	deepLinkScanForOrphans?: boolean;
	useBodyLinkScan?: boolean;
}


/**
 * Accepts any loaded data shape (flat v0.5.x legacy or current nested v0.6+)
 * and returns a fully-populated PluginSettings object.
 */
export function migrateSettings(loaded: unknown): PluginSettings {
	if (typeof loaded !== 'object' || loaded === null) {
		return {
			moduleEnabled: {},
			dashboard: { ...DEFAULT_DASHBOARD_SETTINGS },
			identity: { ...DEFAULT_IDENTITY_SETTINGS },
		};
	}

	const obj = loaded as Record<string, unknown>;

	if ('dashboard' in obj && typeof obj['dashboard'] === 'object' && obj['dashboard'] !== null) {
		return {
			moduleEnabled: (obj['moduleEnabled'] as Record<string, boolean>) ?? {},
			dashboard: {
				...DEFAULT_DASHBOARD_SETTINGS,
				...(obj['dashboard'] as Partial<DashboardModuleSettings>),
			},
			identity: {
				...DEFAULT_IDENTITY_SETTINGS,
				...(obj['identity'] as Partial<IdentityModuleSettings>),
			},
		};
	}

	// Legacy flat format (v0.5.x)
	const legacy = obj as LegacySettings;
	return {
		moduleEnabled: {},
		dashboard: {
			ignorePathPrefixes:
				legacy.ignorePathPrefixes ?? DEFAULT_DASHBOARD_SETTINGS.ignorePathPrefixes,
			showDiskFolderEstimate:
				legacy.showDiskFolderEstimate ?? DEFAULT_DASHBOARD_SETTINGS.showDiskFolderEstimate,
			scanYieldEvery:
				legacy.scanYieldEvery ?? DEFAULT_DASHBOARD_SETTINGS.scanYieldEvery,
			deepLinkScanForOrphans:
				legacy.deepLinkScanForOrphans ?? DEFAULT_DASHBOARD_SETTINGS.deepLinkScanForOrphans,
			useBodyLinkScan:
				legacy.useBodyLinkScan ?? DEFAULT_DASHBOARD_SETTINGS.useBodyLinkScan,
		},

		identity: { ...DEFAULT_IDENTITY_SETTINGS },
	};
}

// ── Shared contracts ───────────────────────────────────────────────────────

/**
 * Plugin interface used by SettingTab / View to avoid circular imports with main.
 *
 * Intentionally omit Obsidian's base `Plugin.settings` property, which was added
 * in Obsidian 1.13.0. The plugin still declares `minAppVersion: 1.12.7`, so
 * helper surfaces should resolve `settings` to our own persisted shape instead
 * of the newer core API symbol.
 */
export type VaultDashboardPluginLike = Omit<Plugin, 'settings'> & {
	settings: PluginSettings;
	saveSettings(): Promise<void>;
	moduleManager: { getAll(): PluginModule[] };
	// In-memory cache for dashboard data to avoid redundant scans
	cache?: DashboardCache;
};

/** Uniform contract every feature module must implement */
export interface PluginModule {
	readonly id: string;
	readonly name: string;
	readonly description: string;
	onload(): Promise<void>;
	onunload(): void;
	renderSettings?(containerEl: HTMLElement): void;
}
