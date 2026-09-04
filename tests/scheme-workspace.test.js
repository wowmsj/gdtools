const assert = require('node:assert/strict');
const {
  normalizeSchemes,
  saveScheme,
  copyScheme,
  renameScheme,
  deleteScheme,
  canDiscardChanges,
} = require('../scheme-workspace.js');

const legacy = { Demo: { pity_threshold: 60 } };
assert.deepEqual(normalizeSchemes(legacy), { Demo: { config: { pity_threshold: 60 }, updatedAt: 0 } });

let schemes = saveScheme({}, 'Demo', { pity_threshold: 60 }, 100);
assert.deepEqual(schemes.Demo, { config: { pity_threshold: 60 }, updatedAt: 100 });

const copied = copyScheme(schemes, 'Demo', 200);
assert.equal(copied.name, 'Demo 副本');
assert.deepEqual(copied.schemes['Demo 副本'], { config: { pity_threshold: 60 }, updatedAt: 200 });

const renamed = renameScheme(copied.schemes, 'Demo 副本', '活动池', 300);
assert.equal(renamed.name, '活动池');
assert.deepEqual(renamed.schemes.活动池, { config: { pity_threshold: 60 }, updatedAt: 300 });
assert.equal(Object.hasOwn(renamed.schemes, 'Demo 副本'), false);

const deleted = deleteScheme(renamed.schemes, 'Demo');
assert.equal(Object.hasOwn(deleted, 'Demo'), false);
assert.equal(canDiscardChanges(false), true);
assert.equal(canDiscardChanges(true), false);

console.log('scheme workspace passed');
