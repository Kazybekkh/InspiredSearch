(
  function() {
    const existing = document.getElementById('inspired-search-overlay');
    if (existing) {
      return;
    }

    const extractArxivIdFromLocation = (url) => {
      try {
        const u = new URL(url);
        const path = u.pathname;
        const absMatch = path.match(/\/(abs|pdf|html)\/([\w.-]+)(\.pdf)?/);
        if (absMatch && absMatch[2]) {
          return absMatch[2];
        }
        const idQuery = u.searchParams.get('id') || u.searchParams.get('paper') || '';
        if (idQuery) {
          return idQuery;
        }
        return '';
      } catch (_) {
        return '';
      }
    };

    const truncate = (text, max) => {
      if (!text) return '';
      return text.length > max ? text.slice(0, max - 1) + '…' : text;
    };

    const inferDirectionFromTitle = (title) => {
      const t = (title || '').toLowerCase();
      if (/(transformer|attention|llm|gpt)/.test(t)) return 'Large Language Models';
      if (/(diffusion|gan|vae)/.test(t)) return 'Generative Modeling';
      if (/(self-supervised|contrastive|ssl)/.test(t)) return 'Representation Learning';
      if (/(reinforcement|policy|rl)/.test(t)) return 'Reinforcement Learning';
      if (/(graph|gnn)/.test(t)) return 'Graph ML';
      if (/(vision|image|video|clip)/.test(t)) return 'Vision';
      if (/(protein|bio|genomics)/.test(t)) return 'Bio/Computational Biology';
      return 'General ML';
    };

    const computeRiskColor = (risk) => {
      if (risk <= 0.33) return 'low';
      if (risk <= 0.66) return 'medium';
      return 'high';
    };

    const readMeta = () => {
      const title = document.querySelector('meta[name="citation_title"]')?.getAttribute('content')
        || document.querySelector('h1.title, h1')?.textContent?.replace(/^Title:\\s*/i, '')
        || document.title;
      const authors = Array.from(document.querySelectorAll('meta[name="citation_author"]'))
        .map((m) => m.getAttribute('content') || '')
        .filter(Boolean);
      return { title: (title || '').trim(), authors };
    };

    const arxivId = extractArxivIdFromLocation(window.location.href);
    const meta = readMeta();

    const overlay = document.createElement('div');
    overlay.id = 'inspired-search-overlay';
    overlay.className = 'iso is-compact';

    const header = document.createElement('div');
    header.className = 'iso-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'iso-title';
    const statusDot = document.createElement('span');
    statusDot.className = 'iso-status-dot iso-status-idle';
    const titleText = document.createElement('span');
    titleText.className = 'iso-title-text';
    titleText.textContent = 'Inspired Search';
    titleWrap.append(statusDot, titleText);

    const controls = document.createElement('div');
    controls.className = 'iso-controls';
    const btnExpand = document.createElement('button');
    btnExpand.className = 'iso-btn iso-expand';
    btnExpand.title = 'Expand';
    btnExpand.textContent = '⤢';
    const btnRefresh = document.createElement('button');
    btnRefresh.className = 'iso-btn iso-refresh';
    btnRefresh.title = 'Refresh';
    btnRefresh.textContent = '⟳';
    const linkOpen = document.createElement('a');
    linkOpen.className = 'iso-btn iso-open';
    linkOpen.title = 'Open Web App';
    linkOpen.target = '_blank';
    linkOpen.rel = 'noopener noreferrer';
    linkOpen.textContent = '↗';
    controls.append(btnExpand, btnRefresh, linkOpen);

    header.append(titleWrap, controls);

    const body = document.createElement('div');
    body.className = 'iso-body';

    const svgNS = 'http://www.w3.org/2000/svg';
    const connectors = document.createElementNS(svgNS, 'svg');
    connectors.classList.add('iso-connectors');
    const defs = document.createElementNS(svgNS, 'defs');
    const marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', 'iso-arrowhead');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('refX', '4');
    marker.setAttribute('refY', '4');
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerUnits', 'strokeWidth');
    const markerPath = document.createElementNS(svgNS, 'path');
    markerPath.setAttribute('d', 'M0,0 L8,4 L0,8 z');
    markerPath.setAttribute('fill', '#007bff');
    marker.appendChild(markerPath);
    defs.appendChild(marker);
    connectors.appendChild(defs);

    const mainNode = document.createElement('div');
    mainNode.className = 'iso-node iso-node-main';
    const mainTitle = document.createElement('div');
    mainTitle.className = 'iso-node-title';
    const mainMeta = document.createElement('div');
    mainMeta.className = 'iso-node-meta';
    const mainRisk = document.createElement('span');
    mainRisk.className = 'iso-risk iso-risk-low';
    mainTitle.textContent = truncate(meta.title, 72);
    const authors = meta.authors;
    const authorText = authors.length ? `${authors[0]}${authors.length > 1 ? ' et al.' : ''}` : '';
    mainMeta.textContent = truncate(authorText, 42);
    const mainDir = document.createElement('div');
    mainDir.className = 'iso-node-dir';
    mainDir.textContent = inferDirectionFromTitle(meta.title);
    mainNode.append(mainRisk, mainTitle, mainMeta, mainDir);

    const suggestionsWrap = document.createElement('div');
    suggestionsWrap.className = 'iso-suggestions';

    body.append(connectors, mainNode, suggestionsWrap);
    overlay.append(header, body);
    document.body.appendChild(overlay);

    const setStatus = (status) => {
      statusDot.classList.remove('iso-status-idle', 'iso-status-loading', 'iso-status-ready', 'iso-status-error');
      statusDot.classList.add(`iso-status-${status}`);
    };

    const relayout = () => {
      const rect = body.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2 + 10;
      const mainW = 220;
      const mainH = 90;
      mainNode.style.left = `${cx - mainW / 2}px`;
      mainNode.style.top = `${cy - mainH / 2 - 60}px`;
      mainNode.style.width = `${mainW}px`;
      mainNode.style.height = `${mainH}px`;
      connectors.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
      connectors.setAttribute('width', String(rect.width));
      connectors.setAttribute('height', String(rect.height));
    };

    const clearSuggestions = () => {
      suggestionsWrap.innerHTML = '';
      Array.from(connectors.querySelectorAll('line')).forEach((l) => l.remove());
    };

    const createSuggestionNode = (sugg) => {
      const node = document.createElement('a');
      node.className = 'iso-node iso-node-sugg iso-appear';
      node.target = '_blank';
      node.rel = 'noopener noreferrer';
      node.href = sugg.url || `https://arxiv.org/abs/${sugg.id || ''}`;

      const risk = document.createElement('span');
      risk.className = `iso-risk iso-risk-${computeRiskColor(sugg.risk ?? Math.random())}`;
      const title = document.createElement('div');
      title.className = 'iso-node-title';
      title.textContent = truncate(sugg.title || '', 60);
      const meta = document.createElement('div');
      meta.className = 'iso-node-meta';
      if (sugg.authors && sugg.authors.length) {
        meta.textContent = truncate(`${sugg.authors[0]}${sugg.authors.length > 1 ? ' et al.' : ''}`, 42);
      } else {
        meta.textContent = '';
      }
      const dir = document.createElement('div');
      dir.className = 'iso-node-dir';
      dir.textContent = inferDirectionFromTitle(sugg.title || '');

      node.append(risk, title, meta, dir);
      return node;
    };

    const drawConnectors = (positions, mainRect, containerRect) => {
      Array.from(connectors.querySelectorAll('line')).forEach((l) => l.remove());
      positions.forEach((pos) => {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('stroke', '#007bff');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#iso-arrowhead)');
        line.setAttribute('x1', String(mainRect.left + mainRect.width / 2 - containerRect.left));
        line.setAttribute('y1', String(mainRect.bottom - containerRect.top));
        line.setAttribute('x2', String(pos.left + pos.width / 2 - containerRect.left));
        line.setAttribute('y2', String(pos.top - containerRect.top));
        connectors.appendChild(line);
      });
    };

    const radialLayoutAndRender = (suggestions) => {
      clearSuggestions();
      const bodyRect = body.getBoundingClientRect();
      const centerX = bodyRect.width / 2;
      const centerY = bodyRect.height / 2 + 10;

      const n = suggestions.length;
      const radius = Math.max(120, Math.min(centerX, centerY) - 40);
      const angleStep = (Math.PI * 2) / Math.max(1, n);
      const placedRects = [];
      const nodes = [];

      for (let i = 0; i < n; i++) {
        const node = createSuggestionNode(suggestions[i]);
        suggestionsWrap.appendChild(node);
        const nodeW = 180;
        const nodeH = 88;
        const angle = -Math.PI / 2 + i * angleStep;
        const x = centerX + radius * Math.cos(angle) - nodeW / 2;
        const y = centerY + radius * Math.sin(angle) - nodeH / 2 + 40;
        node.style.width = `${nodeW}px`;
        node.style.height = `${nodeH}px`;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        nodes.push(node);
        placedRects.push({ left: x, top: y, width: nodeW, height: nodeH });
      }

      requestAnimationFrame(() => {
        const mainRect = mainNode.getBoundingClientRect();
        const containerRect = body.getBoundingClientRect();
        drawConnectors(placedRects, mainRect, containerRect);
      });
    };

    const mockSuggestions = (seedTitle) => {
      const sample = [
        'Efficient Training of Vision Transformers',
        'Contrastive Pretraining for Multimodal Retrieval',
        'Graph Neural Networks for Scientific Discovery',
        'Improving RL with World Models',
        'Diffusion Models for Audio Synthesis',
        'Self-Supervised Learning of Molecular Representations',
        'Neural ODEs for Time Series',
      ];
      const authors = [
        ['Smith'], ['Johnson'], ['Lee'], ['Patel'], ['Garcia'], ['Wang'], ['Brown']
      ];
      const out = [];
      for (let i = 0; i < 6; i++) {
        out.push({
          id: `mock-${i}`,
          title: sample[(i + (seedTitle?.length || 0)) % sample.length],
          authors: authors[i % authors.length],
          risk: 0.2 + 0.12 * i,
          url: ''
        });
      }
      return out;
    };

    const resolveApiBase = () => {
      try {
        const cfg = window.InspiredSearchConfig;
        if (cfg && typeof cfg.apiBase === 'string' && cfg.apiBase) return cfg.apiBase;
      } catch (_) {}
      return 'https://inspiredsearch.app/api';
    };

    const fetchSuggestions = async (paperId) => {
      const apiBase = resolveApiBase();
      const url = `${apiBase.replace(/\/$/, '')}/suggest?p=${encodeURIComponent(paperId)}`;
      try {
        const res = await fetch(url, { credentials: 'omit', cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        const items = Array.isArray(data?.suggestions) ? data.suggestions : Array.isArray(data) ? data : [];
        return items.map((it, idx) => ({
          id: it.id || it.arxiv_id || `api-${idx}`,
          title: it.title || '',
          authors: it.authors || [],
          url: it.url || it.link || '',
          risk: typeof it.risk === 'number' ? it.risk : Math.random()
        }));
      } catch (_) {
        return mockSuggestions(meta.title);
      }
    };

    const rerender = async () => {
      setStatus('loading');
      relayout();
      const list = arxivId ? await fetchSuggestions(arxivId) : mockSuggestions(meta.title);
      radialLayoutAndRender(list);
      setStatus('ready');
      linkOpen.href = arxivId ? `https://inspiredsearch.app/?paper=${encodeURIComponent(arxivId)}` : 'https://inspiredsearch.app/';
    };

    btnExpand.addEventListener('click', () => {
      overlay.classList.toggle('is-expanded');
      overlay.classList.toggle('is-compact');
      relayout();
      setTimeout(relayout, 250);
    });
    btnRefresh.addEventListener('click', () => {
      rerender();
    });

    rerender();

    window.addEventListener('resize', relayout);

    let lastUrl = window.location.href;
    const mo = new MutationObserver(() => {
      if (lastUrl !== window.location.href) {
        lastUrl = window.location.href;
        const newId = extractArxivIdFromLocation(lastUrl);
        if (newId && newId !== arxivId) {
          rerender();
        }
      }
    });
    mo.observe(document, { subtree: true, childList: true });
  }
)();