(() => {
  const advancedSections = [
    { id: 'schemes', label: '方案管理', hint: '保存、读取与应用配置' },
    { id: 'rarities', label: '稀有度定义', hint: '新增、删除与优先级排序' },
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
    const title = doc.createElement('div'); title.className = 'advanced-console-title'; title.innerHTML = '<span>抽卡参数控制台</span><small>编辑后保存，运行前应用到模拟器</small>';
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
    initSchemeWorkspace(doc);
    initRarityManager(doc);
    initShowcaseCharts(doc);
    doc.querySelectorAll('[data-open-tab]').forEach(button => button.addEventListener('click', () => {
      const target = doc.getElementById(button.dataset.openTab);
      if (target) new bootstrap.Tab(target).show();
    }));
  }

  let showcaseCharts = [];

  function initShowcaseCharts(doc = document) {
    const button = doc.querySelector('[data-quick-analysis-run]');
    if (!button || button.dataset.ready) return;
    button.dataset.ready = 'true';
    button.addEventListener('click', () => runQuickAnalysis(doc));
    runQuickAnalysis(doc);
  }

  function runQuickAnalysis(doc = document) {
    const status = doc.querySelector('#quickAnalysisStatus');
    const analysis = doc.querySelector('.showcase-analysis');
    if (!window.GachaSimulator || !window.parseConfig) {
      if (status) status.textContent = '模拟器初始化失败，请刷新页面后重试。';
      return;
    }
    if (status) status.textContent = '正在生成真实模拟数据...';
    analysis?.classList.add('is-loading');
    const count = Math.max(1, Math.min(5000, Number(doc.querySelector('#quickSimulationCount').value) || 1000));
    const maxDraws = Math.max(1, Math.min(1000, Number(doc.querySelector('#quickMaxDraws').value) || 90));
    const pity = Math.max(1, Math.min(1000, Number(doc.querySelector('#quickPityThreshold').value) || 90));
    const config = window.parseConfig();
    config.pity_threshold = pity;
    const target = config.rarity_order[0];
    const firstDraws = [];
    for (let index = 0; index < count; index += 1) {
      const result = new window.GachaSimulator(config).simulateSingleUser(target, maxDraws);
      if (result.success) firstDraws.push(result.firstPos);
    }
    const sorted = firstDraws.slice().sort((a, b) => a - b);
    const quantile = p => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] : 0;
    const expected = firstDraws.length ? firstDraws.reduce((sum, draw) => sum + draw, 0) / firstDraws.length : 0;
    const colors = getComputedStyle(doc.documentElement);
    const gold = colors.getPropertyValue('--gold').trim();
    const muted = colors.getPropertyValue('--muted').trim();
    const line = colors.getPropertyValue('--line').trim();
    const baseOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: muted, font: { size: 10 } }, grid: { color: line } }, y: { ticks: { color: muted, font: { size: 10 } }, grid: { color: line } } } };
    const points = [...new Set([1, Math.ceil(maxDraws / 4), Math.ceil(maxDraws / 2), Math.ceil(maxDraws * .75), maxDraws])];
    const probability = points.map(draw => { const sim = new window.GachaSimulator(config); sim.current_draws = draw; return draw === pity ? 100 : (sim._getCurrentProb()[target] || 0) / 100; });
    const bucketSize = Math.ceil(maxDraws / 4);
    const buckets = Array(5).fill(0);
    firstDraws.forEach(draw => { buckets[Math.min(3, Math.floor((draw - 1) / bucketSize))] += 1; });
    buckets[4] = count - firstDraws.length;
    doc.querySelector('#quickActualRuns').textContent = count.toLocaleString();
    doc.querySelector('#quickExpected').textContent = sorted.length ? `${expected.toFixed(1)} 抽` : '未获取';
    doc.querySelector('#quickSuccess').textContent = `${((firstDraws.length / count) * 100).toFixed(1)}%`;
    analysis?.classList.remove('is-loading');
    if (status) status.textContent = '真实统计已生成，正在绘制图表。';
    if (typeof Chart === 'undefined') {
      if (status) status.textContent = '统计已生成，但图表组件未加载；请刷新页面后重试。';
      return;
    }
    showcaseCharts.forEach(chart => chart.destroy());
    const configs = [
      ['showcasePityChart', { type: 'line', data: { labels: points.map(String), datasets: [{ data: probability, borderColor: gold, backgroundColor: 'rgba(231,195,122,.16)', fill: true, tension: .35, pointRadius: 2 }] }, options: { ...baseOptions, scales: { ...baseOptions.scales, y: { ...baseOptions.scales.y, beginAtZero: true, max: 100 } } } }],
      ['showcaseDistributionChart', { type: 'bar', data: { labels: ['P25', 'P50', 'P75', '最大'], datasets: [{ data: [quantile(.25), quantile(.5), quantile(.75), sorted.at(-1) || 0], backgroundColor: ['rgba(104,177,255,.6)', gold, 'rgba(104,177,255,.6)', 'rgba(248,113,113,.65)'], borderRadius: 4 }] }, options: { ...baseOptions, scales: { ...baseOptions.scales, y: { ...baseOptions.scales.y, beginAtZero: true, max: maxDraws } } } }],
      ['showcaseTargetChart', { type: 'bar', data: { labels: [`1-${bucketSize}`, `${bucketSize + 1}-${bucketSize * 2}`, `${bucketSize * 2 + 1}-${bucketSize * 3}`, `${bucketSize * 3 + 1}-${maxDraws}`, '未获取'], datasets: [{ data: buckets, backgroundColor: [gold, 'rgba(104,177,255,.7)', 'rgba(74,222,128,.7)', 'rgba(248,113,113,.7)', 'rgba(153,162,184,.55)'], borderRadius: 4 }] }, options: baseOptions }]
    ];
    showcaseCharts = configs.map(([id, chartConfig]) => new Chart(doc.getElementById(id), chartConfig));
    if (status) status.textContent = '当前数据已基于快捷配置完成真实模拟。';
  }

  function initRarityManager(doc = document) {
    const list = doc.querySelector('#rarityManagerList');
    const orderInput = doc.querySelector('#rarityOrder');
    if (!list || !orderInput || list.dataset.ready) return;
    list.dataset.ready = 'true';

    function orderedRarities() {
      return [...new Set(orderInput.value.split(',').map(item => item.trim()).filter(Boolean))];
    }

    function renderRarityManager() {
      const rarities = orderedRarities();
      list.replaceChildren(...rarities.map((rarity, index) => {
        const row = doc.createElement('div'); row.className = 'rarity-manager-item';
        row.innerHTML = `<span class="rarity-manager-rank">${index + 1}</span><strong>${rarity}</strong><div><button type="button" class="btn btn-sm btn-outline-light" title="上移 ${rarity}" aria-label="上移 ${rarity}" ${index === 0 ? 'disabled' : ''}>&uarr;</button><button type="button" class="btn btn-sm btn-outline-light" title="下移 ${rarity}" aria-label="下移 ${rarity}" ${index === rarities.length - 1 ? 'disabled' : ''}>&darr;</button><button type="button" class="btn btn-sm btn-outline-danger" title="删除 ${rarity}" aria-label="删除 ${rarity}">&times;</button></div>`;
        const [up, down, remove] = row.querySelectorAll('button');
        up.addEventListener('click', () => moveRarityType(rarity, -1));
        down.addEventListener('click', () => moveRarityType(rarity, 1));
        remove.addEventListener('click', () => { const selector = doc.querySelector('#deleteRaritySelector'); selector.value = rarity; window.deleteRarityType(); renderRarityManager(); });
        return row;
      }));
    }

    function moveRarityType(rarity, direction) {
      const rarities = orderedRarities();
      const index = rarities.indexOf(rarity);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= rarities.length) return;
      [rarities[index], rarities[target]] = [rarities[target], rarities[index]];
      orderInput.value = rarities.join(',');
      window.updateRarityProbTableColumns();
      window.updateSmallPityRarityCheckboxes();
      window.updateAutoCalculateSelector();
      renderRarityManager();
    }

    const legacyAdd = window.addRarityType;
    window.addRarityType = () => { legacyAdd(); renderRarityManager(); };
    window.moveRarityType = moveRarityType;
    window.GachaAdvancedConsole.renderRarityManager = renderRarityManager;
    renderRarityManager();
  }

  function initSchemeWorkspace(doc = document) {
    const root = doc.querySelector('[data-scheme-workspace]');
    const store = window.GachaSchemeStore;
    if (!root || !store || root.dataset.ready) return;
    root.dataset.ready = 'true';
    let activeName = '';
    let dirty = false;

    root.innerHTML = `
      <div class="scheme-workspace-head"><div><h5>方案工作台</h5><small id="schemeWorkspaceStatus">当前编辑：未命名方案</small></div><button class="btn btn-sm btn-outline-light" type="button" data-scheme-action="new">新建</button></div>
      <div class="scheme-workspace-grid"><aside><div id="schemeWorkspaceList" class="scheme-workspace-list"></div></aside><section>
        <label for="schemeName">方案名称</label><input id="schemeName" class="form-control mb-3" placeholder="例如：限定角色活动池">
        <div class="d-flex flex-wrap gap-2"><button class="btn btn-success" type="button" data-scheme-action="save">保存</button><button class="btn btn-outline-light" type="button" data-scheme-action="copy">另存为副本</button><button class="btn btn-primary" type="button" data-scheme-action="apply">应用到模拟器</button><button class="btn btn-outline-danger ms-auto" type="button" data-scheme-action="delete">删除</button></div>
        <p id="schemeWorkspaceNotice" class="form-text mt-3 mb-0">方案只保存在当前浏览器。保存后再点击“应用到模拟器”运行。</p>
      </section></div>`;

    const nameInput = root.querySelector('#schemeName');
    const status = root.querySelector('#schemeWorkspaceStatus');
    const notice = root.querySelector('#schemeWorkspaceNotice');
    const list = root.querySelector('#schemeWorkspaceList');
    const read = () => {
      try { return store.normalizeSchemes(JSON.parse(localStorage.getItem('gachaSchemes') || '{}')); } catch { return {}; }
    };
    const write = records => localStorage.setItem('gachaSchemes', JSON.stringify(records));
    const setNotice = message => { notice.textContent = message; };
    const setDirty = value => {
      dirty = value;
      status.textContent = activeName ? `当前编辑：${activeName}${dirty ? '（未保存）' : '（已保存）'}` : `当前编辑：未命名方案${dirty ? '（未保存）' : ''}`;
    };
    const capture = () => {
      const currentActiveTab = doc.querySelector('#probTabs .nav-link.active');
      window.flushBudgetTableToStore();
      const tabs = doc.querySelectorAll('#probTabs .nav-link');
      const tabConfigs = [];
      let config;
      tabs.forEach((tab, index) => {
        new bootstrap.Tab(tab).show();
        const parsed = window.parseConfig();
        if (index === 0) config = parsed;
        tabConfigs.push({ tabName: tab.textContent, rarity_prob: parsed.rarity_prob, rarity_prob_type: parsed.rarity_prob_type, budget_distribution: window.getBudgetForTab(tab.id) });
      });
      config ||= window.parseConfig();
      config.budget_distribution = tabs.length ? window.getBudgetForTab(tabs[0].id) : window.getDefaultBudgetDist();
      config.tab_configs = tabConfigs;
      if (currentActiveTab) new bootstrap.Tab(currentActiveTab).show();
      return config;
    };
    const load = name => {
      if (name !== activeName && dirty && !confirm('当前修改尚未保存，确定切换方案吗？')) return;
      const record = read()[name];
      if (!record) return;
      window.loadConfigToTables(record.config);
      window.updateRarityProbTableColumns();
      window.updateSmallPityRarityCheckboxes();
      if (record.config.tab_configs?.length) window.loadTabConfigs(record.config.tab_configs);
      window.restoreBudgetStore(record.config);
      activeName = name;
      nameInput.value = name;
      setDirty(false);
      setNotice(`已读取「${name}」，可继续编辑或直接应用。`);
      render();
    };
    const render = () => {
      const records = read();
      const entries = Object.entries(records).sort((a, b) => b[1].updatedAt - a[1].updatedAt);
      list.replaceChildren(...entries.map(([name, record]) => {
        const button = doc.createElement('button'); button.type = 'button'; button.className = `scheme-workspace-item${name === activeName ? ' active' : ''}`;
        button.innerHTML = `<strong>${name}</strong><small>${record.updatedAt ? new Date(record.updatedAt).toLocaleString() : '旧方案'}</small>`;
        button.addEventListener('click', () => load(name)); return button;
      }));
      if (!entries.length) list.innerHTML = '<small class="text-muted">还没有保存的方案</small>';
    };
    const save = () => {
      const name = nameInput.value.trim();
      if (!name) { setNotice('请先填写方案名称。'); nameInput.focus(); return; }
      let records = read();
      if (activeName && activeName !== name && Object.hasOwn(records, name) && !confirm(`「${name}」已存在，确定覆盖吗？`)) return;
      if (activeName && activeName !== name) records = store.deleteScheme(records, activeName);
      write(store.saveScheme(records, name, capture()));
      activeName = name;
      setDirty(false);
      setNotice(`「${name}」已保存到当前浏览器。`);
      render();
    };
    root.addEventListener('click', event => {
      const action = event.target.closest('[data-scheme-action]')?.dataset.schemeAction;
      if (!action) return;
      if (action === 'new') { if (!dirty || confirm('当前修改尚未保存，确定新建方案吗？')) { activeName = ''; nameInput.value = ''; setDirty(true); setNotice('已创建未命名方案，请填写名称后保存。'); render(); } }
      if (action === 'save') save();
      if (action === 'copy' && activeName) { const result = store.copyScheme(read(), activeName); write(result.schemes); activeName = result.name; nameInput.value = result.name; setDirty(false); setNotice(`已创建副本「${result.name}」。`); render(); }
      if (action === 'apply') { window.applyConfigToSimulator(capture()); setNotice('当前编辑器配置已应用到模拟器。'); }
      if (action === 'delete' && activeName && confirm(`确定删除方案「${activeName}」吗？`)) { write(store.deleteScheme(read(), activeName)); activeName = ''; nameInput.value = ''; setDirty(false); setNotice('方案已删除，编辑器配置未改变。'); render(); }
    });
    doc.querySelector('#advanced').addEventListener('input', event => { if (!root.contains(event.target)) setDirty(true); }, true);
    doc.querySelector('#advanced').addEventListener('change', event => { if (!root.contains(event.target)) setDirty(true); }, true);
    window.saveScheme = save;
    window.loadScheme = () => { if (activeName) load(activeName); };
    window.applyScheme = () => window.applyConfigToSimulator(capture());
    window.deleteScheme = () => root.querySelector('[data-scheme-action="delete"]').click();
    window.loadSchemes = render;
    render();
    setDirty(false);
  }

  const api = { advancedSections, activateAdvancedPanel, buildEqualCards, getSimpleCardCounts, initAdvancedConsole, initSchemeWorkspace, initRarityManager, moveRarityType: undefined };
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof window !== 'undefined') window.GachaAdvancedConsole = api;
})();
