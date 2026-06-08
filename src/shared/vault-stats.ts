import type { TFile } from 'obsidian';
import { TFolder } from 'obsidian';

// ── Types & constants ──────────────────────────────────────────────────────

export type FileCategory = 'text' | 'image' | 'video' | 'html' | 'attachment';

export interface FileSizeEntry {
	file: TFile;
	size: number;
}

export interface VaultScanResult {
	fileSizes: FileSizeEntry[];
	totalSize: number;
	textCount: number;
	textSize: number;
	imageCount: number;
	imageSize: number;
	attachmentCount: number;
	attachmentSize: number;
	folderCount: number;
}

export interface ScanVaultStorageOptions {
	ignorePrefixes: string[];
	signal?: AbortSignal;
	/** (done, total) — total is the number of indexed files participating in the scan */
	onProgress?: (done: number, total: number) => void;
	/** Yield to main thread every N files; 0 disables yielding */
	yieldEvery: number;
}

export interface EstimateDiskOptions {
	signal?: AbortSignal;
	onProgress?: (entriesVisited: number) => void;
	yieldEvery: number;
	/** Same prefix list as ScanVaultStorageOptions — skips entire subtrees */
	ignorePrefixes?: string[];
}

export interface OrphanScanInput {
	fileSizes: FileSizeEntry[];
	/** All vault-relative paths that are referenced by at least one note */
	referencedPaths: Set<string>;
}

export interface OrphanScanResult {
	orphans: FileSizeEntry[];
	orphansTotalSize: number;
}

export const ORPHAN_SKIP_EXTENSIONS = new Set([
	'md',
	'canvas',
	'json',
	'css',
	'js',
	'mjs',
	'cjs',
]);

const TEXT_EXT = new Set(['md', 'txt', 'canvas']);
const IMAGE_EXT = new Set([
	'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico', 'avif', 'tiff', 'heic',
]);
const VIDEO_EXT = new Set([
	'mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'ogv', '3gp',
]);
const HTML_EXT = new Set(['html', 'htm']);

// ── Pure functions ─────────────────────────────────────────────────────────

export function parseIgnorePrefixes(raw: string): string[] {
	return raw
		.split(/\r?\n/)
		.map((line) => normalizePrefix(line))
		.filter((p) => p.length > 0);
}

function normalizePrefix(line: string): string {
	return line.trim().replace(/\\/g, '/').replace(/^\/+/, '');
}

export function pathMatchesIgnorePrefix(path: string, prefix: string): boolean {
	if (!prefix) return false;
	return path === prefix || path.startsWith(prefix + '/');
}

export function shouldIgnoreVaultPath(path: string, prefixes: string[]): boolean {
	return prefixes.some((p) => pathMatchesIgnorePrefix(path, p));
}

export function categoryForFile(file: TFile): FileCategory {
	const ext = file.extension.toLowerCase();
	if (TEXT_EXT.has(ext)) return 'text';
	if (IMAGE_EXT.has(ext)) return 'image';
	if (VIDEO_EXT.has(ext)) return 'video';
	if (HTML_EXT.has(ext)) return 'html';
	return 'attachment';
}

export function countFoldersUnder(root: TFolder): number {
	let n = 0;
	for (const child of root.children) {
		if (child instanceof TFolder) {
			n += 1 + countFoldersUnder(child);
		}
	}
	return n;
}

export function findOrphanAttachments(input: OrphanScanInput): OrphanScanResult {
	const orphans: FileSizeEntry[] = [];
	let orphansTotalSize = 0;

	for (const item of input.fileSizes) {
		if (ORPHAN_SKIP_EXTENSIONS.has(item.file.extension.toLowerCase())) {
			continue;
		}
		if (!input.referencedPaths.has(item.file.path)) {
			orphans.push(item);
			orphansTotalSize += item.size;
		}
	}

	orphans.sort((a, b) => b.size - a.size);
	return { orphans, orphansTotalSize };
}

// ── Dev directory auto-detection ──────────────────────────────────────────

/** Path segments that indicate development / build artifacts, not vault content */
const KNOWN_DEV_SEGMENTS = new Set([
	'node_modules', '.git', 'vendor', 'dist', '.next',
	'__pycache__', '.venv', 'venv', '.gradle', 'build',
	'target', '.cache', '.turbo', '.svelte-kit', '.nuxt',
	'out', '.output',
]);

export interface DevDirEntry {
	path: string;
	fileCount: number;
}

/**
 * Scans the indexed file list for known development/build directories that
 * are not already ignored. Returns candidates sorted by file count descending.
 * Pure function: no side effects, does not mutate inputs.
 */
export function detectDevDirectories(
	fileSizes: FileSizeEntry[],
	ignorePrefixes: string[]
): DevDirEntry[] {
	const counts = new Map<string, number>();

	for (const { file } of fileSizes) {
		const parts = file.path.split('/');
		for (let i = 0; i < parts.length - 1; i++) {
			const seg = parts[i];
			if (seg && KNOWN_DEV_SEGMENTS.has(seg)) {
				const devPath = parts.slice(0, i + 1).join('/');
				if (!shouldIgnoreVaultPath(devPath, ignorePrefixes)) {
					counts.set(devPath, (counts.get(devPath) ?? 0) + 1);
				}
				break; // don't double-count nested paths in the same branch
			}
		}
	}

	return Array.from(counts.entries())
		.filter(([, n]) => n > 5)
		.sort((a, b) => b[1] - a[1])
		.map(([path, fileCount]) => ({ path, fileCount }));
}
