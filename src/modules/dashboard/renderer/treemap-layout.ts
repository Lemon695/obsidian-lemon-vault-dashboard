/**
 * 矩形区域定义
 */
export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

/**
 * Squarified Treemap 布局算法实现。
 * 给定一个总矩形区域和一组权重（大小），返回每个权重对应的矩形坐标。
 * 该算法旨在最小化矩形的长宽比，使其看起来更接近正方形。
 */
export function squarify(rect: Rect, sizes: number[]): Rect[] {
	if (sizes.length === 0) return [];

	// 处理零大小或无效区域
	if (rect.w <= 0 || rect.h <= 0) {
		return sizes.map(() => ({ x: rect.x, y: rect.y, w: 0, h: 0 }));
	}

	const totalSize = sizes.reduce((a, b) => a + b, 0);
	if (totalSize === 0) {
		return sizes.map(() => ({ x: rect.x, y: rect.y, w: 0, h: 0 }));
	}

	// 将原始大小缩放到矩形像素面积
	const scale = (rect.w * rect.h) / totalSize;
	const scaledSizes = sizes.map((s) => s * scale);

	return doSquarify(rect, scaledSizes);
}

function doSquarify(rect: Rect, sizes: number[]): Rect[] {
	let results: Rect[] = [];
	const currentRect = { ...rect };
	let remainingSizes = [...sizes];

	while (remainingSizes.length > 0) {
		// 寻找当前最适合的一行（或一列）
		const row = getBestRow(currentRect, remainingSizes);
		const rowRects = layoutRow(currentRect, row);
		results = results.concat(rowRects);

		// 更新剩余可用空间
		const rowSize = row.reduce((a, b) => a + b, 0);
		const isVertical = currentRect.w >= currentRect.h;
		const rowThickness = rowSize / (isVertical ? currentRect.h : currentRect.w);

		if (isVertical) {
			currentRect.x += rowThickness;
			currentRect.w -= rowThickness;
		} else {
			currentRect.y += rowThickness;
			currentRect.h -= rowThickness;
		}
		
		remainingSizes = remainingSizes.slice(row.length);

		// 防止数值误差导致的无限循环
		if (currentRect.w <= 0.01 || currentRect.h <= 0.01) {
			if (remainingSizes.length > 0) {
				results = results.concat(remainingSizes.map(() => ({ ...currentRect, w: 0, h: 0 })));
			}
			break;
		}
	}
	return results;
}

/**
 * 确定当前行应该包含多少个元素以保持较好的纵横比
 */
function getBestRow(rect: Rect, sizes: number[]): number[] {
	let row = [sizes[0] || 0];
	let worst = worstAspectRatio(rect, row);

	for (let i = 1; i < sizes.length; i++) {
		const nextSize = sizes[i] || 0;
		const nextRow = [...row, nextSize];
		const nextWorst = worstAspectRatio(rect, nextRow);
		
		// 如果加入下一个后纵横比变差了，则停止加入
		if (nextWorst <= worst) {
			row = nextRow;
			worst = nextWorst;
		} else {
			break;
		}
	}
	return row;
}

/**
 * 计算一组矩形在给定侧长下的最大纵横比
 */
function worstAspectRatio(rect: Rect, row: number[]): number {
	const side = Math.min(rect.w, rect.h);
	const rowSize = row.reduce((a, b) => a + b, 0);
	if (rowSize === 0 || side === 0) return Infinity;

	const s_square = side * side;
	const r_square = rowSize * rowSize;
	let min_s = row[0] ?? 0;
	let max_s = row[0] ?? 0;
	for (let i = 1; i < row.length; i++) {
		const v = row[i] ?? 0;
		if (v < min_s) min_s = v;
		if (v > max_s) max_s = v;
	}

	return Math.max(
		(s_square * max_s) / r_square,
		r_square / (s_square * min_s)
	);
}

/**
 * 将一行中的元素按比例分割到当前矩形中
 */
function layoutRow(rect: Rect, row: number[]): Rect[] {
	const isVertical = rect.w >= rect.h;
	const rowSize = row.reduce((a, b) => a + b, 0);
	const thickness = rowSize / (isVertical ? rect.h : rect.w);

	let offset = 0;
	return row.map((s) => {
		const length = s / thickness;
		const r = isVertical
			? { x: rect.x, y: rect.y + offset, w: thickness, h: length }
			: { x: rect.x + offset, y: rect.y, w: length, h: thickness };
		offset += length;
		return r;
	});
}
