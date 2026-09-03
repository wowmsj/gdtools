(() => {
  const advancedSections = [
    { id: 'schemes', label: '方案管理', hint: '保存、加载与应用配置' },
    { id: 'pity', label: '保底机制', hint: '阈值、稀有度与保底概率' },
    { id: 'curve', label: '概率曲线', hint: '基础概率与分段递增规则' },
    { id: 'pools', label: '卡池内容', hint: '稀有度内的卡池分配' },
    { id: 'cards', label: '卡牌列表', hint: '卡池内的具体卡牌概率' },
  ];

  function activateAdvancedPanel(panels, activeId) {
    let found = false;
    panels.forEach(panel => {
      const active = panel.id === activeId;
      (panel.elements ?? [panel.element]).forEach(element => {
        element.hidden = !active;
        element.classList.toggle('is-active', active);
      });
      found ||= active;
    });
    return found;
  }

  function buildEqualCards(rarity, count) {
    const base = Math.floor(10000 / count);
    const remainder = 10000 % count;
    return Object.fromEntries(Array.from({ length: count }, (_, index) => [`${rarity}卡${index + 1}`, base + (index < remainder ? 1 : 0)]));
  }

  function getSimpleCardCounts(rarities, rarityInnerProb, cardProb) {
    return Object.fromEntries(rarities.map(rarity => {
      const pools = Object.keys(rarityInnerProb[rarity] || {});
      const count = pools.reduce((total, pool) => total + Object.keys(cardProb[pool] || {}).length, 0);
      return [rarity, Math.max(1, count)];
    }));
  }

  function initAdvancedConsole(doc = document) {
    const root = doc.querySelector('#advanced');
    if (!root || root.dataset.consoleReady) return;
    const panels = advancedSections.map(section => ({ ...section, elements: [...root.querySelectorAll(`[data-advanced-section="${section.id}"]`)] })).filter(panel => panel.elements.length);
    if (!panels.length) return;

    root.dataset.consoleReady = 'true';
    root.classList.add('advanced-console');
    const nav = doc.createElement('nav'); nav.className = 'advanced-console-nav'; nav.setAttribute('aria-label', '高级配置导航');
    const content = doc.createElement('div'); content.className = 'advanced-console-content';
    const title = doc.createElement('div'); title.className = 'advanced-console-title'; title.innerHTML = '<span>抽卡参数控制台</span><small>配置变更后请应用方案</small>';
    const buttons = new Map();

    panels.forEach(panel => {
      panel.elements.forEach(element => { element.classList.add('advanced-console-panel'); content.append(element); });
      const button = doc.createElement('button'); button.type = 'button'; button.dataset.advancedPanel = panel.id;
      button.innerHTML = `<strong>${panel.label}</strong><small>${panel.hint}</small>`;
      button.addEventListener('click', () => select(panel.id)); nav.append(button); buttons.set(panel.id, button);
    });
    root.replaceChildren(title, nav, content);

    function select(id) {
      if (!activateAdvancedPanel(panels, id)) return;
      buttons.forEach((button, buttonId) => button.classList.toggle('active', buttonId === id));
    }
    select(panels[0].id);
  }

  const api = { advancedSections, activateAdvancedPanel, buildEqualCards, getSimpleCardCounts, initAdvancedConsole };
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof window !== 'undefined') window.GachaAdvancedConsole = api;
})();
