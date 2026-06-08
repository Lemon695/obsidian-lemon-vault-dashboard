import type { App, CachedMetadata } from 'obsidian';
import { TFile } from 'obsidian';
import type { FileSizeEntry, VaultScanResult } from 'shared/vault-stats';
import { categoryForFile } from 'shared/vault-stats';

export interface DashboardKpiStat {
	label: string;
	value: string;
	unit?: string;
	subtitle: string;
	delta?: {
		positive: boolean;
		text: string;
	};
	icon: string;
}

export interface DashboardTypeBreakdownItem {
	key: 'text' | 'image' | 'attachment';
	label: string;
	subtitle: string;
	size: number;
	files: number;
	percent: number;
}

export interface DashboardFolderSummary {
	name: string;
	path: string;
	size: number;
	files: number;
	kind: 'text' | 'image' | 'attachment' | 'mixed';
}

export interface DashboardRecentItem {
	path: string;
	action: 'created' | 'edited';
	timestamp: number;
}

export interface DashboardActivityDay {
	dayKey: string;
	created: number;
	edited: number;
}

export interface DashboardGrowthPoint {
	monthKey: string;
	size: number;
}

export interface DashboardBrokenLinkTarget {
	target: string;
	count: number;
}

export interface DashboardHealthStats {
	orphans: number;
	brokenLinks: number;
	emptyNotes: number;
	untagged: number;
	linksTotal: number;
	score: number;
	brokenTargets: DashboardBrokenLinkTarget[];
}

export interface DashboardInsights {
	kpis: DashboardKpiStat[];
	breakdown: DashboardTypeBreakdownItem[];
	folderSummaries: DashboardFolderSummary[];
	recentItems: DashboardRecentItem[];
	activity: DashboardActivityDay[];
	growth: DashboardGrowthPoint[];
	health: DashboardHealthStats;
	initializedDays: number;
	averageDepth: number;
	weekEditedTotal: number;
	weekCreatedTotal: number;
	lastDayEditedTotal: number;
	lastDayCreatedTotal: number;
	lastSevenDayAverageEdits: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_COUNT = 12;
const ACTIVITY_DAYS = 91;
const RECENT_ITEMS = 6;
const SANE_TIMESTAMP = new Date('2000-01-01T00:00:00Z').getTime();

export function buildDashboardInsights(
	app: App,
	scan: VaultScanResult,
	orphansCount: number,
	now = Date.now()
): DashboardInsights {
	const markdownFiles = app.vault.getMarkdownFiles();
	const allFiles = app.vault.getFiles();
	const recentItems = buildRecentItems(allFiles);
	const activity = buildActivity(markdownFiles, now);
	const growth = buildGrowth(scan.fileSizes, now);
	const averageDepth = computeAverageDepth(scan.fileSizes);
	const health = buildHealthStats(app, markdownFiles, orphansCount);
	const folderSummaries = buildFolderSummaries(scan.fileSizes);
	const initializedDays = computeInitializedDays(allFiles, now);
	const weekSlice = activity.slice(-7);
	const lastDay = activity[activity.length - 1];
	const firstGrowth = growth[0]?.size ?? 0;
	const lastGrowth = growth[growth.length - 1]?.size ?? 0;
	const growthDelta = lastGrowth - firstGrowth;
	const linksDelta = health.brokenLinks === 0
		? undefined
		: { positive: false, text: String(health.brokenLinks) };

	return {
		kpis: [
			{
				label: 'totalStorage',
				value: (scan.totalSize / (1024 * 1024)).toFixed(2),
				unit: 'MB',
				subtitle: 'growthSummary',
				delta: {
					positive: growthDelta >= 0,
					text: `${growthDelta >= 0 ? '+' : ''}${growthDelta.toFixed(2)} MB`,
				},
				icon: 'database',
			},
			{
				label: 'totalFiles',
				value: formatInt(scan.fileSizes.length),
				subtitle: 'filesWeekSummary',
				delta: {
					positive: true,
					text: `+${weekSlice.reduce((sum, item) => sum + item.created, 0)}`,
				},
				icon: 'file',
			},
			{
				label: 'totalFolders',
				value: formatInt(scan.folderCount),
				subtitle: 'avgDepthSummary',
				icon: 'folder',
			},
			{
				label: 'linksTotal',
				value: formatInt(health.linksTotal),
				subtitle: 'brokenLinksSummary',
				delta: linksDelta,
				icon: 'link',
			},
		],
		breakdown: buildBreakdown(scan),
		folderSummaries,
		recentItems,
		activity,
		growth,
		health,
		initializedDays,
		averageDepth,
		weekEditedTotal: weekSlice.reduce((sum, item) => sum + item.edited, 0),
		weekCreatedTotal: weekSlice.reduce((sum, item) => sum + item.created, 0),
		lastDayEditedTotal: lastDay?.edited ?? 0,
		lastDayCreatedTotal: lastDay?.created ?? 0,
		lastSevenDayAverageEdits:
			weekSlice.length > 0
				? weekSlice.reduce((sum, item) => sum + item.edited, 0) / weekSlice.length
				: 0,
	};
}

function buildBreakdown(scan: VaultScanResult): DashboardTypeBreakdownItem[] {
	const total = scan.totalSize || 1;
	return [
		{ key: 'text', label: 'textFiles', subtitle: '.md / .txt / .canvas', size: scan.textSize, files: scan.textCount, percent: (scan.textSize / total) * 100 },
		{ key: 'image', label: 'imageFiles', subtitle: '.png / .jpg / .webp', size: scan.imageSize, files: scan.imageCount, percent: (scan.imageSize / total) * 100 },
		{ key: 'attachment', label: 'attachmentFiles', subtitle: '.pdf / .epub / other', size: scan.attachmentSize, files: scan.attachmentCount, percent: (scan.attachmentSize / total) * 100 },
	];
}

function buildFolderSummaries(fileSizes: FileSizeEntry[]): DashboardFolderSummary[] {
	const map = new Map<string, DashboardFolderSummary>();
	for (const item of fileSizes) {
		const [root] = item.file.path.split('/');
		const path = root ?? item.file.path;
		const existing = map.get(path) ?? { name: path, path, size: 0, files: 0, kind: 'attachment' as DashboardFolderSummary['kind'] };
		existing.size += item.size;
		existing.files += 1;
		existing.kind = mergeKinds(existing.kind, categoryToSummaryKind(categoryForFile(item.file)));
		map.set(path, existing);
	}
	return Array.from(map.values()).sort((a, b) => b.size - a.size).slice(0, 12);
}

function categoryToSummaryKind(category: ReturnType<typeof categoryForFile>): DashboardFolderSummary['kind'] {
	if (category === 'text') return 'text';
	if (category === 'image') return 'image';
	return 'attachment';
}

function mergeKinds(left: DashboardFolderSummary['kind'], right: DashboardFolderSummary['kind']): DashboardFolderSummary['kind'] {
	if (left === right) return left;
	if (left === 'attachment' && right === 'attachment') return 'attachment';
	return 'mixed';
}

function buildRecentItems(files: TFile[]): DashboardRecentItem[] {
	return [...files]
		.sort((a, b) => Math.max(b.stat.mtime, b.stat.ctime) - Math.max(a.stat.mtime, a.stat.ctime))
		.slice(0, RECENT_ITEMS)
		.map((file) => ({ path: file.path, action: inferRecentAction(file), timestamp: Math.max(file.stat.mtime, file.stat.ctime) }));
}

function inferRecentAction(file: TFile): 'created' | 'edited' {
	return Math.abs(file.stat.mtime - file.stat.ctime) < 60_000 ? 'created' : 'edited';
}

function buildActivity(files: TFile[], now: number): DashboardActivityDay[] {
	const days = createDayBuckets(ACTIVITY_DAYS, now);
	const start = days[0]?.dayKey ? new Date(days[0].dayKey).getTime() : startOfDay(now);
	for (const file of files) {
		incrementDayCount(days, start, file.stat.ctime, 'created');
		incrementDayCount(days, start, file.stat.mtime, 'edited');
	}
	return days;
}

function createDayBuckets(count: number, now: number): DashboardActivityDay[] {
	const today = startOfDay(now);
	return Array.from({ length: count }, (_, index) => {
		const ts = today - (count - index - 1) * DAY_MS;
		return { dayKey: new Date(ts).toISOString().slice(0, 10), created: 0, edited: 0 };
	});
}

function incrementDayCount(buckets: DashboardActivityDay[], start: number, timestamp: number, key: 'created' | 'edited'): void {
	const dayStart = startOfDay(timestamp);
	const index = Math.floor((dayStart - start) / DAY_MS);
	if (index < 0 || index >= buckets.length) return;
	const bucket = buckets[index];
	if (!bucket) return;
	bucket[key] += 1;
}

function buildGrowth(fileSizes: FileSizeEntry[], now: number): DashboardGrowthPoint[] {
	const points: DashboardGrowthPoint[] = [];
	for (let offset = MONTH_COUNT - 1; offset >= 0; offset--) {
		const monthDate = new Date(now);
		monthDate.setDate(1);
		monthDate.setHours(0, 0, 0, 0);
		monthDate.setMonth(monthDate.getMonth() - offset + 1, 0);
		monthDate.setHours(23, 59, 59, 999);
		const cutoff = monthDate.getTime();
		let size = 0;
		for (const item of fileSizes) {
			if (item.file.stat.ctime <= cutoff) size += item.size;
		}
		points.push({ monthKey: monthDate.toISOString().slice(0, 7), size: Number((size / (1024 * 1024)).toFixed(2)) });
	}
	return points;
}

function buildHealthStats(app: App, markdownFiles: TFile[], orphans: number): DashboardHealthStats {
	const unresolvedLinks = app.metadataCache.unresolvedLinks;
	const brokenLinks = sumLinkMap(unresolvedLinks);
	const brokenTargets = collectBrokenTargets(unresolvedLinks);
	let emptyNotes = 0;
	let untagged = 0;
	let linksTotal = 0;
	for (const file of markdownFiles) {
		const cache = app.metadataCache.getCache(file.path);
		linksTotal += (cache?.links?.length ?? 0) + (cache?.embeds?.length ?? 0) + (((cache as { frontmatterLinks?: Array<{ link?: string }> } | null)?.frontmatterLinks?.length) ?? 0);
		if (file.stat.size === 0) emptyNotes += 1;
		if (!hasAnyTag(cache)) untagged += 1;
	}
	const scorePenalty = Math.min(28, brokenLinks * 0.02) + Math.min(16, orphans * 0.8) + Math.min(14, emptyNotes * 0.9) + Math.min(14, markdownFiles.length > 0 ? (untagged / markdownFiles.length) * 20 : 0);
	const score = Math.max(0, Math.round(100 - scorePenalty));
	return { orphans, brokenLinks, emptyNotes, untagged, linksTotal, score, brokenTargets };
}

function collectBrokenTargets(linkMap: Record<string, Record<string, number>> | undefined): DashboardBrokenLinkTarget[] {
	if (!linkMap) return [];
	const counts = new Map<string, number>();
	for (const links of Object.values(linkMap)) {
		for (const [target, count] of Object.entries(links)) {
			counts.set(target, (counts.get(target) ?? 0) + count);
		}
	}
	return Array.from(counts.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 8)
		.map(([target, count]) => ({ target, count }));
}

function sumLinkMap(linkMap: Record<string, Record<string, number>> | undefined): number {
	if (!linkMap) return 0;
	let sum = 0;
	for (const src of Object.values(linkMap)) {
		for (const count of Object.values(src)) sum += count;
	}
	return sum;
}

function hasAnyTag(cache: CachedMetadata | null): boolean {
	if (!cache) return false;
	if ((cache.tags?.length ?? 0) > 0) return true;
	const frontmatter = cache.frontmatter as { tags?: unknown } | undefined;
	const frontmatterTags = frontmatter?.tags;
	if (Array.isArray(frontmatterTags)) return frontmatterTags.length > 0;
	if (typeof frontmatterTags === 'string') return frontmatterTags.trim().length > 0;
	return false;
}

function computeInitializedDays(files: TFile[], now: number): number {
	let first = now;
	for (const file of files) {
		for (const ts of [file.stat.ctime, file.stat.mtime]) {
			if (Number.isFinite(ts) && ts >= SANE_TIMESTAMP && ts < first) {
				first = ts;
			}
		}
	}
	return Math.max(0, Math.floor((now - first) / DAY_MS));
}

function computeAverageDepth(fileSizes: FileSizeEntry[]): number {
	if (fileSizes.length === 0) return 0;
	const total = fileSizes.reduce((sum, item) => sum + Math.max(0, item.file.path.split('/').length - 1), 0);
	return total / fileSizes.length;
}

function formatInt(n: number): string {
	return n.toLocaleString('en-US');
}

function startOfDay(timestamp: number): number {
	const date = new Date(timestamp);
	date.setHours(0, 0, 0, 0);
	return date.getTime();
}
