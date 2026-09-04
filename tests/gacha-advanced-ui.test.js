const assert = require('node:assert/strict');
const fs = require('node:fs');
const { activateAdvancedPanel, advancedSections, buildEqualCards, getSimpleCardCounts } = require('../advanced-console.js');

const html = fs.readFileSync(require.resolve('../templates/full.html'), 'utf8');
assert.match(html, /data-scheme-workspace/);
assert.match(html, /scheme-workspace\.js\?v=20260904-4/);
assert.match(html, /advanced-console\.js\?v=20260904-4/);
assert.match(html, /data-advanced-section="rarities"/);
assert.match(html, /id="rarityManagerList"/);
assert.doesNotMatch(html, /<h5>大保底稀有度概率<\/h5>[\s\S]{0,900}id="newRarityInput"/);
assert.match(require('node:fs').readFileSync(require.resolve('../advanced-console.js'), 'utf8'), /moveRarityType/);
assert.match(html, /class="nav-link active" id="showcase-tab"/);
assert.match(html, /class="tab-pane fade show active" id="showcase"/);
assert.match(html, /n 次 n 抽/);
assert.match(html, /阶梯概率/);
assert.match(html, /Excel 导出/);
assert.match(html, /data-open-tab="advanced-tab"/);
assert.match(html, /id="showcasePityChart"/);
assert.match(html, /id="showcaseDistributionChart"/);
assert.match(html, /id="showcaseTargetChart"/);
assert.match(html, /id="quickRoundStats"/);
assert.match(html, /window\.GachaBatchAnalysis/);
assert.match(html, /运行结果使用当前配置/);
assert.match(require('node:fs').readFileSync(require.resolve('../advanced-console.js'), 'utf8'), /initShowcaseCharts/);
assert.match(html, /id="quickSimulationCount"/);
assert.match(html, /id="quickMaxDraws"/);
assert.match(html, /id="quickPityThreshold"/);
assert.match(html, /目标获取期望/);
assert.match(html, /id="quickExpected"/);
assert.match(html, /data-quick-analysis-run/);
assert.match(html, /id="quickAnalysisStatus"/);
assert.match(html, /showcase-analysis is-loading/);
assert.match(require('node:fs').readFileSync(require.resolve('../advanced-console.js'), 'utf8'), /runQuickAnalysis/);
assert.match(require('node:fs').readFileSync(require.resolve('../advanced-console.js'), 'utf8'), /renderQuickRoundStats/);
assert.match(require('node:fs').readFileSync(require.resolve('../advanced-console.js'), 'utf8'), /quickExpected/);
assert.match(require('node:fs').readFileSync(require.resolve('../advanced-console.js'), 'utf8'), /quickAnalysisStatus/);
const consoleScript = require('node:fs').readFileSync(require.resolve('../advanced-console.js'), 'utf8');
assert.ok(consoleScript.indexOf("analysis?.classList.remove('is-loading')") < consoleScript.indexOf('showcaseCharts.forEach'), 'analysis metrics must be visible before charts render');

const onloadStart = html.indexOf('window.onload = function()');
const configInit = html.indexOf('initConfigTables();', onloadStart);
const consoleInit = html.indexOf('window.GachaAdvancedConsole?.initAdvancedConsole();', onloadStart);
assert.ok(configInit > onloadStart && configInit < consoleInit, 'default configuration must exist before quick analysis starts');

assert.deepEqual(advancedSections.map(section => section.id), ['schemes', 'rarities', 'pity', 'curve', 'pools', 'cards']);

function panel(id) {
  const classes = new Set();
  return { id, element: { hidden: false, classList: { toggle(name, value) { value ? classes.add(name) : classes.delete(name); } } } };
}

const panels = advancedSections.map(section => panel(section.id));
assert.equal(activateAdvancedPanel(panels, 'curve'), true);
assert.equal(panels.find(panel => panel.id === 'curve').element.hidden, false);
assert.equal(panels.find(panel => panel.id === 'pity').element.hidden, true);
assert.equal(activateAdvancedPanel(panels, 'missing'), false);

assert.deepEqual(buildEqualCards('SSR', 8), { SSR卡1: 1250, SSR卡2: 1250, SSR卡3: 1250, SSR卡4: 1250, SSR卡5: 1250, SSR卡6: 1250, SSR卡7: 1250, SSR卡8: 1250 });
assert.deepEqual(buildEqualCards('UR', 3), { UR卡1: 3334, UR卡2: 3333, UR卡3: 3333 });
assert.deepEqual(getSimpleCardCounts(['UR', 'R'], { UR: { UR_A: 10000 }, R: { R_A: 10000 } }, { UR_A: { UR卡1: 10000 }, R_A: { R卡1: 10000 } }), { UR: 1, R: 1 });

console.log('gacha advanced UI passed');
