/**
 * Barrel: re-exports pure helpers from shared/vault-stats and async I/O from scanner.
 * All existing imports of this module continue to work unchanged.
 */
export {
	parseIgnorePrefixes,
	pathMatchesIgnorePrefix,
	shouldIgnoreVaultPath,
	categoryForFile,
	countFoldersUnder,
	findOrphanAttachments,
	ORPHAN_SKIP_EXTENSIONS,
	type FileCategory,
	type FileSizeEntry,
	type VaultScanResult,
	type ScanVaultStorageOptions,
	type EstimateDiskOptions,
	type OrphanScanInput,
	type OrphanScanResult,
} from 'shared/vault-stats';

export { formatBytes } from 'shared/format';

export { scanVaultStorage, estimateVaultDiskBytes } from './scanner';
