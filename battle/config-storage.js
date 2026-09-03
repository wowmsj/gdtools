(() => {
  const storageKey = 'gdtools.battle.config';

  function saveBattleConfig(storage, config) {
    try { storage.setItem(storageKey, JSON.stringify(config)); return true; }
    catch { return false; }
  }

  function loadBattleConfig(storage) {
    try { const value = storage.getItem(storageKey); return value ? JSON.parse(value) : null; }
    catch { return null; }
  }

  const api = { loadBattleConfig, saveBattleConfig };
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof window !== 'undefined') window.BattleConfigStorage = api;
})();
