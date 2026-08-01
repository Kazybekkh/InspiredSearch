# Inspired Search

A Chrome extension that helps researchers explore related work on arXiv — surface gaps, follow paper lineages, and jump into promising directions without leaving the page.

## What it does

On arXiv abstract, PDF, and HTML pages, Inspired Search injects a floating explorer:

- Reads the current paper (title, authors, abstract)
- Shows research **gaps / limitations** as ideation prompts
- **Find related papers** — curated lineages for well-known papers, plus live arXiv API search
- Multi-level expand (**Find more**) and **Explore this** to refocus the graph
- Back stack, drag-to-move panel, compact / expanded layouts

## Install (unpacked)

1. Clone this repo
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. **Load unpacked** → select this repository root
5. Open any paper, e.g. [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

## Local UI test (no extension)

Open `test.html` in a browser, or:

```bash
python3 -m http.server 8765
# visit http://localhost:8765/test.html
```

Live arXiv queries require the extension service worker; the test page uses the curated graph.

## Project layout

```
manifest.json      # MV3 extension manifest
background.js      # arXiv Atom API proxy
content.js         # overlay UI + exploration logic
styles.css         # panel styles
data/graph.js      # curated paper lineages
popup.html         # toolbar popup
test.html          # standalone test page
icons/             # extension icons
```

## Privacy

- Runs only on arXiv paper URLs you visit
- Optional queries go to `export.arxiv.org` for related-paper search
- No analytics; no account required
