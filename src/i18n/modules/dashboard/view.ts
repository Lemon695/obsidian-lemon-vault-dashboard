import type { I18nDict } from 'i18n/locale';

export interface DashboardViewI18n {
	title: string;
	refresh: string;
	exportSummary: string;
	noticeRefreshed: string;
	noticeExported: string;
	noticeExportUnavailable: string;
	calculating: string;
	headerSubtitle: (timestamp: number, fileCount: number) => string;
	rangeLast90Days: string;
	breadcrumbVault: string;
	shellHome: string;
	totalStorage: string;
	totalFiles: string;
	totalFolders: string;
	linksTotalTitle: string;
	metricText: string;
	metricImages: string;
	metricAttachments: string;
	kpiStorageSubtitle: (start: number, end: number) => string;
	kpiFilesSubtitle: (createdCount: number) => string;
	kpiFoldersSubtitle: (avgDepth: number) => string;
	kpiLinksSubtitle: (brokenCount: number) => string;
	compositionTitle: string;
	compositionHint: (total: string) => string;
	compositionShareLabel: string;
	compositionFiles: (count: number, percent: number) => string;
	vaultInfoTitle: string;
	vaultInitialized: (days: number) => string;
	absolutePath: string;
	pathUnavailable: string;
	copyPath: string;
	showInFileManagerShort: string;
	showInFileManagerDesktopOnly: string;
	topFilesTitle: string;
	topFilesHint: string;
	topFilesSortSize: string;
	topFilesSortRecent: string;
	topFilesPathColumn: string;
	topFilesShareColumn: string;
	topFilesSizeColumn: string;
	topFilesModifiedColumn: string;
	topFilesSearchPlaceholder: string;
	topFilesEmpty: string;
	shellActionSearch: string;
	shellActionTags: string;
	shellActionLinks: string;
	shellActionAttachments: string;
	orphanDetailsHint: string;
	healthTitle: string;
	healthScore: (score: number) => string;
	healthOrphans: string;
	healthBrokenLinks: string;
	healthEmptyNotes: string;
	healthUntagged: string;
	healthBrokenDetailsTitle: string;
	healthBrokenDetailsEmpty: string;
	scanOrphans: string;
	scanning: string;
	noOrphans: string;
	foundOrphans: (count: number, sizeStr: string) => string;
	growthTitle: string;
	growthHint: string;
	activityTitle: string;
	activityHint: string;
	activityAverageEdits: (avg: number) => string;
	activityEditedToday: string;
	activityCreatedToday: string;
	activityEditedWeek: string;
	activityLow: string;
	activityHigh: string;
	recentTitle: string;
	recentViewAll: string;
	recentCreated: string;
	recentEdited: string;
	analysisTitle: string;
	analysisHint: string;
	analysisChartTreemap: string;
	analysisChartSunburst: string;
	analysisChartDonut: string;
	analysisChartBar: string;
	analysisCenterDonut: string;
	analysisCenterSunburst: string;
	treemapBack: string;
	treemapOtherBucket: (count: number, size: string) => string;
	treemapFilterAll: string;
	treemapFilterText: string;
	treemapFilterImage: string;
	treemapFilterVideo: string;
	treemapFilterHtml: string;
	treemapFilterOther: string;
	noData: string;
	noticePathUnavailable: string;
	noticeCopied: string;
	noticeCopiedVaultPath: string;
	noticeCopyFailed: string;
	noticeFilesystemUnavailable: string;
	noticeDesktopOnly: string;
	noticeOpenFolderFailed: string;
	noticeRevealUnavailable: string;
	noticeRevealFailed: string;
	cancelScan: string;
	scanCancelled: string;
	scanProgress: (done: number, total: number) => string;
	scanningDiskEntries: (visited: number) => string;
	diskFolderTotal: string;
	diskFolderNote: string;
	buildingReferenceIndex: string;
	referenceScanProgress: (done: number, total: number) => string;
	orphanScanFailed: string;
	devDirWarning: (path: string, count: number) => string;
	devDirAddIgnore: string;
	devDirDismiss: string;
	noticeIgnoreAdded: string;
	byteUnits: [string, string, string, string, string, string];
	byteZero: string;
}

function formatTime(timestamp: number, locale: 'zh' | 'en'): string {
	return new Date(timestamp).toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-US', {
		hour: '2-digit',
		minute: '2-digit',
	});
}

export const dashboardViewI18n: I18nDict<DashboardViewI18n> = {
	zh: {
		title: '仓库仪表盘',
		refresh: '刷新',
		exportSummary: '导出',
		noticeRefreshed: '仪表盘已刷新',
		noticeExported: '摘要已复制到剪贴板',
		noticeExportUnavailable: '暂无可导出的摘要，请先完成一次扫描',
		calculating: '正在计算占用…',
		headerSubtitle: (timestamp, fileCount) => `最后扫描 · ${formatTime(timestamp, 'zh')} · ${fileCount.toLocaleString('zh-CN')} 个文件被分析`,
		rangeLast90Days: '近 90 天',
		breadcrumbVault: '仓库',
		shellHome: '主页',
		totalStorage: '仓库总占用',
		totalFiles: '文件总数',
		totalFolders: '文件夹',
		linksTotalTitle: '笔记链接',
		metricText: '文本',
		metricImages: '图片',
		metricAttachments: '附件及其他',
		kpiStorageSubtitle: (start, end) => `12 个月 ${(end - start) >= 0 ? '+' : ''}${(end - start).toFixed(1)} MB 增长`,
		kpiFilesSubtitle: (createdCount) => `近 7 天 +${createdCount} 新文件`,
		kpiFoldersSubtitle: (avgDepth) => `平均深度 ${avgDepth.toFixed(1)} 层`,
		kpiLinksSubtitle: (brokenCount) => `${brokenCount} 个失效链接`,
		compositionTitle: '文件类型分布',
		compositionHint: (total) => `按占用体积 · 共 ${total}`,
		compositionShareLabel: '占比',
		compositionFiles: (count, percent) => `${count} 个文件 · ${percent.toFixed(1)}%`,
		vaultInfoTitle: '仓库信息',
		vaultInitialized: (days) => `已初始化 · ${days} 天前`,
		absolutePath: '绝对路径',
		pathUnavailable: '移动端不可用',
		copyPath: '复制路径',
		showInFileManagerShort: '在访达中显示',
		showInFileManagerDesktopOnly: '仅桌面可用',
		topFilesTitle: '体积最大的文件',
		topFilesHint: '可能是压缩或清理的候选',
		topFilesSortSize: '按大小',
		topFilesSortRecent: '按时间',
		topFilesPathColumn: '路径',
		topFilesShareColumn: '相对占比',
		topFilesSizeColumn: '大小',
		topFilesModifiedColumn: '修改',
		topFilesSearchPlaceholder: '搜索文件名或路径…',
		topFilesEmpty: '没有匹配的文件。',
			shellActionSearch: '搜索大文件',
			shellActionTags: '跳到类型分布',
			shellActionLinks: '跳到链接健康度',
			shellActionAttachments: '跳到孤儿附件',
			orphanDetailsHint: '点击上方按钮开始扫描孤儿附件。',
			healthTitle: '健康度',
		healthScore: (score) => `良好 · ${score}`,
		healthOrphans: '孤儿附件',
		healthBrokenLinks: '失效双链',
		healthEmptyNotes: '空白笔记',
		healthUntagged: '未打标签',
		healthBrokenDetailsTitle: '失效链接详情',
		healthBrokenDetailsEmpty: '当前没有失效链接。',
		scanOrphans: '扫描未引用附件',
		scanning: '扫描中…',
		noOrphans: '未发现孤儿附件。',
		foundOrphans: (count, sizeStr) => `发现 ${count} 个孤儿文件（${sizeStr}）`,
		growthTitle: '仓库增长趋势',
		growthHint: '过去 12 个月 · 当前文件累计体积',
		activityTitle: '活跃度',
		activityHint: '近 13 周 · 编辑频次',
		activityAverageEdits: (avg) => `近 7 日均 ${avg.toFixed(0)} 次编辑`,
		activityEditedToday: '今日编辑',
		activityCreatedToday: '今日新建',
		activityEditedWeek: '本周合计',
		activityLow: '少',
		activityHigh: '多',
		recentTitle: '最近活动',
		recentViewAll: '查看全部',
		recentCreated: '新建',
		recentEdited: '编辑',
		analysisTitle: '空间占用分析',
		analysisHint: '点击下钻 · 悬停查看明细',
		analysisChartTreemap: '树图',
		analysisChartSunburst: '旭日',
		analysisChartDonut: '环形',
		analysisChartBar: '条形',
		analysisCenterDonut: '总占用',
		analysisCenterSunburst: '当前层',
		treemapBack: '返回',
		treemapOtherBucket: (count, size) => `其他 ${count} 项（${size}）`,
		treemapFilterAll: '全部',
		treemapFilterText: 'MD',
		treemapFilterImage: '图片',
		treemapFilterVideo: '视频',
		treemapFilterHtml: 'HTML',
		treemapFilterOther: '附件',
		noData: '无数据',
		noticePathUnavailable: '路径不可用',
		noticeCopied: '路径已复制到剪贴板',
		noticeCopiedVaultPath: '已复制仓库内路径',
		noticeCopyFailed: '复制失败',
		noticeFilesystemUnavailable: '需要可用的本地文件系统路径',
		noticeDesktopOnly: '仅在桌面端可用',
		noticeOpenFolderFailed: '无法在文件管理器中打开',
		noticeRevealUnavailable: '无法定位磁盘路径（仅本地库可用）',
		noticeRevealFailed: '无法在管理器中打开',
		cancelScan: '取消扫描',
		scanCancelled: '扫描已取消。',
		scanProgress: (done, total) => `已索引文件：${done} / ${total}`,
		scanningDiskEntries: (visited) => `磁盘扫描… 已遍历 ${visited} 项`,
		diskFolderTotal: '磁盘目录总占用（估算）',
		diskFolderNote: '递归列出文件夹得到，可能包含未被索引文件；与上方统计口径不同。',
		buildingReferenceIndex: '正在构建引用索引…',
		referenceScanProgress: (done, total) => `引用索引：已扫描笔记 ${done} / ${total}`,
		orphanScanFailed: '孤儿扫描失败，请稍后重试。',
		devDirWarning: (path, count) => `检测到开发目录 ${path}（含 ${count} 个文件），可能使统计失真`,
		devDirAddIgnore: '立即忽略',
		devDirDismiss: '关闭',
		noticeIgnoreAdded: '已添加到忽略列表，下次刷新后生效',
		byteUnits: ['B', 'KB', 'MB', 'GB', 'TB', 'PB'],
		byteZero: '0 B',
	},
	en: {
		title: 'Vault dashboard',
		refresh: 'Refresh',
		exportSummary: 'Export',
		noticeRefreshed: 'Dashboard refreshed',
		noticeExported: 'Summary copied to clipboard',
		noticeExportUnavailable: 'No summary available yet. Run a scan first.',
		calculating: 'Calculating storage…',
		headerSubtitle: (timestamp, fileCount) => `Last scan · ${formatTime(timestamp, 'en')} · ${fileCount.toLocaleString('en-US')} files analyzed`,
		rangeLast90Days: 'Last 90 days',
		breadcrumbVault: 'Vault',
		shellHome: 'Home',
		totalStorage: 'Total storage used',
		totalFiles: 'Files',
		totalFolders: 'Folders',
		linksTotalTitle: 'Note links',
		metricText: 'Text',
		metricImages: 'Images',
		metricAttachments: 'Attachments & other',
		kpiStorageSubtitle: (start, end) => `12 months ${end - start >= 0 ? '+' : ''}${(end - start).toFixed(1)} MB growth`,
		kpiFilesSubtitle: (createdCount) => `+${createdCount} new files in 7 days`,
		kpiFoldersSubtitle: (avgDepth) => `Average depth ${avgDepth.toFixed(1)} levels`,
		kpiLinksSubtitle: (brokenCount) => `${brokenCount} broken links`,
		compositionTitle: 'File type distribution',
		compositionHint: (total) => `By occupied space · ${total} total`,
		compositionShareLabel: 'Share',
		compositionFiles: (count, percent) => `${count} files · ${percent.toFixed(1)}%`,
		vaultInfoTitle: 'Vault info',
		vaultInitialized: (days) => `Initialized · ${days} days ago`,
		absolutePath: 'Absolute path',
		pathUnavailable: 'Unavailable on mobile',
		copyPath: 'Copy path',
		showInFileManagerShort: 'Reveal in Finder',
		showInFileManagerDesktopOnly: 'Desktop only',
		topFilesTitle: 'Largest files',
		topFilesHint: 'Likely candidates for cleanup or compression',
		topFilesSortSize: 'By size',
		topFilesSortRecent: 'By time',
		topFilesPathColumn: 'Path',
		topFilesShareColumn: 'Relative share',
		topFilesSizeColumn: 'Size',
		topFilesModifiedColumn: 'Modified',
		topFilesSearchPlaceholder: 'Search file name or path…',
		topFilesEmpty: 'No matching files.',
			shellActionSearch: 'Search top files',
			shellActionTags: 'Jump to composition',
			shellActionLinks: 'Jump to link health',
			shellActionAttachments: 'Jump to orphan attachments',
			orphanDetailsHint: 'Use the button above to scan for orphan attachments.',
			healthTitle: 'Health',
		healthScore: (score) => `Good · ${score}`,
		healthOrphans: 'Orphan attachments',
		healthBrokenLinks: 'Broken wikilinks',
		healthEmptyNotes: 'Empty notes',
		healthUntagged: 'Untagged notes',
		healthBrokenDetailsTitle: 'Broken link details',
		healthBrokenDetailsEmpty: 'No broken links right now.',
		scanOrphans: 'Scan unused attachments',
		scanning: 'Scanning…',
		noOrphans: 'No orphan attachments found.',
		foundOrphans: (count, sizeStr) => `Found ${count} orphan files (${sizeStr})`,
		growthTitle: 'Vault growth trend',
		growthHint: 'Past 12 months · cumulative size of current files',
		activityTitle: 'Activity',
		activityHint: 'Last 13 weeks · edit frequency',
		activityAverageEdits: (avg) => `${avg.toFixed(0)} edits/day over the last week`,
		activityEditedToday: 'Edited today',
		activityCreatedToday: 'Created today',
		activityEditedWeek: 'This week',
		activityLow: 'Low',
		activityHigh: 'High',
		recentTitle: 'Recent activity',
		recentViewAll: 'View all',
		recentCreated: 'Created',
		recentEdited: 'Edited',
		analysisTitle: 'Space usage analysis',
		analysisHint: 'Drill down on click · hover for details',
		analysisChartTreemap: 'Treemap',
		analysisChartSunburst: 'Sunburst',
		analysisChartDonut: 'Donut',
		analysisChartBar: 'Bars',
		analysisCenterDonut: 'Total usage',
		analysisCenterSunburst: 'Current level',
		treemapBack: 'Back',
		treemapOtherBucket: (count, size) => `${count} more items (${size})`,
		treemapFilterAll: 'All',
		treemapFilterText: 'MD',
		treemapFilterImage: 'Images',
		treemapFilterVideo: 'Video',
		treemapFilterHtml: 'HTML',
		treemapFilterOther: 'Files',
		noData: 'No data',
		noticePathUnavailable: 'Path unavailable',
		noticeCopied: 'Path copied to clipboard',
		noticeCopiedVaultPath: 'Vault-relative path copied',
		noticeCopyFailed: 'Failed to copy',
		noticeFilesystemUnavailable: 'A local filesystem path is required',
		noticeDesktopOnly: 'Desktop only',
		noticeOpenFolderFailed: 'Could not open in file manager',
		noticeRevealUnavailable: 'Cannot resolve disk path for this vault',
		noticeRevealFailed: 'Could not reveal in file manager',
		cancelScan: 'Cancel scan',
		scanCancelled: 'Scan cancelled.',
		scanProgress: (done, total) => `Indexed files: ${done} / ${total}`,
		scanningDiskEntries: (visited) => `Disk scan… ${visited} entries visited`,
		diskFolderTotal: 'Disk folder total (estimate)',
		diskFolderNote: 'Built from recursive folder listing and may include files Obsidian does not index.',
		buildingReferenceIndex: 'Building reference index…',
		referenceScanProgress: (done, total) => `Reference index: ${done} / ${total} notes`,
		orphanScanFailed: 'Orphan scan failed. Please try again.',
		devDirWarning: (path, count) => `Dev directory detected: ${path} (${count} files) — may skew statistics`,
		devDirAddIgnore: 'Ignore now',
		devDirDismiss: 'Dismiss',
		noticeIgnoreAdded: 'Added to ignore list. Refresh to apply.',
		byteUnits: ['B', 'KB', 'MB', 'GB', 'TB', 'PB'],
		byteZero: '0 B',
	},
};
