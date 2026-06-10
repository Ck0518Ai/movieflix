const TMDB_BASE = 'https://api.themoviedb.org/3';

function buildSearchParams(query) {
  const search = new URLSearchParams();

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value == null) continue;
      search.set(key, Array.isArray(value) ? value[0] : String(value));
    }
  }

  if (!search.has('language')) search.set('language', 'ko-KR');
  if (!search.has('region')) search.set('region', 'KR');
  if (!search.has('page')) search.set('page', '1');

  return search;
}

module.exports = async (req, res) => {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'TMDB_API_KEY 환경 변수가 설정되지 않았습니다. Vercel Settings → Environment Variables에서 추가 후 Redeploy 하세요.',
    });
  }

  const search = buildSearchParams(req.query);
  search.set('api_key', apiKey);

  try {
    const response = await fetch(`${TMDB_BASE}/movie/now_playing?${search.toString()}`);
    const data = await response.json();

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(response.status).json(data);
  } catch {
    return res.status(502).json({ error: 'TMDB API 연결에 실패했습니다.' });
  }
};
