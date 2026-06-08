/**
 * Human-readable byte size string.
 *
 * @param bytes     Raw byte count
 * @param units     Six unit labels: [B, KB, MB, GB, TB, PB]
 * @param zeroLabel String to return when bytes is 0
 * @param decimals  Decimal places (default 2)
 */
export function formatBytes(
	bytes: number,
	units: readonly [string, string, string, string, string, string],
	zeroLabel: string,
	decimals = 2
): string {
	if (!+bytes) return zeroLabel;
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const i = Math.min(
		Math.floor(Math.log(bytes) / Math.log(k)),
		units.length - 1
	);
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${units[i]}`;
}
