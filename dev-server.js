// 零依赖静态服务器：npm run dev [-- --port 7100] [-- --host 127.0.0.1]
// 根路径 / 直接返回 gacha_web_simple.html（纯前端单文件应用，无需 Flask）
const http = require('http');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const i = args.indexOf('--' + name);
  if (i !== -1 && args[i + 1]) return args[i + 1];
  const eq = args.find(a => a.startsWith('--' + name + '='));
  if (eq) return eq.split('=')[1];
  return fallback;
}

const PORT = parseInt(getArg('port', process.env.PORT || '7100'), 10);
const HOST = getArg('host', process.env.HOST || '0.0.0.0');
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/' || urlPath === '/index.html') {
    urlPath = '/gacha_web_simple.html';
  }
  const filePath = path.join(ROOT, path.normalize(urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`星轨祈愿 · 抽卡模拟器 dev server: http://localhost:${PORT}/`);
});
