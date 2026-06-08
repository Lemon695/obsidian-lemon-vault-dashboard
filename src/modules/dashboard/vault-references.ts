import type { App, TFile } from 'obsidian';
import { FileSystemAdapter } from 'obsidian';

export interface BuildReferenceSetOptions {
	/** 除 resolvedLinks 外，遍历 Markdown 元数据中的 links / embeds / frontmatterLinks */
	includeMetadataLinks: boolean;
	/** 终极兜底：深度扫描 Markdown 正文内容（正则提取链接），性能开销较大，默认关闭 */
	useBodyLinkScan: boolean;
	yieldEvery: number;
	signal?: AbortSignal;

	/** 深度扫描 Markdown 时：每处理完一篇笔记回调（done 为 1-based，total 为笔记总数） */
	onMarkdownProgress?: (done: number, total: number) => void;
}

function yieldToMain(ms = 0): Promise<void> {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

/**
 * 使用正则表达式从文本中提取可能的链接路径。
 */
export function extractTextLinks(content: string): string[] {
	const links: string[] = [];
	
	// 1. Wikilinks: [[Path]], [[Path|Alias]], [[Path#Header]]
	// 匹配组 1 为核心路径
	const wikiRegex = /\[\[([^\]|#]+)(?:\|[^\]]+)?(?:#[^\]]+)?\]\]/g;
	let match;
	while ((match = wikiRegex.exec(content)) !== null) {
		if (match[1]) links.push(match[1].trim());
	}

	// 2. Markdown links: [Label](Path), [Label](Path "Title")
	// 匹配组 1 为核心路径（排除内嵌空格后的 Title）
	const mdRegex = /\[[^\]]*\]\(([^) ]+)(?:[ ]+"[^"]*")?\)/g;
	while ((match = mdRegex.exec(content)) !== null) {
		if (match[1]) links.push(match[1].trim());
	}

	return Array.from(new Set(links));
}


/**
 * 汇总「可能被笔记引用到的」仓库内文件路径（vault 相对路径）。
 * 包含 metadataCache.resolvedLinks；可选再合并各笔记缓存中的链接解析结果。
 */
export async function buildReferencedPathSet(
	app: App,
	options: BuildReferenceSetOptions
): Promise<Set<string>> {
	const set = new Set<string>();

	const resolved = app.metadataCache.resolvedLinks;
	for (const src in resolved) {
		const links = resolved[src];
		if (!links) continue;
		for (const dest in links) {
			set.add(dest);
		}
	}

	if (!options.includeMetadataLinks) {
		return set;
	}

	const mds = app.vault.getMarkdownFiles();
	const yieldEvery = options.yieldEvery;
	const totalMd = mds.length;
	const onMd = options.onMarkdownProgress;

	for (let i = 0; i < mds.length; i++) {
		if (options.signal?.aborted) {
			throw new DOMException('Aborted', 'AbortError');
		}

		const md = mds[i];
		if (!md) continue;

		const cache = app.metadataCache.getCache(md.path);
		
		const addResolved = (linkPath: string | undefined): void => {
			if (!linkPath) return;
			const dest = app.metadataCache.getFirstLinkpathDest(
				linkPath,
				md.path
			);
			if (dest) set.add(dest.path);
		};

		// 方式 A：从元数据缓存提取（高效）
		if (cache) {
			for (const l of cache.links ?? []) {
				addResolved(l.link);
			}
			for (const e of cache.embeds ?? []) {
				addResolved(e.link);
			}
			const fm = (
				cache as { frontmatterLinks?: Array<{ link?: string }> }
			).frontmatterLinks;
			for (const f of fm ?? []) {
				addResolved(f.link);
			}
		}

		// 方式 B：深度扫描正文（兜底，开销大）
		if (options.useBodyLinkScan) {
			try {
				const content = await app.vault.read(md);
				const textLinks = extractTextLinks(content);
				for (const link of textLinks) {
					addResolved(link);
				}
		} catch {
			// silently skip unreadable files during link scan
		}
		}

		onMd?.(i + 1, totalMd);


		if (yieldEvery > 0 && (i + 1) % yieldEvery === 0) {
			await yieldToMain(0);
		}
	}

	return set;
}

/** 桌面本地库：返回文件在磁盘上的绝对路径，供系统文件管理器定位 */
export function getAbsolutePathOnDisk(file: TFile, app: App): string | null {
	if (!(app.vault.adapter instanceof FileSystemAdapter)) {
		return null;
	}
	return app.vault.adapter.getFullPath(file.path);
}
