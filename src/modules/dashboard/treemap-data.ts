import { type FileSizeEntry, type FileCategory, categoryForFile } from '../../shared/vault-stats';

/**
 * 树状图节点结构
 */
export interface TreemapNode {
	name: string;
	path: string;
	size: number;
	children?: TreemapNode[];
	isFolder: boolean;
	category?: FileCategory;
	isOtherBucket?: boolean;
}

/**
 * 将扁平的文件大小列表转换为层级化的文件夹树结构。
 * 每个文件夹节点的大小为其所有子项大小之和。
 */
export function buildFolderTree(fileSizes: FileSizeEntry[]): TreemapNode {
	const root: TreemapNode = {
		name: '',
		path: '',
		size: 0,
		children: [],
		isFolder: true,
	};

	// 路径 -> 节点映射，方便快速查找
	const internalMap = new Map<string, TreemapNode>();
	internalMap.set('', root);

	for (const entry of fileSizes) {
		const { file, size } = entry;
		const parts = file.path.split('/');

		// 构建文件夹祖先
		let currentPath = '';
		let prevNode = root;

		// 遍历到倒数第二个部分（即文件夹部分）
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i] || '';
			const nextPath = currentPath ? `${currentPath}/${part}` : part;

			let node = internalMap.get(nextPath);
			if (!node) {
				node = {
					name: part,
					path: nextPath,
					size: 0,
					children: [],
					isFolder: true,
				};
				internalMap.set(nextPath, node);
				if (!prevNode.children) prevNode.children = [];
				prevNode.children.push(node);
			}
			node.size += size;
			prevNode = node;
			currentPath = nextPath;
		}

		// 根节点增加总大小
		root.size += size;

		// 添加叶子节点（文件）
		if (!prevNode.children) prevNode.children = [];
		prevNode.children.push({
			name: parts[parts.length - 1] || '',
			path: file.path,
			size: size,
			isFolder: false,
			category: categoryForFile(file),
		});
	}

	// 递归排序子节点，并根据占比考虑是否折叠极小文件（可选，目前保留全部）
	const postProcess = (node: TreemapNode) => {
		if (node.children && node.children.length > 0) {
			node.children.sort((a, b) => b.size - a.size);
			node.children.forEach(postProcess);
		}
	};

	postProcess(root);

	return root;
}
