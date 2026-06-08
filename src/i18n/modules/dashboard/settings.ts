import type { I18nDict } from 'i18n/locale';

export interface DashboardSettingsI18n {
	heading: string;
	ignorePrefixesName: string;
	ignorePrefixesDesc: string;
	ignorePrefixesPlaceholder: string;
	diskEstimateName: string;
	diskEstimateDesc: string;
	yieldEveryName: string;
	yieldEveryDesc: string;
	deepOrphanScanName: string;
	deepOrphanScanDesc: string;
	useBodyLinkScanName: string;
	useBodyLinkScanDesc: string;
}


export const dashboardSettingsI18n: I18nDict<DashboardSettingsI18n> = {
	zh: {
		heading: 'Vault Dashboard',
		ignorePrefixesName: '忽略路径前缀',
		ignorePrefixesDesc:
			'统计「已索引文件」时跳过这些路径（每行一条，相对仓库根，例如 large-assets 或 Attachments/raw）。不影响磁盘估算扫描。',
		ignorePrefixesPlaceholder: '例如：\nlarge-videos\n.excluded',
		diskEstimateName: '显示磁盘目录总占用（桌面）',
		diskEstimateDesc:
			'在仪表盘额外显示通过递归读取文件夹得到的总大小，可能包含未被 Obsidian 索引的文件；大库可能较慢，可在看板内取消。',
		yieldEveryName: '扫描让出频率',
		yieldEveryDesc:
			'每处理多少个已索引文件后短暂让出主线程（0 = 关闭）。数值越大界面越可能卡顿，越小总耗时略增。',
		deepOrphanScanName: '孤儿扫描：深度解析 Markdown 元数据',
		deepOrphanScanDesc:
			'开启后除双链解析表外，还会读取各笔记元数据中的链接、嵌入与 frontmatter 链接，减少误报；笔记很多时扫描稍慢。',

		useBodyLinkScanName: '孤儿扫描：终极兜底正文扫描',
		useBodyLinkScanDesc: '开启后将深度读取所有 Markdown 的原始内容，使用正则暴力寻找遗漏引用，保证极高准确性。性能开销极大，建议正常扫描后仍有疑惑时开启。',
	},

	en: {
		heading: 'Vault Dashboard',
		ignorePrefixesName: 'Ignore path prefixes',
		ignorePrefixesDesc:
			'Skip these vault-relative paths when tallying indexed files (one per line). Does not apply to the optional disk folder scan.',
		ignorePrefixesPlaceholder: 'e.g.\nlarge-videos\n.excluded',
		diskEstimateName: 'Show disk folder total (desktop)',
		diskEstimateDesc:
			'Also show a recursive folder size (may include files Obsidian does not index). Can be slow; you can cancel from the dashboard.',
		yieldEveryName: 'Indexed scan yield interval',
		yieldEveryDesc:
			'Yield to the UI after this many indexed files (0 = off). Higher values may stutter; lower values slightly increase total time.',
		deepOrphanScanName: 'Orphan scan: deep Markdown metadata pass',
		deepOrphanScanDesc:
			'Also walk per-note metadata for links, embeds, and frontmatter links (fewer false orphans). Slower on very large vaults.',

		useBodyLinkScanName: 'Orphan scan: deep body text fallback',
		useBodyLinkScanDesc: 'Force-reads all Markdown raw text and regex-extracts links to ensure 100% accuracy. Significant performance hit; only use if metadata scan misses items.',
	},

};
