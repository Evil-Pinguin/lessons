/* =========================================================
   Звуковое сопровождение. Все звуки синтезируются через
   Web Audio API — никаких внешних файлов. Плюс озвучка
   текста через Web Speech API (русский голос, если есть).
   ========================================================= */
(function () {
  const KEY = 'lessons_sound';
  const KEY_VOICE = 'lessons_voice';
  let ctx = null;
  let enabled = localStorage.getItem(KEY) !== 'off';
  // Голос ВЫКЛЮЧЕН по умолчанию — включается только после нажатия кнопки
  let voiceOn = localStorage.getItem(KEY_VOICE) === 'on';

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, { type = 'sine', dur = 0.15, vol = 0.18, delay = 0, slide = 0 } = {}) {
    const c = getCtx();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  const sounds = {
    click()   { tone(880, { type: 'triangle', dur: 0.06, vol: 0.08 }); },
    correct() { tone(660, { dur: 0.12 }); tone(880, { dur: 0.14, delay: 0.1 }); tone(1320, { dur: 0.2, delay: 0.2 }); },
    wrong()   { tone(220, { type: 'sawtooth', dur: 0.18, vol: 0.09, slide: -80 }); tone(180, { type: 'sawtooth', dur: 0.22, vol: 0.08, delay: 0.12, slide: -60 }); },
    flip()    { tone(520, { type: 'triangle', dur: 0.08, vol: 0.08, slide: 200 }); },
    pick()    { tone(740, { type: 'triangle', dur: 0.07, vol: 0.08 }); },
    drop()    { tone(400, { type: 'triangle', dur: 0.1, vol: 0.1, slide: -120 }); },
    fanfare() {
      const notes = [523, 659, 784, 1046, 784, 1046, 1318];
      notes.forEach((n, i) => tone(n, { dur: i === notes.length - 1 ? 0.6 : 0.16, delay: i * 0.13, vol: 0.16 }));
    },
    pop()     { tone(1000, { type: 'sine', dur: 0.05, vol: 0.06, slide: 400 }); },
  };

  function play(name) {
    if (!enabled) return;
    try { sounds[name] && sounds[name](); } catch (e) { /* ignore */ }
  }

  /* ---- Озвучка текста ---- */
  function speak(text, { force = false } = {}) {
    if (!force && (!enabled || !voiceOn)) return;
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ru-RU';
    u.rate = 0.95;
    u.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const ru = voices.find(v => /ru/i.test(v.lang));
    if (ru) u.voice = ru;
    window.speechSynthesis.speak(u);
  }

  function setEnabled(v) {
    enabled = !!v;
    localStorage.setItem(KEY, enabled ? 'on' : 'off');
    document.body.classList.toggle('sound-off', !enabled);
    if (!enabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function setVoice(v) {
    voiceOn = !!v;
    localStorage.setItem(KEY_VOICE, voiceOn ? 'on' : 'off');
    document.body.classList.toggle('voice-on', voiceOn);
    if (!voiceOn && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  window.Sound = { play, speak, setEnabled, isEnabled: () => enabled, setVoice, isVoiceOn: () => voiceOn };
  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.toggle('sound-off', !enabled);
    document.body.classList.toggle('voice-on', voiceOn);
  });
})();
