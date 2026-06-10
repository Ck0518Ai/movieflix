const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 5500;
const API_KEY = process.env.TMDB_API_KEY || 'bb73a915971c64b5ba4459b6cb9eff5b';
const TMDB_BASE = 'https://api.themoviedb.org/3';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function proxyToTmdb(apiPath, query, res) {
  const search = new URLSearchParams(query);
  search.set('api_key', API_KEY);

  const url = `${TMDB_BASE}${apiPath}?${search.toString()}`;

  https
    .get(url, (proxyRes) => {
      let body = '';

      proxyRes.on('data', (chunk) => {
        body += chunk;
      });

      proxyRes.on('end', () => {
        res.writeHead(proxyRes.statusCode, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(body);
      });
    })
    .on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'TMDB API 연결에 실패했습니다.' }));
    });
}

function serveStatic(filePath, res) {
  const ext = path.extname(filePath);
  const mime = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (url.pathname === '/api/movies/now_playing') {
    proxyToTmdb('/movie/now_playing', url.searchParams, res);
    return;
  }

  let filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  serveStatic(filePath, res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`서버 실행: http://127.0.0.1:${PORT}/index.html`);
  console.log('Live Server는 종료하고 이 서버만 사용하세요.');
});
