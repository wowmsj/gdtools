(() => {
const CONFIG_VERSION = 1;

class ConfigError extends Error {
  constructor(errors) {
    super('战斗配置无效');
    this.name = 'ConfigError';
    this.errors = errors;
  }
}

class ExpressionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ExpressionError';
  }
}

const EFFECT_TYPES = new Set(['damage', 'heal', 'modifier', 'dot']);
const ROOT_NAMES = new Set(['self', 'target', 'context']);

function createSeededRandom(seed) {
  let state = Number(seed) >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function validateConfig(config) {
  config = migrateConfig(config);
  const errors = [];
  const addError = (path, message) => errors.push({ path, message });
  const finite = (value) => Number.isFinite(value);

  if (!config || typeof config !== 'object') {
    addError('', '配置必须是对象');
    return { valid: false, errors };
  }
  if (config.version !== CONFIG_VERSION) addError('version', `仅支持配置版本 ${CONFIG_VERSION}`);

  const rules = config.rules;
  if (!rules || typeof rules !== 'object') {
    addError('rules', '缺少战斗规则');
  } else {
    if (!finite(rules.timeStep) || rules.timeStep <= 0) addError('rules.timeStep', '时间步必须大于 0');
    if (!finite(rules.maxTime) || rules.maxTime <= 0) addError('rules.maxTime', '最大时长必须大于 0');
    if (!Number.isInteger(rules.seed)) addError('rules.seed', '随机种子必须是整数');
  }

  for (const side of ['red', 'blue']) {
    const character = config.characters?.[side];
    const path = `characters.${side}`;
    if (!character || typeof character !== 'object') {
      addError(path, '缺少角色');
      continue;
    }
    const attributes = character.attributes;
    if (!attributes || typeof attributes !== 'object') {
      addError(`${path}.attributes`, '缺少角色属性');
      continue;
    }
    for (const name of ['hp', 'maxHp', 'atk', 'def', 'attackInterval']) {
      if (!finite(attributes[name])) addError(`${path}.attributes.${name}`, `${name} 必须是有限数字`);
    }
    if (finite(attributes.hp) && attributes.hp <= 0) addError(`${path}.attributes.hp`, '生命值必须大于 0');
    if (finite(attributes.maxHp) && attributes.maxHp <= 0) addError(`${path}.attributes.maxHp`, '最大生命值必须大于 0');
    if (finite(attributes.attackInterval) && attributes.attackInterval <= 0) {
      addError(`${path}.attributes.attackInterval`, '攻击间隔必须大于 0');
    }
    if (!Array.isArray(character.skills) || character.skills.length === 0) addError(`${path}.skills`, '至少需要一个技能');
  }

  if (!config.skills || typeof config.skills !== 'object') {
    addError('skills', '缺少技能定义');
  } else {
    for (const [skillId, skill] of Object.entries(config.skills)) {
      const path = `skills.${skillId}`;
      if (!Array.isArray(skill.effects) || skill.effects.length === 0) {
        addError(`${path}.effects`, '技能至少需要一个效果');
        continue;
      }
      const trigger = skill.trigger;
      if (!['attack', 'interval'].includes(trigger?.type)) addError(`${path}.trigger.type`, '触发方式必须是 attack 或 interval');
      if (trigger?.type === 'interval' && (!finite(trigger.seconds) || trigger.seconds <= 0)) {
        addError(`${path}.trigger.seconds`, '定时触发秒数必须大于 0');
      }
      for (const [index, effect] of skill.effects.entries()) {
        const effectPath = `${path}.effects.${index}`;
        if (!EFFECT_TYPES.has(effect?.type)) addError(`${effectPath}.type`, '不支持的效果类型');
        if (typeof effect?.formula !== 'string' || !effect.formula.trim()) {
          addError(`${effectPath}.formula`, '效果公式不能为空');
        } else {
          try {
            evaluateExpression(effect.formula, { self: {}, target: {}, context: {}, random: () => 0.5 });
          } catch (error) {
            if (!(error instanceof ExpressionError) || !/属性不存在/.test(error.message)) {
              addError(`${effectPath}.formula`, error.message);
            }
          }
        }
        if (effect?.type === 'dot') {
          if (!Number.isFinite(effect.interval) || effect.interval <= 0) addError(`${effectPath}.interval`, '持续伤害间隔必须大于 0');
          if (!Number.isInteger(effect.ticks) || effect.ticks <= 0) addError(`${effectPath}.ticks`, '持续伤害跳数必须是正整数');
        }
        if (effect?.type === 'modifier') {
          const attribute = effect.attribute;
          if (!attribute || !['red', 'blue'].every(side => Number.isFinite(config.characters?.[side]?.attributes?.[attribute]))) {
            addError(`${effectPath}.attribute`, `属性 ${attribute || '(空)'} 不存在`);
          }
        }
      }
    }
    for (const side of ['red', 'blue']) {
      for (const skillId of config.characters?.[side]?.skills ?? []) {
        if (!config.skills[skillId]) addError(`characters.${side}.skills`, `技能 ${skillId} 不存在`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function migrateConfig(config) {
  const migrated = structuredClone(config);
  for (const skill of Object.values(migrated?.skills ?? {})) skill.trigger ??= { type: 'attack' };
  return migrated;
}

function evaluateExpression(source, scope) {
  const parser = new ExpressionParser(tokenize(source), scope ?? {});
  const result = parser.parse();
  if (!Number.isFinite(result)) throw new ExpressionError('公式结果必须是有限数字');
  return result;
}

function runBattle(config) {
  config = migrateConfig(config);
  const checked = validateConfig(config);
  if (!checked.valid) throw new ConfigError(checked.errors);

  const snapshot = structuredClone(config);
  const random = createSeededRandom(snapshot.rules.seed);
  const state = createBattleState(snapshot);
  const queue = [];
  const events = [];
  let sequence = 0;

  const schedule = (event) => {
    queue.push({ ...event, order: sequence++ });
    queue.sort((left, right) => left.time - right.time || left.source.localeCompare(right.source) || left.order - right.order);
  };

  for (const side of ['red', 'blue']) {
    const interval = state[side].attributes.attackInterval;
    schedule({ time: quantizeTime(interval, snapshot.rules.timeStep), type: 'attack', source: side, target: opponentOf(side) });
    for (const skillId of snapshot.characters[side].skills) {
      const trigger = snapshot.skills[skillId].trigger;
      if (trigger.type === 'interval') schedule({ time: quantizeTime(trigger.seconds, snapshot.rules.timeStep), type: 'skill', source: side, target: opponentOf(side), skillId });
    }
  }

  let endTime = snapshot.rules.maxTime;
  let outcome = 'timeout';
  while (queue.length > 0) {
    const eventTime = queue[0].time;
    if (eventTime > snapshot.rules.maxTime) break;
    const batch = [];
    while (queue.length > 0 && queue[0].time === eventTime) batch.push(queue.shift());
    const activeAtBatchStart = { red: state.red.hp > 0, blue: state.blue.hp > 0 };

    for (const event of batch) {
      if (event.type === 'attack') {
        resolveAttack(event, state, snapshot, random, events, schedule, activeAtBatchStart[event.source]);
      } else if (event.type === 'skill') {
        resolveTimedSkill(event, state, snapshot, random, events, schedule, activeAtBatchStart[event.source]);
      } else if (event.type === 'dot') {
        resolveDot(event, state, snapshot, random, events, schedule);
      }
    }

    const redDefeated = state.red.hp <= 0;
    const blueDefeated = state.blue.hp <= 0;
    if (redDefeated || blueDefeated) {
      endTime = eventTime;
      outcome = redDefeated && blueDefeated ? 'draw' : redDefeated ? 'blue' : 'red';
      if (redDefeated) recordEvent(events, eventTime, 'defeat', 'blue', 'red', undefined, `${snapshot.characters.red.name} 被击败`);
      if (blueDefeated) recordEvent(events, eventTime, 'defeat', 'red', 'blue', undefined, `${snapshot.characters.blue.name} 被击败`);
      break;
    }
  }

  return {
    config: snapshot,
    seed: snapshot.rules.seed,
    summary: {
      outcome,
      endTime,
      remainingHp: { red: state.red.hp, blue: state.blue.hp },
      reasons: buildReasons(events, snapshot),
    },
    events,
  };
}

function createBattleState(config) {
  return Object.fromEntries(['red', 'blue'].map((side) => {
    const attributes = structuredClone(config.characters[side].attributes);
    return [side, { hp: attributes.hp, attributes, modifiers: {} }];
  }));
}

function resolveAttack(event, state, config, random, events, schedule, canAct) {
  const source = state[event.source];
  if (!canAct) return;
  for (const skillId of config.characters[event.source].skills) {
    const skill = config.skills[skillId];
    if (skill.trigger.type !== 'attack') continue;
    recordEvent(events, event.time, 'attack', event.source, event.target, undefined, `${config.characters[event.source].name} 使用 ${skill.name}`);
    for (const effect of skill.effects) resolveEffect(effect, event, state, config, random, events, schedule);
  }
  const nextTime = quantizeTime(event.time + source.attributes.attackInterval, config.rules.timeStep);
  schedule({ time: nextTime, type: 'attack', source: event.source, target: event.target });
}

function resolveTimedSkill(event, state, config, random, events, schedule, canAct) {
  if (!canAct) return;
  const skill = config.skills[event.skillId];
  recordEvent(events, event.time, 'attack', event.source, event.target, undefined, `${config.characters[event.source].name} 使用 ${skill.name}`);
  for (const effect of skill.effects) resolveEffect(effect, event, state, config, random, events, schedule);
  const nextTime = quantizeTime(event.time + skill.trigger.seconds, config.rules.timeStep);
  schedule({ ...event, time: nextTime });
}

function resolveDot(event, state, config, random, events, schedule) {
  if (state[event.source].hp <= 0 || state[event.target].hp <= 0) return;
  const amount = Math.max(0, evaluateExpression(event.formula, {
    self: effectiveAttributes(state[event.source]),
    target: effectiveAttributes(state[event.target]),
    context: { time: event.time },
    random,
  }));
  state[event.target].hp = Math.max(0, state[event.target].hp - amount);
  recordEvent(events, event.time, 'dot', event.source, event.target, amount, `${config.characters[event.source].name} 的持续伤害造成 ${formatNumber(amount)} 点伤害`);
  if (event.remainingTicks > 1) {
    schedule({
      ...event,
      time: quantizeTime(event.time + event.interval, config.rules.timeStep),
      remainingTicks: event.remainingTicks - 1,
    });
  }
}

function resolveEffect(effect, event, state, config, random, events, schedule) {
  const source = state[event.source];
  const target = state[event.target];
  const amount = evaluateExpression(effect.formula, {
    self: effectiveAttributes(source),
    target: effectiveAttributes(target),
    context: { time: event.time },
    random,
  });

  if (effect.type === 'damage') {
    const damage = Math.max(0, amount);
    target.hp = Math.max(0, target.hp - damage);
    recordEvent(events, event.time, 'damage', event.source, event.target, damage, `${config.characters[event.source].name} 对 ${config.characters[event.target].name} 造成 ${formatNumber(damage)} 点伤害`);
    return;
  }
  if (effect.type === 'heal') {
    const heal = Math.max(0, amount);
    source.hp = Math.min(source.attributes.maxHp, source.hp + heal);
    recordEvent(events, event.time, 'heal', event.source, event.source, heal, `${config.characters[event.source].name} 回复 ${formatNumber(heal)} 点生命`);
    return;
  }
  if (effect.type === 'modifier') {
    const attribute = effect.attribute;
    if (!attribute || !Number.isFinite(source.attributes[attribute])) return;
    source.modifiers[attribute] = (source.modifiers[attribute] ?? 0) + amount;
    recordEvent(events, event.time, 'modifier', event.source, event.source, amount, `${config.characters[event.source].name} 的 ${attribute} 改变 ${formatNumber(amount)}`);
    return;
  }
  if (effect.type === 'dot') {
    const interval = Number.isFinite(effect.interval) && effect.interval > 0 ? effect.interval : config.rules.timeStep;
    const ticks = Number.isInteger(effect.ticks) && effect.ticks > 0 ? effect.ticks : 1;
    schedule({
      time: quantizeTime(event.time + interval, config.rules.timeStep),
      type: 'dot',
      source: event.source,
      target: event.target,
      formula: effect.formula,
      interval,
      remainingTicks: ticks,
    });
  }
}

function effectiveAttributes(combatant) {
  const attributes = { ...combatant.attributes };
  for (const [attribute, amount] of Object.entries(combatant.modifiers)) attributes[attribute] += amount;
  attributes.hp = combatant.hp;
  return attributes;
}

function recordEvent(events, time, type, source, target, amount, detail) {
  events.push({ time, type, source, target, ...(amount === undefined ? {} : { amount }), detail });
}

function quantizeTime(time, timeStep) {
  return Number((Math.ceil((time - Number.EPSILON) / timeStep) * timeStep).toFixed(8));
}

function formatNumber(value) {
  return Number.isInteger(value) ? value : value.toFixed(2);
}

function opponentOf(side) {
  return side === 'red' ? 'blue' : 'red';
}

function buildReasons(events, config) {
  const groups = new Map();
  for (const [index, event] of events.entries()) {
    if (!['damage', 'dot', 'heal'].includes(event.type) || !Number.isFinite(event.amount) || event.amount <= 0) continue;
    const category = event.type === 'heal' ? '治疗' : event.type === 'dot' ? '持续伤害' : '伤害';
    const key = `${event.source}:${category}`;
    const group = groups.get(key) ?? { source: event.source, category, value: 0, eventIndexes: [] };
    group.value += event.amount;
    group.eventIndexes.push(index);
    groups.set(key, group);
  }
  return [...groups.values()]
    .sort((left, right) => right.value - left.value)
    .slice(0, 3)
    .map(group => ({
      label: `${config.characters[group.source].name}${group.category}${formatNumber(group.value)}`,
      value: Number(group.value.toFixed(4)),
      eventIndexes: group.eventIndexes,
    }));
}

function tokenize(source) {
  if (typeof source !== 'string') throw new ExpressionError('公式必须是字符串');
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    const number = source.slice(index).match(/^(?:\d+\.?\d*|\.\d+)/);
    if (number) {
      tokens.push({ type: 'number', value: Number(number[0]) });
      index += number[0].length;
      continue;
    }
    const identifier = source.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identifier) {
      tokens.push({ type: 'identifier', value: identifier[0] });
      index += identifier[0].length;
      continue;
    }
    const operator = source.slice(index, index + 2);
    if (['>=', '<=', '==', '!='].includes(operator)) {
      tokens.push({ type: 'operator', value: operator });
      index += 2;
      continue;
    }
    if ('+-*/^><().,'.includes(char)) {
      tokens.push({ type: char === '(' || char === ')' || char === ',' || char === '.' ? char : 'operator', value: char });
      index += 1;
      continue;
    }
    throw new ExpressionError(`不支持的字符：${char}`);
  }
  tokens.push({ type: 'eof', value: '' });
  return tokens;
}

class ExpressionParser {
  constructor(tokens, scope) {
    this.tokens = tokens;
    this.scope = scope;
    this.index = 0;
  }

  parse() {
    const result = this.parseComparison();
    if (this.current().type !== 'eof') throw new ExpressionError('公式包含多余内容');
    return result;
  }

  parseComparison() {
    let value = this.parseAdditive();
    while (['>', '<', '>=', '<=', '==', '!='].includes(this.current().value)) {
      const operator = this.consume().value;
      const right = this.parseAdditive();
      value = Number(compare(value, right, operator));
    }
    return value;
  }

  parseAdditive() {
    let value = this.parseMultiplicative();
    while (['+', '-'].includes(this.current().value)) {
      const operator = this.consume().value;
      const right = this.parseMultiplicative();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }

  parseMultiplicative() {
    let value = this.parsePower();
    while (['*', '/'].includes(this.current().value)) {
      const operator = this.consume().value;
      const right = this.parsePower();
      if (operator === '/' && right === 0) throw new ExpressionError('公式不能除以 0');
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  }

  parsePower() {
    let value = this.parseUnary();
    if (this.current().value === '^') value **= this.consume() && this.parsePower();
    return value;
  }

  parseUnary() {
    if (this.current().value === '-') {
      this.consume();
      return -this.parseUnary();
    }
    if (this.current().value === '+') {
      this.consume();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.current();
    if (token.type === 'number') return this.consume().value;
    if (token.value === '(') {
      this.consume();
      const value = this.parseComparison();
      this.expect(')');
      return value;
    }
    if (token.type !== 'identifier') throw new ExpressionError('公式缺少数值');
    const identifier = this.consume().value;
    if (this.current().value === '(') return this.parseFunction(identifier);
    return this.readProperty(identifier);
  }

  parseFunction(name) {
    if (!['min', 'max', 'clamp', 'random'].includes(name)) throw new ExpressionError(`不支持的函数：${name}`);
    this.expect('(');
    const args = [];
    if (this.current().value !== ')') {
      args.push(this.parseComparison());
      while (this.current().value === ',') {
        this.consume();
        args.push(this.parseComparison());
      }
    }
    this.expect(')');
    if (name === 'min' && args.length >= 1) return Math.min(...args);
    if (name === 'max' && args.length >= 1) return Math.max(...args);
    if (name === 'clamp' && args.length === 3) return Math.min(Math.max(args[0], args[1]), args[2]);
    if (name === 'random' && (args.length === 0 || args.length === 2)) {
      const random = typeof this.scope.random === 'function' ? this.scope.random : Math.random;
      return args.length === 0 ? random() : args[0] + random() * (args[1] - args[0]);
    }
    throw new ExpressionError(`函数 ${name} 的参数数量不正确`);
  }

  readProperty(root) {
    if (!ROOT_NAMES.has(root) || this.current().value !== '.') throw new ExpressionError(`不支持的标识符：${root}`);
    this.consume();
    const property = this.current();
    if (property.type !== 'identifier') throw new ExpressionError('属性名无效');
    this.consume();
    if (this.current().value === '.') throw new ExpressionError('属性路径最多两段');
    const value = this.scope[root]?.[property.value];
    if (!Number.isFinite(value)) throw new ExpressionError(`属性不存在或不是数字：${root}.${property.value}`);
    return value;
  }

  current() {
    return this.tokens[this.index];
  }

  consume() {
    return this.tokens[this.index++];
  }

  expect(value) {
    if (this.current().value !== value) throw new ExpressionError(`缺少 ${value}`);
    this.consume();
  }
}

function compare(left, right, operator) {
  switch (operator) {
    case '>': return left > right;
    case '<': return left < right;
    case '>=': return left >= right;
    case '<=': return left <= right;
    case '==': return left === right;
    case '!=': return left !== right;
    default: throw new ExpressionError(`不支持的比较运算：${operator}`);
  }
}

const BattleCore = { CONFIG_VERSION, ConfigError, ExpressionError, createSeededRandom, migrateConfig, validateConfig, evaluateExpression, runBattle };
if (typeof module !== 'undefined') module.exports = BattleCore;
else window.BattleCore = BattleCore;
})();
