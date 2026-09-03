const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const measurementId = 'G-JXF74WY7R4';
for (const file of ['templates/full.html', 'templates/index.html', 'gacha_web_simple.html', 'battle/battle.html']) {
  const html = readFileSync(file, 'utf8');
  assert.ok(html.includes(`gtag/js?id=${measurementId}`), `${file} 缺少 Google Analytics 标签`);
  assert.ok(html.includes(`gtag('config', '${measurementId}')`), `${file} 缺少 Google Analytics 配置`);
}

console.log('analytics tags passed');
