/**
 * Inspired Search — background service worker.
 * Proxies arXiv Atom API queries (avoids content-script CORS limits).
 */

const ARXIV_API = 'https://export.arxiv.org/api/query';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'INSPIRED_SEARCH_QUERY') {
    return false;
  }

  queryArxiv(message.query, message.maxResults || 4)
    .then((papers) => sendResponse({ ok: true, papers }))
    .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));

  return true;
});

async function queryArxiv(query, maxResults) {
  const q = (query || '').trim();
  if (!q) return [];

  const url = new URL(ARXIV_API);
  url.searchParams.set('search_query', buildSearchQuery(q));
  url.searchParams.set('start', '0');
  url.searchParams.set('max_results', String(maxResults));
  url.searchParams.set('sortBy', 'relevance');
  url.searchParams.set('sortOrder', 'descending');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/atom+xml' },
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`arXiv API ${res.status}`);
  }

  const xml = await res.text();
  return parseAtom(xml);
}

function buildSearchQuery(raw) {
  // Prefer all: terms; strip punctuation noise from paper titles.
  const cleaned = raw
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 8)
    .join(' ');
  return `all:${cleaned || raw}`;
}

function parseAtom(xml) {
  const entries = xml.split('<entry>').slice(1);
  return entries.map((chunk) => {
    const idUrl = matchTag(chunk, 'id') || '';
    const id = idUrl.split('/abs/').pop()?.replace(/v\d+$/, '') || '';
    const title = decode((matchTag(chunk, 'title') || '').replace(/\s+/g, ' ').trim());
    const summary = decode((matchTag(chunk, 'summary') || '').replace(/\s+/g, ' ').trim());
    const authors = Array.from(chunk.matchAll(/<name>([^<]*)<\/name>/g)).map((m) => decode(m[1].trim()));
    return {
      id,
      title,
      authors: authors.map((a) => a.split(/\s+/).pop()).filter(Boolean),
      summary,
      url: id ? `https://arxiv.org/abs/${id}` : idUrl,
      source: 'arxiv'
    };
  }).filter((p) => p.id && p.title);
}

function matchTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

function decode(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
