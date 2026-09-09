/* =========================================================
   Темы оформления: светлая, тёмная, красочная, своя.
   Выбор и пользовательские цвета сохраняются в localStorage.
   ========================================================= */
(function () {
  const KEY = 'lessons_theme';
  const KEY_CUSTOM = 'lessons_theme_custom';
  const root = document.documentElement;

  const defaults = { c1: '#4285f4', c2: '#9b72cb', c3: '#d96570', cBg: '#ffffff', cText: '#1a1a2e' };

  function hexToRgb(hex) {
    const m = hex.replace('#', '').match(/.{2}/g) || [];
    return m.map(h => parseInt(h, 16));
  }
  function luminance(hex) {
    const [r, g, b] = hexToRgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function mix(hex, target, k) {
    const a = hexToRgb(hex), b = hexToRgb(target);
    return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
  }

  function applyCustom(c) {
    const dark = luminance(c.cBg) < 0.35;
    root.style.setProperty('--g1', c.c1);
    root.style.setProperty('--g2', c.c2);
    root.style.setProperty('--g3', c.c3);
    root.style.setProperty('--gradient', `linear-gradient(90deg, ${c.c1} 0%, ${c.c2} 50%, ${c.c3} 100%)`);
    root.style.setProperty('--bg', c.cBg);
    root.style.setProperty('--bg-soft', mix(c.cBg, dark ? '#ffffff' : '#000000', 0.04));
    root.style.setProperty('--text', c.cText);
    root.style.setProperty('--muted', mix(c.cText, c.cBg, 0.4));
    root.style.setProperty('--line', dark ? 'rgba(255,255,255,.1)' : 'rgba(20,20,40,.08)');
    root.style.setProperty('--glass-bg', dark ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.55)');
    root.style.setProperty('--glass-bg-strong', dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.78)');
    root.style.setProperty('--glass-border', dark ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.75)');
    root.style.setProperty('--glass-shadow', dark ? '0 10px 40px rgba(0,0,0,.45)' : '0 10px 40px rgba(60,70,120,.12)');
  }
  function clearCustom() {
    ['--g1','--g2','--g3','--gradient','--bg','--bg-soft','--text','--muted','--line','--glass-bg','--glass-bg-strong','--glass-border','--glass-shadow']
      .forEach(p => root.style.removeProperty(p));
  }

  function getCustom() {
    try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY_CUSTOM) || '{}')); } catch { return { ...defaults }; }
  }

  function setTheme(name) {
    root.setAttribute('data-theme', name);
    localStorage.setItem(KEY, name);
    if (name === 'custom') applyCustom(getCustom()); else clearCustom();
    document.querySelectorAll('.theme-opt').forEach(b => b.classList.toggle('active', b.dataset.theme === name));
    const cf = document.getElementById('customFields');
    if (cf) cf.hidden = name !== 'custom';
  }

  // применяем сразу, до отрисовки
  setTheme(localStorage.getItem(KEY) || 'light');

  document.addEventListener('DOMContentLoaded', () => {
    const panel = document.getElementById('themePanel');
    const btn = document.getElementById('themeBtn');
    const close = document.getElementById('themeClose');
    const inputs = ['c1', 'c2', 'c3', 'cBg', 'cText'].map(id => document.getElementById(id));

    const custom = getCustom();
    inputs.forEach(i => { i.value = custom[i.id]; });

    btn.addEventListener('click', () => { panel.hidden = !panel.hidden; Sound.play('click'); });
    close.addEventListener('click', () => { panel.hidden = true; });
    document.addEventListener('click', e => {
      if (!panel.hidden && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) panel.hidden = true;
    });

    document.querySelectorAll('.theme-opt').forEach(b => b.addEventListener('click', () => {
      setTheme(b.dataset.theme);
      Sound.play('pick');
    }));

    inputs.forEach(i => i.addEventListener('input', () => {
      const c = {}; inputs.forEach(x => c[x.id] = x.value);
      localStorage.setItem(KEY_CUSTOM, JSON.stringify(c));
      if (root.getAttribute('data-theme') === 'custom') applyCustom(c);
    }));

    setTheme(root.getAttribute('data-theme')); // подсветить активную кнопку
  });

  window.Theme = { setTheme };
})();
