/**
 * Inspired Search — content script overlay for arXiv papers.
 * Multi-level exploration, back stack, live arXiv suggestions + curated graph.
 */
(function () {
  'use strict';

  if (document.getElementById('inspired-search-root')) return;

  const Graph = window.InspiredSearchGraph || {
    inferDirection: () => 'Machine Learning',
    getPaper: () => null,
    findByTitle: () => null,
    relatedPapers: () => [],
    genericSuggestions: () => []
  };

  const state = {
    open: true,
    expanded: false,
    loading: false,
    current: null,
    children: [],
    grandchildren: {}, // parentId -> papers[]
    openGrandchildren: new Set(),
    stack: [],
    drag: null
  };

  // —— Page metadata ————————————————————————————————

  function extractArxivId(url = location.href) {
    try {
      const u = new URL(url);
      const m = u.pathname.match(/\/(abs|pdf|html)\/([\w./-]+?)(?:\.pdf)?\/?$/);
      if (!m) return '';
      return m[2].replace(/v\d+$/, '').replace(/\/$/, '');
    } catch {
      return '';
    }
  }

  function readPageMeta() {
    const title =
      document.querySelector('meta[name="citation_title"]')?.content ||
      document.querySelector('h1.title')?.textContent?.replace(/^Title:\s*/i, '') ||
      document.querySelector('h1')?.textContent ||
      document.title;

    const authors = Array.from(document.querySelectorAll('meta[name="citation_author"]'))
      .map((el) => el.content)
      .filter(Boolean)
      .map((name) => name.split(/\s+/).pop());

    const abstract =
      document.querySelector('meta[name="citation_abstract"]')?.content ||
      document.querySelector('#abstract .abstract-content, blockquote.abstract')?.textContent ||
      '';

    const id = extractArxivId();
    const curated = (id && Graph.getPaper(id)) || Graph.findByTitle(title);

    return {
      id: id || curated?.id || `page-${hash(title || location.href)}`,
      title: (title || curated?.title || 'Current paper').trim().replace(/\s+/g, ' '),
      authors: authors.length ? authors : curated?.authors || [],
      gaps: curated?.gaps || inferGaps(title, abstract),
      url: id ? `https://arxiv.org/abs/${id}` : location.href,
      direction: Graph.inferDirection(title || curated?.title || ''),
      source: curated ? 'graph' : 'page'
    };
  }

  function inferGaps(title, abstract) {
    const text = `${title || ''} ${abstract || ''}`.toLowerCase();
    const gaps = [];
    if (/scale|large|billion|trillion/.test(text)) gaps.push('Scaling cost and accessibility');
    if (/attention|transformer/.test(text)) gaps.push('Long-context efficiency');
    if (/supervised|label/.test(text)) gaps.push('Label efficiency / weak supervision');
    if (/robust|adversar|ood|distribution/.test(text)) gaps.push('Robustness under shift');
    if (!gaps.length) {
      gaps.push('Generalization beyond the reported setting');
      gaps.push('Compute / data efficiency');
      gaps.push('Evaluation coverage and reproducibility');
    }
    return gaps.slice(0, 3);
  }

  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h).toString(36);
  }

  function truncate(text, max) {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  }

  // —— Suggestion fetching ————————————————————————————

  async function fetchRelated(paper) {
    const curated = Graph.relatedPapers(paper.id, 3);
    if (curated.length >= 2) return curated;

    const byTitle = Graph.relatedPapers(paper.title, 3);
    if (byTitle.length >= 2) return byTitle;

    const live = await queryArxivApi(paper.title);
    if (live.length) {
      return live.map((p) => ({
        ...p,
        gaps: inferGaps(p.title, p.summary),
        direction: Graph.inferDirection(p.title)
      }));
    }

    return Graph.genericSuggestions(paper.title, 3);
  }

  function queryArxivApi(query) {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        resolve([]);
        return;
      }
      try {
        chrome.runtime.sendMessage(
          { type: 'INSPIRED_SEARCH_QUERY', query, maxResults: 4 },
          (response) => {
            if (chrome.runtime.lastError || !response?.ok) {
              resolve([]);
              return;
            }
            const currentId = state.current?.id;
            resolve(
              (response.papers || []).filter((p) => p.id && p.id !== currentId).slice(0, 3)
            );
          }
        );
      } catch {
        resolve([]);
      }
    });
  }

  // —— DOM construction ————————————————————————————————

  const root = document.createElement('div');
  root.id = 'inspired-search-root';

  const fab = document.createElement('button');
  fab.id = 'is-fab';
  fab.type = 'button';
  fab.title = 'Toggle Inspired Search';
  fab.setAttribute('aria-label', 'Toggle Inspired Search');
  fab.innerHTML = '<span class="is-fab-mark">IS</span>';

  const panel = document.createElement('section');
  panel.id = 'is-panel';
  panel.className = 'is-panel is-compact';
  panel.setAttribute('aria-label', 'Inspired Search explorer');

  panel.innerHTML = `
    <header class="is-header" data-drag-handle>
      <div class="is-brand">
        <span class="is-status" data-status></span>
        <div class="is-brand-text">
          <strong>Inspired Search</strong>
          <span data-subtitle>Research explorer</span>
        </div>
      </div>
      <div class="is-controls">
        <button type="button" class="is-btn" data-action="back" title="Go back" hidden>←</button>
        <button type="button" class="is-btn" data-action="refresh" title="Refresh">⟳</button>
        <button type="button" class="is-btn" data-action="expand" title="Expand">⤢</button>
        <button type="button" class="is-btn" data-action="close" title="Hide">✕</button>
      </div>
    </header>
    <div class="is-body">
      <svg class="is-connectors" data-connectors aria-hidden="true"></svg>
      <div class="is-stage" data-stage></div>
    </div>
    <footer class="is-footer">
      <button type="button" class="is-cta" data-action="explore">Find related papers</button>
    </footer>
  `;

  root.append(fab, panel);
  document.documentElement.appendChild(root);

  const els = {
    status: panel.querySelector('[data-status]'),
    subtitle: panel.querySelector('[data-subtitle]'),
    stage: panel.querySelector('[data-stage]'),
    connectors: panel.querySelector('[data-connectors]'),
    back: panel.querySelector('[data-action="back"]'),
    explore: panel.querySelector('[data-action="explore"]'),
    expand: panel.querySelector('[data-action="expand"]')
  };

  function setStatus(kind) {
    els.status.dataset.state = kind;
  }

  // —— Rendering ——————————————————————————————————————

  function render() {
    const paper = state.current;
    if (!paper) return;

    els.subtitle.textContent = paper.direction || 'Research explorer';
    els.back.hidden = state.stack.length === 0;
    els.explore.textContent = state.children.length
      ? state.openGrandchildren.size
        ? 'Collapse branches'
        : 'Collapse related'
      : 'Find related papers';

    els.stage.innerHTML = '';
    els.connectors.innerHTML = '';

    const main = createNode(paper, { kind: 'main' });
    els.stage.appendChild(main);

    state.children.forEach((child, index) => {
      const childEl = createNode(child, { kind: 'child', index });
      els.stage.appendChild(childEl);

      if (state.openGrandchildren.has(child.id) && state.grandchildren[child.id]) {
        state.grandchildren[child.id].forEach((gc, gIndex) => {
          els.stage.appendChild(createNode(gc, { kind: 'grand', parentIndex: index, index: gIndex }));
        });
      }
    });

    requestAnimationFrame(layoutAndConnect);
  }

  function createNode(paper, opts) {
    const node = document.createElement('article');
    node.className = `is-node is-node-${opts.kind}`;
    node.dataset.id = paper.id;
    if (opts.kind === 'child') node.dataset.childIndex = String(opts.index);
    if (opts.kind === 'grand') {
      node.dataset.parentIndex = String(opts.parentIndex);
      node.dataset.grandIndex = String(opts.index);
    }

    const authorLine = paper.authors?.length
      ? `${paper.authors[0]}${paper.authors.length > 1 ? ' et al.' : ''}`
      : 'Unknown authors';

    const gaps = (paper.gaps || []).slice(0, 2);

    node.innerHTML = `
      <div class="is-node-top">
        <span class="is-chip">${escapeHtml(paper.direction || Graph.inferDirection(paper.title))}</span>
        ${opts.kind !== 'main' ? '<span class="is-source">' + escapeHtml(paper.source || 'link') + '</span>' : ''}
      </div>
      <a class="is-node-title" href="${escapeAttr(paper.url || `https://arxiv.org/abs/${paper.id}`)}" target="_blank" rel="noopener noreferrer">${escapeHtml(truncate(paper.title, opts.kind === 'main' ? 90 : 70))}</a>
      <div class="is-node-meta">${escapeHtml(truncate(authorLine, 40))}</div>
      ${gaps.length ? `<ul class="is-gaps">${gaps.map((g) => `<li>${escapeHtml(truncate(g, 64))}</li>`).join('')}</ul>` : ''}
      ${opts.kind === 'child' ? '<button type="button" class="is-mini" data-more>Find more</button>' : ''}
      ${opts.kind !== 'main' ? '<button type="button" class="is-mini is-focus" data-focus>Explore this</button>' : ''}
    `;

    node.querySelector('[data-more]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleGrandchildren(paper);
    });

    node.querySelector('[data-focus]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      focusPaper(paper);
    });

    return node;
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  function layoutAndConnect() {
    const stage = els.stage;
    const rect = stage.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    els.connectors.setAttribute('viewBox', `0 0 ${w} ${h}`);
    els.connectors.setAttribute('width', String(w));
    els.connectors.setAttribute('height', String(h));

    const main = stage.querySelector('.is-node-main');
    if (!main) return;

    const mainW = Math.min(260, w * 0.42);
    const mainH = Math.min(168, h * 0.42);
    const mainX = 20;
    const mainY = (h - mainH) / 2;
    place(main, mainX, mainY, mainW, mainH);

    const children = Array.from(stage.querySelectorAll('.is-node-child'));
    const childW = Math.min(210, w * 0.34);
    const childH = Math.min(150, h * 0.36);
    const colX = mainX + mainW + 48;
    const gap = 16;
    const totalH = children.length * childH + Math.max(0, children.length - 1) * gap;
    let y0 = Math.max(12, (h - totalH) / 2);

    children.forEach((child, i) => {
      const y = y0 + i * (childH + gap);
      place(child, colX, y, childW, childH);
      drawLink(mainX + mainW, mainY + mainH / 2, colX, y + childH / 2);

      const grands = Array.from(
        stage.querySelectorAll(`.is-node-grand[data-parent-index="${i}"]`)
      );
      if (!grands.length) return;

      const gW = Math.min(180, w * 0.28);
      const gH = Math.min(120, (h - 24) / Math.max(grands.length, 1) - 8);
      const gX = colX + childW + 40;
      const gTotal = grands.length * gH + Math.max(0, grands.length - 1) * 10;
      let gY = y + childH / 2 - gTotal / 2;
      gY = Math.max(8, Math.min(gY, h - gTotal - 8));

      grands.forEach((g, gi) => {
        const gy = gY + gi * (gH + 10);
        place(g, gX, gy, gW, gH);
        drawLink(colX + childW, y + childH / 2, gX, gy + gH / 2);
      });
    });
  }

  function place(el, x, y, w, h) {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
  }

  function drawLink(x1, y1, x2, y2) {
    const mid = (x1 + x2) / 2;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`);
    path.setAttribute('class', 'is-link');
    els.connectors.appendChild(path);
  }

  // —— Actions ————————————————————————————————————————

  async function bootstrap() {
    state.current = readPageMeta();
    state.children = [];
    state.grandchildren = {};
    state.openGrandchildren = new Set();
    state.stack = [];
    setStatus('ready');
    render();
  }

  async function explore() {
    if (state.children.length) {
      state.children = [];
      state.grandchildren = {};
      state.openGrandchildren = new Set();
      render();
      return;
    }

    setStatus('loading');
    state.loading = true;
    els.explore.disabled = true;
    els.explore.textContent = 'Searching…';

    try {
      state.children = await fetchRelated(state.current);
      setStatus(state.children.length ? 'ready' : 'error');
    } catch {
      state.children = Graph.genericSuggestions(state.current.title, 3);
      setStatus('ready');
    } finally {
      state.loading = false;
      els.explore.disabled = false;
      render();
    }
  }

  async function toggleGrandchildren(paper) {
    if (state.openGrandchildren.has(paper.id)) {
      state.openGrandchildren.delete(paper.id);
      render();
      return;
    }

    setStatus('loading');
    if (!state.grandchildren[paper.id]) {
      state.grandchildren[paper.id] = await fetchRelated(paper);
    }
    state.openGrandchildren.add(paper.id);
    setStatus('ready');
    render();
  }

  async function focusPaper(paper) {
    state.stack.push({
      current: state.current,
      children: state.children,
      grandchildren: state.grandchildren,
      openGrandchildren: Array.from(state.openGrandchildren)
    });
    state.current = paper;
    state.children = [];
    state.grandchildren = {};
    state.openGrandchildren = new Set();
    panel.classList.add('is-transition');
    render();
    setTimeout(() => panel.classList.remove('is-transition'), 280);
  }

  function goBack() {
    const prev = state.stack.pop();
    if (!prev) return;
    state.current = prev.current;
    state.children = prev.children;
    state.grandchildren = prev.grandchildren;
    state.openGrandchildren = new Set(prev.openGrandchildren);
    panel.classList.add('is-transition');
    render();
    setTimeout(() => panel.classList.remove('is-transition'), 280);
  }

  function setOpen(open) {
    state.open = open;
    root.classList.toggle('is-hidden-panel', !open);
    fab.classList.toggle('is-active', open);
  }

  function toggleExpand() {
    state.expanded = !state.expanded;
    panel.classList.toggle('is-expanded', state.expanded);
    panel.classList.toggle('is-compact', !state.expanded);
    els.expand.textContent = state.expanded ? '⤡' : '⤢';
    requestAnimationFrame(layoutAndConnect);
    setTimeout(layoutAndConnect, 220);
  }

  // —— Events ————————————————————————————————————————

  fab.addEventListener('click', () => setOpen(!state.open));

  panel.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action === 'close') setOpen(false);
    if (action === 'expand') toggleExpand();
    if (action === 'refresh') bootstrap().then(() => explore());
    if (action === 'back') goBack();
    if (action === 'explore') explore();
  });

  // Drag panel by header
  const handle = panel.querySelector('[data-drag-handle]');
  handle.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    const rect = panel.getBoundingClientRect();
    state.drag = {
      ox: e.clientX - rect.left,
      oy: e.clientY - rect.top
    };
    handle.setPointerCapture(e.pointerId);
    panel.classList.add('is-dragging');
  });

  handle.addEventListener('pointermove', (e) => {
    if (!state.drag) return;
    const x = Math.min(window.innerWidth - 80, Math.max(8, e.clientX - state.drag.ox));
    const y = Math.min(window.innerHeight - 80, Math.max(8, e.clientY - state.drag.oy));
    panel.style.left = `${x}px`;
    panel.style.top = `${y}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  });

  handle.addEventListener('pointerup', () => {
    state.drag = null;
    panel.classList.remove('is-dragging');
  });

  window.addEventListener('resize', () => requestAnimationFrame(layoutAndConnect));

  // SPA-ish url changes on arXiv
  let lastHref = location.href;
  const mo = new MutationObserver(() => {
    if (location.href === lastHref) return;
    lastHref = location.href;
    if (extractArxivId()) bootstrap();
  });
  mo.observe(document, { subtree: true, childList: true });

  // —— Boot ——————————————————————————————————————————

  setOpen(true);
  bootstrap();
})();
