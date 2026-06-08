# Vault Dashboard

English | [简体中文](README.zh-cn.md)

A beautiful, panoramic dashboard for [Obsidian](https://obsidian.md) that gives you a bird's-eye view of your vault's storage composition, file distribution, and health — helping you identify large files and orphan attachments at a glance.

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22vault-dashboard%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

## Features

### Storage Overview

- **Hero KPIs** — Total indexed size, file count, and folder count displayed as prominent headline metrics with a category breakdown progress bar.
- **Category Breakdown** — Files are classified into Markdown, Images, Attachments, and Other, each with size totals and visual proportion bars.
- **Disk Estimate (Desktop)** — Optional recursive disk scan that includes unindexed files (e.g., `.obsidian/` config) for a true folder-level size estimate.

### Space Usage Analysis

- **Squarified Treemap** — Visualize your vault's storage as a hierarchical treemap where rectangle area represents file/folder size.
- **Drill-down Navigation** — Click any folder to drill into it; breadcrumbs at the top let you jump back to any ancestor level.
- **Smart Aggregation** — When a folder has more than 80 children, small items are merged into an "Others (N items)" block to prevent DOM explosion.
- **Multiple Chart Modes** — Switch between Treemap, Sunburst, Donut, and Bar views.
- **Type Filter** — Filter by file type (All, Markdown, Images, Attachments, Other) to focus on specific content.

### Insight Panels

- **Growth Trend** — 12-month cumulative size trend of current files with delta metrics.
- **Activity Heatmap** — Edit frequency over the last 13 weeks, plus today/this-week edit and create counts.
- **Recent Activity** — Recently modified and created notes at a glance.
- **Vault Health** — Health summary in the sidebar, including broken-link hints when applicable.

### Largest Files

- Ranked list with configurable count (**10 / 20 / 50**), sort by size or modification time, category filter, and search.
- Inline actions: **open in Obsidian**, **copy vault-relative path**, and **reveal in system file manager** (desktop only).

### Orphan Attachment Scanner

- Detects files not referenced by any note using Obsidian's `resolvedLinks` metadata.
- **Deep Scan** (optional) — Also parses each note's metadata links, embeds, and frontmatter links for more accurate detection.
- **Body Link Scan** (optional) — Regex-based fallback that reads note content to catch inline Markdown links not captured by metadata. High performance cost; enable only when needed.
- Real-time progress indicator with cancel support.
- Each orphan result supports: copy path, reveal in file manager, open in Obsidian.

### Identity Badge

- A subtle vault identity card pinned to the bottom of the right sidebar, showing the vault name and optional custom text.
- Dynamically tracks the sidebar width and stays above the status bar.
- Fully customizable: toggle visibility, set custom label, pick accent color, adjust opacity.
- Toggle via command palette: **Toggle vault identity badge**.

### General

- **Bilingual UI** — Automatically switches between Chinese and English based on Obsidian's language setting (`getLanguage()` API, requires Obsidian ≥ 1.8.7).
- **Session Cache** — Scan results are cached in memory during the session. Use the Refresh button to re-scan.
- **Dark / Light Theme** — All colors use Obsidian CSS variables (`--color-accent`, `--text-normal`, etc.) for seamless theme adaptation.
- **Mobile Compatible** — Works on both desktop and mobile (`isDesktopOnly: false`). Desktop-only features (disk estimate, file manager reveal) are gracefully hidden on mobile.

## Installation

### From Community Plugins (Recommended)

1. Open **Settings → Community plugins → Browse**.
2. Search for **Vault Dashboard**.
3. Click **Install**, then **Enable**.

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/Lemon695/obsidian-vault-dashboard/releases).
2. Create a folder: `<your-vault>/.obsidian/plugins/vault-dashboard/`
3. Place all three files into that folder.
4. Reload Obsidian, then enable **Vault Dashboard** in **Settings → Community plugins**.

## Usage

- Click the **pie-chart icon** in the left ribbon, or run **Open info panel** from the command palette.
- A new tab opens with the full dashboard view.
- Click **Refresh** in the header to re-scan your vault.
- Click **Scan Orphans** in the sidebar to detect unreferenced attachments.
- Click any folder in the space usage chart to drill down; use breadcrumbs to navigate back.
- Switch chart modes and type filters in the analysis panel header.

## Settings

### Dashboard

| Setting | Description | Default |
|---------|-------------|---------|
| Ignore path prefixes | One vault-relative prefix per line to exclude from indexed scans (e.g., `large-videos`) | (empty) |
| Show disk folder total (desktop) | Enable recursive disk size estimation | Off |
| Indexed scan yield interval | Yield to the main thread after this many indexed files (0–100; 0 = off) | 25 |
| Orphan scan: deep Markdown metadata pass | Parse metadata links/embeds for more accurate orphan detection | On |
| Orphan scan: deep body text fallback | Regex-based fallback scan of note content for link detection | Off |

### Identity Badge

| Setting | Description | Default |
|---------|-------------|---------|
| Show vault identity badge | Toggle the identity badge in the right sidebar | On |
| Custom vault name | Additional label on the badge; empty uses the vault folder name | (empty) |
| Badge theme color | Accent color for the badge border | Theme default |
| Badge opacity | Badge transparency (0.1–1.0) | 0.8 |

## Development

```bash
npm install
npm run dev      # watch mode
npm run build    # type check + production build
npm run lint     # ESLint
```

Build output is written to `main.js` at the project root (not `dist/`).

### Manual Testing

Copy `main.js`, `manifest.json`, and `styles.css` to:

```
<vault>/.obsidian/plugins/vault-dashboard/
```

Reload Obsidian and enable the plugin.

## License

This project is licensed under [GPL-3.0-only](LICENSE).
