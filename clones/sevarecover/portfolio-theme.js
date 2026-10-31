/* Portfolio launch preference for the original SevaRecover light/green UI. */
(() => {
  'use strict';

  function read() {
    const requested = new URLSearchParams(window.location.search).get('theme');
    if (requested === 'light' || requested === 'dark') return requested;
    try {
      const saved = localStorage.getItem('sevarecover-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* The preview also works when browser storage is unavailable. */ }
    return 'light';
  }

  function write(theme) {
    try { localStorage.setItem('sevarecover-theme', theme); } catch { /* Optional. */ }
  }

  window.sevaRecoverTheme = { read, write };
  const theme = read();
  // The exported theme provider may be cached from an earlier portfolio visit.
  // Seed its existing preference before either version of the provider mounts.
  write(theme);
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.add(`${theme}-mode`);
  document.documentElement.style.colorScheme = theme;
})();
