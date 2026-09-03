const assert = require('node:assert/strict');
const { activateAdvancedPanel, advancedSections, buildEqualCards, getSimpleCardCounts } = require('../advanced-console.js');

assert.deepEqual(advancedSections.map(section => section.id), ['schemes', 'pity', 'curve', 'pools', 'cards']);

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
