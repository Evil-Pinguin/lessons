/* =========================================================
   Основная логика страницы: навигация, мини-демо в герое,
   переключение демо-упражнений, редактор, форма → Supabase.
   ========================================================= */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const CONTACT_EMAIL = 'zloipingvin2000@gmail.com';

  /* ---------- Тост ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2600);
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#year').textContent = new Date().getFullYear();
    const form = $('#contactForm');

    /* ---------- Звук ---------- */
    $('#soundToggle').addEventListener('click', () => {
      Sound.setEnabled(!Sound.isEnabled());
      if (Sound.isEnabled()) Sound.play('correct');
      toast(Sound.isEnabled() ? 'Звук включён' : 'Звук выключен');
    });

    /* ---------- Голосовая озвучка (включается кнопкой) ---------- */
    const voiceBtn = $('#voiceBtn');
    const syncVoice = () => {
      voiceBtn.setAttribute('aria-pressed', Sound.isVoiceOn());
      voiceBtn.classList.toggle('active', Sound.isVoiceOn());
      $('.voice-label', voiceBtn).textContent = Sound.isVoiceOn() ? 'Голос вкл' : 'Голос выкл';
    };
    voiceBtn.addEventListener('click', () => {
      Sound.setVoice(!Sound.isVoiceOn());
      syncVoice();
      if (Sound.isVoiceOn()) { Sound.speak('Озвучка включена.'); toast('Голос включён: кнопки «прослушать» и задания читаются вслух'); }
      else toast('Голос выключен');
    });
    syncVoice();

    /* ---------- Мобильное меню ---------- */
    const nav = $('#nav');
    $('#burger').addEventListener('click', () => nav.classList.toggle('open'));
    $$('a', nav).forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

    /* ---------- Клики по кнопкам — лёгкий звук ---------- */
    document.addEventListener('click', e => {
      if (e.target.closest('.btn:not(#submitBtn), .tab, .nav a')) Sound.play('click');
    });

    /* ---------- Мини-демо в герое ---------- */
    (function heroDemo() {
      const grid = $('#heroGrid'), scoreEl = $('#heroScore');
      const items = [['apple', 1], ['car', 0], ['banana', 1], ['books', 0], ['grapes', 1], ['ball', 0], ['strawberry', 1], ['cat', 0]];
      let score = 0;
      const build = () => {
        grid.innerHTML = ''; score = 0; scoreEl.textContent = '0 / 4';
        items.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]).forEach(([e, ok]) => {
          const t = document.createElement('button'); t.className = 'tile'; t.innerHTML = `<img src="img/hero/${e}.png" alt="" draggable="false" />`;
          t.addEventListener('click', () => {
            if (t.classList.contains('ok')) return;
            if (ok) {
              t.classList.add('ok'); score++; scoreEl.textContent = `${score} / 4`; Sound.play('correct');
              if (score === 4) { Sound.play('fanfare'); toast('Все фрукты найдены!'); setTimeout(build, 2500); }
            } else { t.classList.add('bad'); Sound.play('wrong'); setTimeout(() => t.classList.remove('bad'), 450); }
          });
          grid.appendChild(t);
        });
      };
      build();
    })();

    /* ---------- Демо-упражнения ---------- */
    const stage = {
      title: $('#demoTitle'), task: $('#demoTask'), body: $('#demoBody'), result: $('#demoResult'),
    };
    let current = null;
    const api = { body: stage.body, result: stage.result, restart: () => run(current) };

    function run(ex) {
      current = ex;
      const d = Exercises.getData(ex);
      stage.title.textContent = ex.title;
      stage.task.innerHTML = `${escapeHtml(d.task)}<small>${escapeHtml(d.sub || '')}</small>`;
      stage.result.hidden = true; stage.result.innerHTML = '';
      ex.render(api, d);
    }
    function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

    $$('.tab').forEach(t => t.addEventListener('click', () => {
      $$('.tab').forEach(x => x.classList.toggle('active', x === t));
      run(Exercises.byId(t.dataset.tab));
    }));
    $('#demoRestart').addEventListener('click', () => run(current));
    $('#demoSpeak').addEventListener('click', () => {
      // явное нажатие — озвучиваем всегда, даже если общий голос выключен
      Sound.speak(Exercises.getData(current).task, { force: true });
    });
    $('#demoReset').addEventListener('click', () => { Exercises.reset(current); run(current); toast('Исходный вариант восстановлен'); });

    /* ---------- Редактор ---------- */
    const modal = $('#editorModal'), ta = $('#editorText');
    $('#demoEdit').addEventListener('click', () => {
      $('#editorTitle').textContent = `Редактировать: ${current.title}`;
      $('#editorHint').textContent = current.hint;
      ta.value = current.toText(Exercises.getData(current));
      modal.hidden = false; ta.focus();
    });
    $$('[data-close]', modal).forEach(b => b.addEventListener('click', () => (modal.hidden = true)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { modal.hidden = true; $('#themePanel').hidden = true; } });
    $('#editorSave').addEventListener('click', () => {
      const prev = Exercises.getData(current);
      const data = current.fromText(ta.value, prev);
      Exercises.setData(current, data);
      modal.hidden = true; run(current);
      Sound.play('correct'); toast('Сохранено в вашем браузере');
    });

    run(Exercises.list[0]);

    /* ---------- Тариф → форма ---------- */
    $$('[data-plan]').forEach(a => a.addEventListener('click', () => {
      const sel = $('#fPlan');
      [...sel.options].forEach(o => { if (o.text.startsWith(a.dataset.plan)) sel.value = o.text; });
    }));

    /* ---------- Форма → Supabase ---------- */
    const status = $('#formStatus'), submitBtn = $('#submitBtn');
    let supa = null;
    const cfg = window.SUPABASE_CONFIG || {};
    if (cfg.url && cfg.anonKey && window.supabase) {
      try { supa = window.supabase.createClient(cfg.url, cfg.anonKey); } catch (e) { console.warn('Supabase init failed', e); }
    }

    // черновик формы — локально
    const DRAFT = 'lessons_form_draft';
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT) || '{}');
      Object.entries(d).forEach(([k, v]) => { const f = form.elements[k]; if (f && f.type !== 'checkbox') f.value = v; });
    } catch {}
    form.addEventListener('input', () => {
      const d = {}; ['name', 'email', 'age_group', 'exercise_type', 'plan', 'style', 'message'].forEach(k => (d[k] = form.elements[k].value));
      localStorage.setItem(DRAFT, JSON.stringify(d));
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      status.className = 'form-status'; status.textContent = '';
      let valid = true;
      ['fName', 'fEmail', 'fMsg'].forEach(id => {
        const f = $('#' + id); const ok = f.checkValidity() && f.value.trim();
        f.classList.toggle('invalid', !ok); if (!ok) valid = false;
      });
      if (!$('#fAgree').checked) valid = false;
      if (!valid) { Sound.play('wrong'); status.textContent = 'Пожалуйста, заполните обязательные поля и поставьте галочку.'; status.classList.add('bad'); return; }

      const payload = {
        name: form.name.value.trim(), email: form.email.value.trim(), age_group: form.age_group.value,
        exercise_type: form.exercise_type.value, plan: form.plan.value, style: form.style.value,
        message: form.message.value.trim(), theme: document.documentElement.getAttribute('data-theme'),
        page_url: location.href, user_agent: navigator.userAgent,
      };

      submitBtn.disabled = true; submitBtn.textContent = 'Отправляю…';
      const done = () => {
        Sound.play('fanfare');
        status.textContent = 'Заявка отправлена! Отвечу на вашу почту в течение дня.'; status.classList.add('ok');
        form.reset(); localStorage.removeItem(DRAFT);
      };
      try {
        // 1) Серверная функция Vercel (/api/submit) — ключи не попадают в браузер
        let sent = false;
        if (cfg.useApi !== false) {
          try {
            const r = await fetch(cfg.apiUrl || '/api/submit', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...payload, website: form.website ? form.website.value : '' }),
            });
            if (r.ok) sent = true;
            else if (r.status !== 404 && r.status !== 405) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'API error'); }
          } catch (e) { if (!(e instanceof TypeError)) throw e; /* TypeError = сети/нет API (локально) — идём дальше */ }
        }
        if (sent) { done(); return; }

        // 2) Прямая запись в Supabase публичным anon-ключом (RLS: только insert)
        if (supa) {
          const { error } = await supa.from(cfg.table || 'requests').insert(payload);
          if (error) throw error;
          done(); return;
        }

        // 3) Ничего не настроено — письмо
        const subject = encodeURIComponent(`Заявка на упражнение: ${payload.exercise_type} (${payload.plan})`);
        const body = encodeURIComponent(
          `Имя: ${payload.name}\nEmail: ${payload.email}\nВозраст: ${payload.age_group}\nТип: ${payload.exercise_type}\nТариф: ${payload.plan}\nОформление: ${payload.style}\n\n${payload.message}`);
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
        Sound.play('correct');
        status.textContent = 'Открываю почтовый клиент… Если письмо не открылось — напишите на ' + CONTACT_EMAIL; status.classList.add('ok');
      } catch (err) {
        console.error(err); Sound.play('wrong');
        status.textContent = (err && err.message && /[а-яА-Я]/.test(err.message) ? err.message + '. ' : 'Не удалось отправить. ') + 'Напишите, пожалуйста, на ' + CONTACT_EMAIL; status.classList.add('bad');
      } finally {
        submitBtn.disabled = false; submitBtn.textContent = 'Отправить заявку';
      }
    });
  });
})();
