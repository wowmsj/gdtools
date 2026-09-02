const assert = require('node:assert/strict');
const { evaluateExpression, migrateConfig, runBattle, validateConfig } = require('../battle/core.js');
const { createBasicDuelPreset } = require('../battle/presets.js');

const scope = {
  self: { atk: 100 },
  target: { def: 50 },
  context: {},
  random: () => 0.5,
};

assert.equal(
  evaluateExpression('self.atk * 1.2 - target.def * 0.3', scope),
  105,
  '公式运算必须遵循数值优先级',
);
assert.throws(
  () => evaluateExpression('window.alert(1)', scope),
  '表达式不得访问浏览器全局对象',
);
assert.deepEqual(
  validateConfig(createBasicDuelPreset()),
  { valid: true, errors: [] },
  '基础模板必须始终是有效配置',
);

const legacy = createBasicDuelPreset();
delete legacy.skills['basic-red'].trigger;
assert.deepEqual(migrateConfig(legacy).skills['basic-red'].trigger, { type: 'attack' });
assert.equal(validateConfig(legacy).valid, true);

const migratedLegacy = createBasicDuelPreset();
migratedLegacy.version = 1;
delete migratedLegacy.attributes[0].defaultValue;
assert.equal(migrateConfig(migratedLegacy).version, 2);
assert.equal(migrateConfig(migratedLegacy).attributes[0].defaultValue, 0);

const duplicateAttribute = createBasicDuelPreset();
duplicateAttribute.attributes.push({ id: 'atk', name: '重复攻击', type: 'number', defaultValue: 0 });
assert.deepEqual(validateConfig(duplicateAttribute).errors, [
  { path: 'attributes.5.id', message: '属性 ID atk 重复' },
]);

const reusable = createBasicDuelPreset();
reusable.formulas.squareDamage = { name: '平方伤害', expression: 'self.atk ^ 2 / target.def ^ 2' };
reusable.skills.sharedStrike = {
  name: '重击', trigger: { type: 'attack' }, effects: [{ type: 'damage', formulaId: 'squareDamage' }],
};
reusable.characters.red.skills = ['sharedStrike'];
reusable.characters.blue.skills = ['sharedStrike'];
reusable.characters.red.attributes = { hp: 100, maxHp: 100, atk: 20, def: 2, attackInterval: 1 };
reusable.characters.blue.attributes = { hp: 100, maxHp: 100, atk: 10, def: 5, attackInterval: 1 };
assert.deepEqual(
  runBattle(reusable).events.filter(event => event.type === 'damage').slice(0, 2).map(event => [event.source, event.amount]),
  [['red', 16], ['blue', 25]],
  '共享技能必须按每个角色自己的属性计算',
);

const missingFormula = createBasicDuelPreset();
missingFormula.skills['basic-red'].effects[0] = { type: 'damage', formulaId: 'missing' };
assert.deepEqual(validateConfig(missingFormula).errors, [
  { path: 'skills.basic-red.effects.0.formulaId', message: '公式 missing 不存在' },
]);

const invalidInterval = createBasicDuelPreset();
invalidInterval.skills['basic-red'].trigger = { type: 'interval', seconds: 0 };
assert.deepEqual(validateConfig(invalidInterval).errors, [
  { path: 'skills.basic-red.trigger.seconds', message: '定时触发秒数必须大于 0' },
]);

const invalidModifier = createBasicDuelPreset();
invalidModifier.skills['basic-red'].effects = [{ type: 'modifier', attribute: 'missing', formula: '10' }];
assert.deepEqual(validateConfig(invalidModifier).errors, [
  { path: 'skills.basic-red.effects.0.attribute', message: '属性 missing 不存在' },
]);

const timed = createBasicDuelPreset();
timed.rules = { timeStep: 0.1, maxTime: 6, seed: 1 };
timed.skills.burst = {
  name: '定时重击',
  trigger: { type: 'interval', seconds: 5 },
  effects: [{ type: 'damage', formula: '99' }],
};
timed.characters.red.skills.push('burst');
const timedResult = runBattle(timed);
assert.equal(timedResult.events.find(event => event.detail.includes('定时重击')).time, 5);

const sameTime = structuredClone(timed);
sameTime.characters.red.attributes.attackInterval = 5;
const namesAtFive = runBattle(sameTime).events
  .filter(event => event.time === 5 && event.type === 'attack' && event.source === 'red')
  .map(event => event.detail);
assert.deepEqual(namesAtFive, ['红方勇者 使用 红方普攻', '红方勇者 使用 定时重击']);

const deterministicWin = createBasicDuelPreset();
deterministicWin.rules = { timeStep: 0.1, maxTime: 5, seed: 7 };
deterministicWin.characters.red.attributes = { hp: 100, maxHp: 100, atk: 100, def: 0, attackInterval: 1 };
deterministicWin.characters.blue.attributes = { hp: 100, maxHp: 100, atk: 10, def: 0, attackInterval: 1 };
const winResult = runBattle(deterministicWin);
assert.equal(winResult.summary.outcome, 'red', '高伤害角色应获胜');
assert.equal(winResult.summary.endTime, 1, '首击应在一个攻击间隔后发生');
assert.equal(winResult.events.filter(event => event.type === 'damage').length, 2, '同一时刻双方伤害都必须结算');

const noDamageConfig = structuredClone(createBasicDuelPreset());
noDamageConfig.rules = { timeStep: 0.1, maxTime: 2, seed: 9 };
noDamageConfig.skills['basic-red'].effects[0].formula = '0';
noDamageConfig.skills['basic-blue'].effects[0].formula = '0';
assert.equal(runBattle(noDamageConfig).summary.outcome, 'timeout', '双方不能造成伤害时必须超时结束');

const simultaneousDefeatConfig = structuredClone(createBasicDuelPreset());
simultaneousDefeatConfig.characters.red.attributes = { hp: 10, maxHp: 10, atk: 10, def: 0, attackInterval: 1 };
simultaneousDefeatConfig.characters.blue.attributes = { hp: 10, maxHp: 10, atk: 10, def: 0, attackInterval: 1 };
assert.equal(runBattle(simultaneousDefeatConfig).summary.outcome, 'draw', '同一时刻互相击败应判平局');

const seededConfig = createBasicDuelPreset();
assert.deepEqual(runBattle(seededConfig), runBattle(seededConfig), '相同配置和种子必须产生相同战报');

const dotConfig = structuredClone(createBasicDuelPreset());
dotConfig.rules = { timeStep: 0.1, maxTime: 2, seed: 3 };
dotConfig.skills['basic-red'].effects = [{ type: 'dot', formula: '10', interval: 1, ticks: 1 }];
dotConfig.skills['basic-blue'].effects = [{ type: 'damage', formula: '0' }];
const dotEvents = runBattle(dotConfig).events.filter(event => event.type === 'dot');
assert.deepEqual(dotEvents.map(event => event.time), [2], '持续伤害必须在后续时间格结算');

const explainedResult = runBattle(createBasicDuelPreset());
assert.ok(explainedResult.summary.reasons.length > 0, '结果必须包含至少一个胜负归因');
assert.ok(explainedResult.summary.reasons.length <= 3, '界面只展示前三项归因');
assert.ok(
  explainedResult.summary.reasons.every(reason => reason.eventIndexes.length > 0),
  '每个归因必须能定位到实际战报事件',
);

console.log('battle core configuration tests passed');
