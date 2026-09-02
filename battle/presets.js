(() => {
const { CONFIG_VERSION } = typeof module !== 'undefined' ? require('./core.js') : window.BattleCore;

function createBasicDuelPreset() {
  return {
    version: CONFIG_VERSION,
    rules: { timeStep: 0.1, maxTime: 60, seed: 20260901 },
    attributes: [
      { id: 'hp', name: '生命值', type: 'number' },
      { id: 'maxHp', name: '最大生命值', type: 'number' },
      { id: 'atk', name: '攻击力', type: 'number' },
      { id: 'def', name: '防御力', type: 'number' },
      { id: 'attackInterval', name: '攻击间隔', type: 'number' },
    ],
    formulas: {},
    characters: {
      red: {
        name: '红方勇者',
        attributes: { hp: 1200, maxHp: 1200, atk: 150, def: 45, attackInterval: 1 },
        skills: ['basic-red'],
      },
      blue: {
        name: '蓝方守卫',
        attributes: { hp: 1400, maxHp: 1400, atk: 130, def: 65, attackInterval: 1.2 },
        skills: ['basic-blue'],
      },
    },
    skills: {
      'basic-red': { name: '红方普攻', trigger: { type: 'attack' }, effects: [{ type: 'damage', formula: 'max(1, self.atk - target.def)' }] },
      'basic-blue': { name: '蓝方普攻', trigger: { type: 'attack' }, effects: [{ type: 'damage', formula: 'max(1, self.atk - target.def)' }] },
    },
  };
}

const BattlePresets = { createBasicDuelPreset };
if (typeof module !== 'undefined') module.exports = BattlePresets;
else window.BattlePresets = BattlePresets;
})();
