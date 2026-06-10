const TMDB_BASE = 'https://api.themoviedb.org/3';

module.exports = async (req, res) => {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: 'TMDB_API_KEY 환경 변수가 설정되지 않았습니다.' });
    return;
  }

  const search = new URLSearchParams(req.query);
  if (!search.has('language')) search.set('language', 'ko-KR');
  if (!search.has('region')) search.set('region', 'KR');
  if (!search.has('page')) search.set('page', '1');
  search.set('api_key', apiKey);

  try {
    const response = await fetch(`${TMDB_BASE}/movie/now_playing?${search.toString()}`);
    const data = await response.json();

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(response.status).json(data);
  } catch {
    res.status(502).json({ error: 'TMDB API 연결에 실패했습니다.' });
  }
};
