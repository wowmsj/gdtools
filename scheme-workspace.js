(() => {
  function clone(value) {
    return structuredClone(value);
  }

  function normalizeSchemes(schemes) {
    return Object.fromEntries(Object.entries(schemes || {}).map(([name, value]) => {
      if (value && Object.hasOwn(value, 'config')) {
        return [name, { config: clone(value.config), updatedAt: Number(value.updatedAt) || 0 }];
      }
      return [name, { config: clone(value), updatedAt: 0 }];
    }));
  }

  function saveScheme(schemes, name, config, updatedAt = Date.now()) {
    return { ...normalizeSchemes(schemes), [name]: { config: clone(config), updatedAt } };
  }

  function uniqueName(schemes, baseName) {
    const normalized = normalizeSchemes(schemes);
    if (!Object.hasOwn(normalized, baseName)) return baseName;
    let index = 2;
    while (Object.hasOwn(normalized, `${baseName} ${index}`)) index += 1;
    return `${baseName} ${index}`;
  }

  function copyScheme(schemes, sourceName, updatedAt = Date.now()) {
    const normalized = normalizeSchemes(schemes);
    const source = normalized[sourceName];
    if (!source) throw new Error('方案不存在');
    const name = uniqueName(normalized, `${sourceName} 副本`);
    return { name, schemes: saveScheme(normalized, name, source.config, updatedAt) };
  }

  function renameScheme(schemes, sourceName, targetName, updatedAt = Date.now()) {
    const normalized = normalizeSchemes(schemes);
    const source = normalized[sourceName];
    if (!source) throw new Error('方案不存在');
    if (!targetName || (sourceName !== targetName && Object.hasOwn(normalized, targetName))) throw new Error('方案名称不可用');
    const next = { ...normalized };
    delete next[sourceName];
    next[targetName] = { config: clone(source.config), updatedAt };
    return { name: targetName, schemes: next };
  }

  function deleteScheme(schemes, name) {
    const next = normalizeSchemes(schemes);
    delete next[name];
    return next;
  }

  function canDiscardChanges(isDirty) {
    return !isDirty;
  }

  const api = { normalizeSchemes, saveScheme, copyScheme, renameScheme, deleteScheme, canDiscardChanges };
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof window !== 'undefined') window.GachaSchemeStore = api;
})();
