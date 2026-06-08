import type { App, DataAdapter } from 'obsidian';
import {
	shouldIgnoreVaultPath,
	categoryForFile,
	countFoldersUnder,
	type FileSizeEntry,
	type VaultScanResult,
	type ScanVaultStorageOptions,
	type EstimateDiskOptions,
} from 'shared/vault-stats';

import { buildReferencedPathSet, type BuildReferenceSetOptions } from './vault-references';

function yieldToMain(ms = 0): Promise<void> {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

export async function scanVaultStorage(
	app: App,
	options?: ScanVaultStorageOptions
): Promise<VaultScanResult> {
	const prefixes = options?.ignorePrefixes ?? [];
	const allFiles = app.vault.getFiles();
	const files = allFiles.filter((f) => !shouldIgnoreVaultPath(f.path, prefixes));
	const folderCount = countFoldersUnder(app.vault.getRoot());
	const total = files.length;
	const yieldEvery = options?.yieldEvery ?? 0;
	const signal = options?.signal;

	let textSize = 0;
	let textCount = 0;
	let imageSize = 0;
	let imageCount = 0;
	let attachmentSize = 0;
	let attachmentCount = 0;
	let totalSize = 0;
	const fileSizes: FileSizeEntry[] = [];

	for (let i = 0; i < files.length; i++) {
		if (signal?.aborted) {
			throw new DOMException('Aborted', 'AbortError');
		}

		const file = files[i];
		if (!file) continue;

		const size = file.stat.size;
		totalSize += size;
		fileSizes.push({ file, size });

		const cat = categoryForFile(file);
		if (cat === 'text') {
			textCount++;
			textSize += size;
		} else if (cat === 'image') {
			imageCount++;
			imageSize += size;
		} else {
			attachmentCount++;
			attachmentSize += size;
		}

		options?.onProgress?.(i + 1, total);

		if (yieldEvery > 0 && (i + 1) % yieldEvery === 0) {
			await yieldToMain(0);
		}
	}

	return {
		fileSizes,
		totalSize,
		textCount,
		textSize,
		imageCount,
		imageSize,
		attachmentCount,
		attachmentSize,
		folderCount,
	};
}

type ListedResult = { files?: string[]; folders?: string[] };

/**
 * Recursively list + stat the vault folder to estimate total disk bytes.
 * May include files not indexed by Obsidian.
 * Returns null if the adapter does not support `list`.
 */
export async function estimateVaultDiskBytes(
	adapter: DataAdapter,
	options?: EstimateDiskOptions
): Promise<number | null> {
	const adapterWithList = adapter as DataAdapter & {
		list?: (path: string) => Promise<ListedResult>;
	};
	if (typeof adapterWithList.list !== 'function') {
		return null;
	}

	const yieldEvery = options?.yieldEvery ?? 40;
	const ignorePrefixes = options?.ignorePrefixes ?? [];
	let visited = 0;
	const signal = options?.signal;

	const walk = async (dir: string): Promise<number> => {
		if (signal?.aborted) {
			throw new DOMException('Aborted', 'AbortError');
		}

		let listed: ListedResult;
		try {
			listed = await adapterWithList.list(dir);
		} catch {
			return 0;
		}

		let sum = 0;

		for (const folder of listed.folders ?? []) {
			if (signal?.aborted) {
				throw new DOMException('Aborted', 'AbortError');
			}
			const sub = dir ? `${dir}/${folder}` : folder;
			// Skip subtrees that match the user-configured ignore prefixes
			if (ignorePrefixes.length > 0 && shouldIgnoreVaultPath(sub, ignorePrefixes)) {
				continue;
			}
			sum += await walk(sub);
			visited++;
			options?.onProgress?.(visited);
			if (yieldEvery > 0 && visited % yieldEvery === 0) {
				await yieldToMain(0);
			}
		}

		for (const file of listed.files ?? []) {
			if (signal?.aborted) {
				throw new DOMException('Aborted', 'AbortError');
			}
			const p = dir ? `${dir}/${file}` : file;
			try {
				const st = await adapter.stat(p);
				sum += st?.size ?? 0;
			} catch {
				/* unreadable */
			}
			visited++;
			options?.onProgress?.(visited);
			if (yieldEvery > 0 && visited % yieldEvery === 0) {
				await yieldToMain(0);
			}
		}

		return sum;
	};

	try {
		return await walk('');
	} catch (e) {
		if (e instanceof DOMException && e.name === 'AbortError') {
			throw e;
		}
		return null;
	}
}

export { buildReferencedPathSet, type BuildReferenceSetOptions };
