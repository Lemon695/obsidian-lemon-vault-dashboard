import { setIcon } from 'obsidian';

export function createIcon(parent: HTMLElement, icon: string, cls?: string): HTMLElement {
	const el = parent.createSpan({ cls });
	setIcon(el, icon);
	return el;
}

export function setIconOn(el: HTMLElement, icon: string): void {
	setIcon(el, icon);
}
