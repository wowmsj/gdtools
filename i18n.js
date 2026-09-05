(function () {
  const preferenceKey = 'gachaLocalePreference';
  const preferredLocale = localStorage.getItem(preferenceKey);
  const browserLanguage = (navigator.language || '').toLowerCase();

  if (window.location.pathname === '/' && preferredLocale !== 'zh' && preferredLocale !== 'en' && !browserLanguage.startsWith('zh')) {
    window.location.replace('/en');
    return;
  }

  const english = {
    '万能抽卡模拟器': 'Universal Gacha Simulator',
    '概率建模 · 保底机制 · 用户行为模拟，一站式数值验证工作台': 'Probability modeling, pity systems, and player behavior simulation in one validation workspace.',
    '模拟器能力': 'Simulator Overview',
    '计算规则说明': 'Rules',
    '真实用户行为模拟': 'Player Simulation',
    '单抽/批量抽': 'Draw Simulator',
    '收集模拟': 'Collection Simulator',
    '高级配置': 'Advanced Setup',
    '把抽卡数值，变成可验证的结论': 'Turn gacha numbers into verifiable results',
    '从单次概率到 n 次 n 抽、保底机制与玩家行为分布，用同一套配置完成模拟、对比和导出。': 'Model single-draw odds, repeated rounds, pity mechanics, and player behavior with one configuration.',
    '多轮验证': 'Multi-round validation',
    '概率建模': 'Probability modeling',
    '数据分析': 'Data analysis',
    '阶梯概率与保底': 'Probability curves and pity',
    '图表与 Excel 导出': 'Charts and Excel export',
    '批量抽卡可设置多轮运行，直接比较均值、四分位数与极端结果，避免只看一次随机样本。': 'Run multiple rounds to compare averages, quartiles, and extreme results instead of relying on a single random sample.',
    '支持固定值、线性递增、大保底、小保底与自定义稀有度，用接近实际项目的规则验证卡池。': 'Use fixed or linear odds, hard and soft pity, and custom rarities to validate production-like banners.',
    '查看概率曲线、用户抽数分布、收集结果与目标获取情况，并将关键数据导出到 Excel。': 'Inspect probability curves, draw distributions, collection results, and target acquisition, then export the data to Excel.',
    '模拟次数': 'Simulation runs',
    '每轮抽数': 'Draws per Round',
    '大保底阈值': 'Hard Pity Threshold',
    '运行快速分析': 'Run Quick Analysis',
    '实际模拟次数': 'Actual runs',
    '目标获取期望': 'Expected draws to target',
    '上限内获取率': 'Success rate within limit',
    '计算中...': 'Calculating...',
    '正在生成真实模拟数据...': 'Generating real simulation data...',
    '目标稀有度概率曲线': 'Target rarity probability curve',
    '当前配置计算结果，单位：%': 'Calculated from the current configuration. Unit: %',
    'n 次 n 抽结果区间': 'Repeated-round result range',
    '真实独立模拟结果，单位：抽': 'Independent simulation results. Unit: draws',
    '目标获取抽数分布': 'Target acquisition draw distribution',
    '当前快捷模拟的统计结果': 'Statistics from the quick analysis',
    '分轮统计四分位数': 'Round statistics quartiles',
    '运行结果使用当前配置；修改高级配置后可再次运行分析。': 'Results use the current configuration. Change advanced setup and run again at any time.',
    '开始配置': 'Configure',
    '执行批量抽卡': 'Run Batch Draws',
    '查看计算规则': 'View Rules',
    '抽卡概率计算规则说明': 'Gacha Probability Rules',
    '基础参数': 'Base Parameters',
    '总模拟用户数': 'Total Simulated Players',
    '建议不要超过50000': 'Recommended maximum: 50,000',
    '目标稀有度': 'Target Rarity',
    '目标数量': 'Target Count',
    '抽到几张目标稀有度就停手': 'Stop after obtaining this many target-rarity cards',
    '抽数条件': 'Draw Condition',
    '全部用户': 'All Players',
    '大于': 'Greater Than',
    '小于': 'Less Than',
    '抽数阈值': 'Draw Threshold',
    '添加预算': 'Add Budget',
    '重置默认': 'Reset Default',
    '运行模拟': 'Run Simulation',
    '导出Excel': 'Export Excel',
    '抽卡操作': 'Draw Operations',
    '选择操作': 'Select Operation',
    '单抽': 'Single Draw',
    '批量抽': 'Batch Draw',
    '抽取轮数': 'Number of Rounds',
    '执行抽卡': 'Run Draws',
    '抽卡结果': 'Draw Results',
    '收集模拟': 'Collection Simulation',
    '模拟类型': 'Simulation Type',
    '单轮收集': 'Single-round Collection',
    '多轮收集': 'Multi-round Collection',
    '模拟轮数': 'Simulation Rounds',
    '开始收集': 'Start Collection',
    '收集结果': 'Collection Results',
    '重置默认配置': 'Reset Default Configuration',
    '稀有度定义': 'Rarity Definitions',
    '添加': 'Add',
    '删除': 'Delete',
    '保底配置': 'Pity Configuration',
    '大保底阈值（抽数）': 'Hard Pity Threshold (draws)',
    '小保底阈值（抽数）': 'Soft Pity Threshold (draws)',
    '小保底稀有度（可多选）': 'Soft Pity Rarities (multiple)',
    '大保底命中分布': 'Hard Pity Rarity Distribution',
    '概率配置页签': 'Probability Configuration Tabs',
    '添加页签': 'Add Tab',
    '删除页签': 'Delete Tab',
    '重命名页签': 'Rename Tab',
    '每抽概率曲线': 'Per-draw Probability Curve',
    '默认配置': 'Default Configuration',
    '自动计算概率': 'Auto-calculate Probability',
    '选择要自动计算的稀有度': 'Select Rarity to Auto-calculate',
    '概率类型': 'Probability Type',
    '固定值': 'Fixed',
    '线性递增': 'Linear Increase',
    '基础概率': 'Base Probability',
    '稀有度内部概率（卡池类型）': 'Rarity Internal Probability (Pool Type)',
    '添加卡池类型': 'Add Pool Type',
    '卡牌概率配置': 'Card Probability Configuration',
    '简单配置': 'Simple Setup',
    '详细配置': 'Detailed Setup',
    '生成等概率卡牌': 'Generate Equal-probability Cards',
    '选择卡池类型': 'Select Pool Type',
    '全部卡池': 'All Pools',
    '添加卡牌': 'Add Card',
    '正在运行模拟，请稍候...': 'Simulation is running. Please wait...',
    '出货用户抽数分布': 'Successful Player Draw Distribution',
    '核心指标': 'Core Metrics',
    '出货分布柱状图': 'Success Distribution Chart',
    '抽卡统计': 'Draw Statistics',
    '卡牌分布': 'Card Distribution',
    '图表数据:': 'Chart Data:',
    '综合数据': 'Combined Data',
    '各配置明细': 'Configuration Details',
    '方案管理': 'Scheme Workspace',
    '保存、读取与应用配置': 'Save, load, and apply configurations',
    '当前编辑：': 'Editing: ',
    '未命名方案': 'Unnamed Scheme',
    '未保存': 'unsaved',
    '已保存': 'saved',
    '新建方案': 'New Scheme',
    '保存方案': 'Save Scheme',
    '删除方案': 'Delete Scheme',
    '还没有保存的方案': 'No saved schemes yet',
    '正在生成真实模拟数据...': 'Generating real simulation data...',
    '真实统计已生成，正在绘制图表。': 'Real statistics generated. Rendering charts...',
    '当前数据已基于快捷配置完成真实模拟。': 'The current data was generated from the quick configuration.',
    '模拟器初始化失败，请刷新页面后重试。': 'Simulator initialization failed. Refresh and try again.',
    '运行结果使用当前配置': 'Results use the current configuration',
    'n 次 n 抽': 'n x n Draws',
    '指标': 'Metric',
    '最小值': 'Minimum',
    '中位数(P50)': 'Median (P50)',
    '最大值': 'Maximum',
    '平均值': 'Mean',
    '卡数量': ' Card Count',
    '卡概率': ' Card Rate',
    '平均出货抽数（': 'Average Target Draw (',
    '轮内出货抽数P25（': 'Target Draw P25 (',
    '轮内出货抽数中位数（': 'Target Draw Median (',
    '轮内出货抽数P75（': 'Target Draw P75 (',
    '大保底触发次数': 'Hard Pity Triggers',
    '小保底触发次数': 'Soft Pity Triggers',
    '一、基础概率': '1. Base Probability',
    '基础概率是指当抽数不在任何阶梯概率区间内时使用的概率。': 'Base probability applies when a draw is outside every probability interval.',
    '二、阶梯概率': '2. Probability Intervals',
    '阶梯概率用于定义特定抽数区间的概率提升，可以设置起始抽数和截至抽数。': 'Probability intervals define increased odds for a range of draws, with a start and end draw.',
    '三、线性递增模式（累加概率）': '3. Linear Increase Mode',
    '四、固定值模式': '4. Fixed Probability Mode',
    '当概率类型设置为"固定值"时，在整个阶梯概率区间内使用同一个概率值。': 'With Fixed Probability, the same value applies throughout the interval.',
    '五、小保底机制': '5. Soft Pity',
    '小保底是在特定抽数（如第10抽）触发保底，确保玩家不会连续获得低稀有度卡牌。': 'Soft pity triggers at a configured draw, preventing long streaks of lower-rarity cards.',
    '六、大保底机制': '6. Hard Pity',
    '大保底是保底的保底，当玩家多次未获得高稀有度卡牌时，在特定抽数强制获得。': 'Hard pity guarantees a result at a configured draw after repeated misses of high-rarity cards.',
    '七、概率优先级': '7. Probability Priority',
    '抽卡时概率计算的优先级顺序：': 'Probability priority during a draw:',
    '八、概率重置': '8. Probability Reset',
    '当抽到指定的保底稀有度（如UR）时，概率计数会重置为0，下次抽卡从头开始计算概率。': 'When the configured pity rarity is drawn, the counter resets to 0 for the next draw.',
    '抽数': 'Draws',
    '占比': 'Share',
    '操作': 'Actions',
    '目标选择 (可多选)': 'Target Selection (multiple)',
    '全选': 'Select All',
    '新增、删除与优先级排序': 'Add, delete, and set priority order',
    '保底机制': 'Pity Mechanics',
    '阈值、稀有度与保底概率': 'Thresholds, rarities, and pity probabilities',
    '概率曲线': 'Probability Curves',
    '基础概率与分段递增规则': 'Base probability and interval rules',
    '卡池内容': 'Pool Contents',
    '稀有度内的卡池分配': 'Pool allocation within each rarity',
    '卡牌列表': 'Card List',
    '卡池内的具体卡牌概率': 'Individual card probabilities in each pool',
    '方案工作台': 'Scheme Workspace',
    '抽卡参数控制台': 'Gacha Parameter Console',
    '编辑后保存，运行前应用到模拟器': 'Save edits, then apply them before simulation.',
    '新建': 'New',
    '方案名称': 'Scheme Name',
    '保存': 'Save',
    '另存为副本': 'Save as Copy',
    '应用到模拟器': 'Apply to Simulator',
    '方案只保存在当前浏览器。保存后再点击“应用到模拟器”运行。': 'Schemes are saved only in this browser. Save, then select Apply to Simulator before running.',
    '新增、删除或调整顺序会自动同步到概率列与相关选项。': 'Adding, deleting, or reordering rarities automatically updates probability columns and related options.',
    '选择要删除的稀有度': 'Select Rarity to Delete',
    '触发大保底的抽数，达到后必出指定稀有度': 'The draw count that triggers hard pity and guarantees the configured rarity.',
    '触发小保底的抽数，0表示无小保底': 'The draw count that triggers soft pity. Use 0 to disable it.',
    '小保底提升到的稀有度，按优先级排序': 'Rarities granted by soft pity, ordered by priority.',
    '定义大保底时各稀有度的出现概率，概率之和应为1': 'Define hard-pity probabilities by rarity. The total must equal 1.',
    '稀有度': 'Rarity',
    '概率': 'Probability',
    '+ 添加大保底稀有度': '+ Add Hard Pity Rarity',
    '定义不同抽数区间的各稀有度概率，概率之和必须为10000': 'Define rarity probabilities for each draw interval. Each row must total 10,000.',
    '概率 = 10000 - 其他稀有度之和': 'Probability = 10,000 - sum of other rarities',
    '线性递增：从起始抽数的概率线性增长到结束抽数的概率': 'Linear increase: probability rises from the start draw to the end draw.',
    '没有阶梯概率覆盖的抽数使用基础概率': 'Draws outside probability intervals use base probability.',
    '起始抽数': 'Start Draw',
    '截至抽数': 'End Draw',
    '⚠️ 以下区间的概率合计不为10000：': 'Warning: these intervals do not total 10,000:',
    '+ 添加概率区间': '+ Add Probability Interval',
    '定义每个稀有度下的卡池类型及其概率': 'Define pool types and probabilities for each rarity.',
    '卡池类型': 'Pool Type',
    '定义每个卡池类型下的具体卡牌及其概率': 'Define card probabilities for each pool type.',
    '每个稀有度输入卡牌数量，生成后每张卡均分 10000 概率。': 'Enter a card count for each rarity. Generated cards split 10,000 probability equally.',
    '卡牌名称': 'Card Name',
    '阶梯概率配置（勾选并填用户数比例，合计100%）': 'Probability Configurations (select each configuration and set player shares to 100%)',
    '已勾选比例合计：': 'Selected share total: ',
    '用户抽数分布（每个阶梯概率配置有独立的用户抽数分布，与配置一一对应）': 'Player draw distributions (each probability configuration has its own distribution).',
    '所属配置': 'Configuration',
    '占比总和会自动归一化': 'Shares are normalized automatically.',
    '轮数>1时输出各指标四分位数': 'More than one round reports quartiles for all metrics.',
    '运行范围（勾选配置并填写比例，合计需为100%）': 'Run Scope (select configurations and set shares to 100%).',
    '阶梯概率配置': 'Probability Configurations',
    '全部配置': 'All Configurations',
    '点击勾选框选择目标，可以选择稀有度、卡池类型或具体卡牌': 'Select targets with the checkboxes. You can choose rarities, pool types, or individual cards.',
    '出货人数': 'Successful Players',
    '中文': 'Chinese',
    '导航': 'Navigation',
    'UR概率': 'UR Rate',
    'SSR概率': 'SSR Rate',
    'SR概率': 'SR Rate',
    '（UR）': '(UR)',
    '未知': 'Unknown'
  };

  const replacements = Object.entries(english).sort((left, right) => right[0].length - left[0].length);
  const translate = value => {
    if (window.GachaLocale !== 'en' || typeof value !== 'string') return value;
    return replacements.reduce((result, [source, target]) => result.split(source).join(target), value)
      .replace(/([A-Z]+)_最高等级卡/g, '$1 Top Card')
      .replace(/([A-Z]+)卡(\d+)/g, '$1 Card $2');
  };

  const localizeNode = node => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.nodeValue = translate(node.nodeValue);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || ['SCRIPT', 'STYLE'].includes(node.tagName)) return;
    ['title', 'placeholder', 'aria-label'].forEach(name => {
      if (node.hasAttribute(name)) node.setAttribute(name, translate(node.getAttribute(name)));
    });
    node.childNodes.forEach(localizeNode);
  };

  const renderEnglishRules = () => {
    const rules = document.querySelector('#rules .card-body');
    if (!rules) return;
    rules.innerHTML = `
      <h5 class="mb-4">Gacha Probability Rules</h5>
      <h5 class="text-primary">1. Base Probability</h5>
      <p>Base probability applies to every draw that is not covered by a probability interval. Define one probability value for each rarity.</p>
      <h5 class="text-primary mt-4">2. Probability Intervals</h5>
      <p>Intervals override base probability for a configured range of draws. Each interval has a start draw, an end draw, and a probability for every rarity.</p>
      <h5 class="text-primary mt-4">3. Linear Increase</h5>
      <p>Linear intervals increase probability evenly from the interval start to its target probability at the interval end. The first interval starts from base probability; later intervals inherit the previous interval's ending value.</p>
      <h5 class="text-primary mt-4">4. Fixed Probability</h5>
      <p>Fixed intervals use the same probability for every draw in the configured range.</p>
      <h5 class="text-primary mt-4">5. Soft Pity</h5>
      <p>Soft pity triggers at multiples of its threshold. It guarantees the selected rarity group by assigning the remaining probability after the highest rarity is calculated.</p>
      <h5 class="text-primary mt-4">6. Hard Pity</h5>
      <p>Hard pity triggers when its counter reaches the configured threshold. The result is selected from the hard-pity rarity distribution, then the pity counter resets.</p>
      <h5 class="text-primary mt-4">7. Priority</h5>
      <ol><li>Hard pity</li><li>Probability interval</li><li>Base probability</li><li>Soft pity correction</li></ol>
      <h5 class="text-primary mt-4">8. Reset</h5>
      <p>Drawing the configured pity rarity resets the probability counter. The next draw starts a new pity cycle.</p>`;
  };

  window.GachaI18n = {
    t: (key, fallback) => translate(english[key] || fallback || key),
    localize: localizeNode,
    isEnglish: () => window.GachaLocale === 'en'
  };

  document.querySelectorAll('.hero-language').forEach(link => {
    link.addEventListener('click', () => {
      localStorage.setItem(preferenceKey, link.pathname === '/en' ? 'en' : 'zh');
    });
  });

  if (window.GachaLocale === 'en') {
    document.title = translate(document.title);
    document.addEventListener('DOMContentLoaded', () => {
      localizeNode(document.body);
      renderEnglishRules();
      new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(localizeNode)))
        .observe(document.body, { childList: true, subtree: true });
    });
  }
})();
