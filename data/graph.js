/**
 * Curated research lineages for Inspired Search.
 * Used when the live arXiv API is unavailable or to seed known papers.
 */
(function (global) {
  const PAPERS = {
    '1706.03762': {
      id: '1706.03762',
      title: 'Attention Is All You Need',
      authors: ['Vaswani', 'Shazeer', 'Parmar'],
      gaps: [
        'Quadratic attention cost on long sequences',
        'Limited inductive bias for structured data',
        'Training requires large corpora'
      ],
      related: ['1810.04805', '2010.11929', '2005.14165']
    },
    '1810.04805': {
      id: '1810.04805',
      title: 'BERT: Pre-training of Deep Bidirectional Transformers',
      authors: ['Devlin', 'Chang', 'Lee', 'Toutanova'],
      gaps: [
        'Heavy pre-training compute',
        'Weak on very long contexts',
        'Task-specific fine-tuning still needed'
      ],
      related: ['1907.11692', '1909.11942', '1910.10683']
    },
    '2010.11929': {
      id: '2010.11929',
      title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale',
      authors: ['Dosovitskiy', 'Beyer', 'Kolesnikov'],
      gaps: [
        'Needs large datasets vs CNNs',
        'High training cost',
        'Weaker on small-resolution inputs'
      ],
      related: ['2012.12877', '2103.14030', '2106.10270']
    },
    '2005.14165': {
      id: '2005.14165',
      title: 'Language Models are Few-Shot Learners',
      authors: ['Brown', 'Mann', 'Ryder'],
      gaps: [
        'Extreme model size and cost',
        'Prompt sensitivity',
        'Factuality and safety gaps'
      ],
      related: ['2204.02311', '2112.06905', '2303.08774']
    },
    '1907.11692': {
      id: '1907.11692',
      title: 'RoBERTa: A Robustly Optimized BERT Pretraining Approach',
      authors: ['Liu', 'Ott', 'Goyal'],
      gaps: [
        'Even more compute than BERT',
        'Gains uneven across tasks',
        'Sensitive hyperparameter choices'
      ],
      related: ['1910.10683', '2005.14165']
    },
    '1909.11942': {
      id: '1909.11942',
      title: 'ALBERT: A Lite BERT for Self-supervised Learning of Language Representations',
      authors: ['Lan', 'Chen', 'Goodman'],
      gaps: [
        'Parameter sharing can hurt expressiveness',
        'Still data-hungry',
        'Task transfer varies widely'
      ],
      related: ['1910.10683', '2005.14165']
    },
    '1910.10683': {
      id: '1910.10683',
      title: 'Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer',
      authors: ['Raffel', 'Shazeer', 'Roberts'],
      gaps: [
        'Large model variants are costly',
        'Text-to-text framing not ideal for all tasks',
        'Long-document handling still limited'
      ],
      related: ['2005.14165', '2201.11903']
    },
    '2012.12877': {
      id: '2012.12877',
      title: 'Training data-efficient image transformers & distillation through attention',
      authors: ['Touvron', 'Cord', 'Douze'],
      gaps: [
        'Distillation adds pipeline complexity',
        'Domain shift robustness',
        'Still data-sensitive on tiny sets'
      ],
      related: ['2103.14030', '2106.10270']
    },
    '2103.14030': {
      id: '2103.14030',
      title: 'Swin Transformer: Hierarchical Vision Transformer using Shifted Windows',
      authors: ['Liu', 'Lin', 'Cao'],
      gaps: [
        'Many architectural knobs',
        'Memory scales with resolution',
        'Harder to interpret hierarchies'
      ],
      related: ['2106.10270', '2201.03545']
    },
    '2106.10270': {
      id: '2106.10270',
      title: 'Emerging Properties in Self-Supervised Vision Transformers',
      authors: ['Caron', 'Touvron', 'Misra'],
      gaps: [
        'Training recipe complexity',
        'Compute still substantial',
        'Transfer depends on probing setup'
      ],
      related: ['2012.12877', '2103.14030']
    },
    '2204.02311': {
      id: '2204.02311',
      title: 'PaLM: Scaling Language Modeling with Pathways',
      authors: ['Chowdhery', 'Narang', 'Devlin'],
      gaps: [
        'Massive compute barrier',
        'Limited open access',
        'High environmental cost'
      ],
      related: ['2112.06905', '2303.08774']
    },
    '2112.06905': {
      id: '2112.06905',
      title: 'GLaM: Efficient Scaling of Language Models with Mixture-of-Experts',
      authors: ['Du', 'Huang', 'Song'],
      gaps: [
        'Routing complexity',
        'Load-balancing challenges',
        'Expert specialization hard to interpret'
      ],
      related: ['2204.02311', '2303.08774']
    },
    '2201.11903': {
      id: '2201.11903',
      title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models',
      authors: ['Wei', 'Wang', 'Schuurmans'],
      gaps: [
        'Reasoning still brittle',
        'Depends on model scale',
        'Hard to verify intermediate steps'
      ],
      related: ['2005.14165', '2303.08774']
    },
    '2201.03545': {
      id: '2201.03545',
      title: 'A ConvNet for the 2020s',
      authors: ['Liu', 'Mao', 'Wu'],
      gaps: [
        'Less flexible than transformers for some modalities',
        'Scaling laws less explored',
        'Global context still weaker'
      ],
      related: ['2103.14030', '2010.11929']
    },
    '2303.08774': {
      id: '2303.08774',
      title: 'GPT-4 Technical Report',
      authors: ['OpenAI'],
      gaps: [
        'Closed model limits science',
        'Hallucinations persist',
        'Alignment and eval gaps remain'
      ],
      related: ['2204.02311', '2201.11903']
    }
  };

  const DIRECTION_RULES = [
    { re: /(transformer|attention|llm|gpt|bert|language model)/i, dir: 'Language Models' },
    { re: /(diffusion|gan|vae|generat)/i, dir: 'Generative Models' },
    { re: /(self-supervised|contrastive|ssl|dino)/i, dir: 'Representation Learning' },
    { re: /(reinforcement|policy|rl|agent)/i, dir: 'Reinforcement Learning' },
    { re: /(graph|gnn)/i, dir: 'Graph Learning' },
    { re: /(vision|image|video|vit|swin|clip)/i, dir: 'Computer Vision' },
    { re: /(protein|bio|genomic|molecul)/i, dir: 'Computational Biology' },
    { re: /(speech|audio|asr)/i, dir: 'Speech & Audio' }
  ];

  function inferDirection(title) {
    for (const rule of DIRECTION_RULES) {
      if (rule.re.test(title || '')) return rule.dir;
    }
    return 'Machine Learning';
  }

  function getPaper(id) {
    return PAPERS[id] || null;
  }

  function findByTitle(title) {
    const t = (title || '').toLowerCase();
    if (!t) return null;
    for (const paper of Object.values(PAPERS)) {
      if (t.includes(paper.title.toLowerCase().slice(0, 24)) || paper.title.toLowerCase().includes(t.slice(0, 24))) {
        return paper;
      }
    }
    return null;
  }

  function relatedPapers(idOrTitle, limit = 3) {
    const seed = getPaper(idOrTitle) || findByTitle(idOrTitle);
    if (!seed) return [];
    return (seed.related || [])
      .map((rid) => PAPERS[rid])
      .filter(Boolean)
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        title: p.title,
        authors: p.authors,
        gaps: p.gaps,
        url: `https://arxiv.org/abs/${p.id}`,
        direction: inferDirection(p.title),
        source: 'graph'
      }));
  }

  function genericSuggestions(title, limit = 3) {
    const dir = inferDirection(title);
    const pool = Object.values(PAPERS)
      .filter((p) => inferDirection(p.title) === dir || dir === 'Machine Learning')
      .slice(0, 8);
    const picked = pool.length ? pool : Object.values(PAPERS).slice(0, limit);
    return picked.slice(0, limit).map((p) => ({
      id: p.id,
      title: p.title,
      authors: p.authors,
      gaps: p.gaps,
      url: `https://arxiv.org/abs/${p.id}`,
      direction: inferDirection(p.title),
      source: 'graph'
    }));
  }

  global.InspiredSearchGraph = {
    PAPERS,
    inferDirection,
    getPaper,
    findByTitle,
    relatedPapers,
    genericSuggestions
  };
})(typeof window !== 'undefined' ? window : globalThis);
