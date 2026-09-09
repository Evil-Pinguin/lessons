/* =========================================================
   Демо-упражнения. Каждое: данные по умолчанию, простой
   текстовый формат для редактирования, рендер и логика.
   Пользовательские правки хранятся в localStorage.
   ========================================================= */
(function () {
  const LS_PREFIX = 'lessons_ex_';
  const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // «img:hero/apple» → картинка из папки img/, иначе — текст
  const rich = (s, cls = 'pic') => {
    const m = String(s).trim().match(/^img:([\w\/-]+)$/);
    return m ? `<img src="img/${m[1]}.png" alt="" class="${cls}" draggable="false" />` : esc(s);
  };

  /* ----------------- Хранилище ----------------- */
  function load(id, def) {
    try { const v = localStorage.getItem(LS_PREFIX + id); return v ? JSON.parse(v) : def; } catch { return def; }
  }
  function save(id, data) { localStorage.setItem(LS_PREFIX + id, JSON.stringify(data)); }
  function reset(id) { localStorage.removeItem(LS_PREFIX + id); }

  /* ----------------- Финальный экран ----------------- */
  function finish(api, { score, total, text }) {
    Sound.play('fanfare');
    confetti();
    api.body.innerHTML = '';
    const pct = total ? Math.round((score / total) * 100) : 100;
    const pic = pct === 100 ? 'ui/trophy' : pct >= 70 ? 'ui/star' : 'ui/check';
    const title = pct === 100 ? 'Отлично! Всё верно!' : pct >= 70 ? 'Молодец!' : 'Хорошая попытка!';
    api.result.innerHTML = `<div class="big"><img src="img/${pic}.png" alt="" class="pic pic-lg" /></div><h3>${title}</h3><p>${text || `Результат: <b>${score} из ${total}</b> (${pct}%)`}</p>
      <button class="btn btn-primary" id="againBtn">Пройти ещё раз</button>`;
    api.result.hidden = false;
    api.result.querySelector('#againBtn').addEventListener('click', () => { Sound.play('click'); api.restart(); });
    Sound.speak(title);
  }
  function confetti() {
    const colors = ['#4285f4', '#9b72cb', '#d96570', '#22c55e', '#f59e0b', '#06b6d4'];
    for (let i = 0; i < 70; i++) {
      const c = el('span', 'confetti');
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4000);
    }
  }
  function progress(api, i, n) {
    const p = el('div', 'progress'); p.innerHTML = `<i style="width:${(i / n) * 100}%"></i>`; api.body.appendChild(p);
  }

  /* =========================================================
     1. Викторина
     ========================================================= */
  const quiz = {
    id: 'quiz', title: 'Викторина', icon: 'ui/brain',
    def: {
      task: 'Прочитай вопрос и выбери правильный ответ.',
      sub: 'Окружающий мир, 1–2 класс',
      items: [
        { q: 'Сколько ног у паука?', a: ['6', '8', '4', '10'], c: 1 },
        { q: 'Какое время года наступает после зимы?', a: ['Лето', 'Осень', 'Весна', 'Снова зима'], c: 2 },
        { q: 'Что нужно растению, чтобы расти?', a: ['Свет и вода', 'Только темнота', 'Шоколад', 'Ничего'], c: 0 },
        { q: 'Какое животное самое большое на Земле?', a: ['Слон', 'Жираф', 'Синий кит', 'Медведь'], c: 2 },
        { q: 'Сколько дней в неделе?', a: ['5', '6', '7', '8'], c: 2 },
      ],
    },
    hint: 'Первая строка — задание. Далее каждый вопрос с новой строки:\nВопрос? | ответ1 | ответ2 | ответ3 ... — правильный ответ пометьте звёздочкой *',
    toText: d => [d.task, ...d.items.map(it => `${it.q} | ${it.a.map((x, i) => (i === it.c ? '*' + x : x)).join(' | ')}`)].join('\n'),
    fromText(t, prev) {
      const lines = t.split('\n').map(s => s.trim()).filter(Boolean);
      const task = lines.shift() || prev.task;
      const items = lines.map(l => {
        const parts = l.split('|').map(s => s.trim()).filter(Boolean);
        const q = parts.shift(); let c = 0;
        const a = parts.map((p, i) => { if (p.startsWith('*')) { c = i; return p.slice(1).trim(); } return p; });
        return a.length >= 2 ? { q, a, c } : null;
      }).filter(Boolean);
      return { task, sub: prev.sub, items: items.length ? items : prev.items };
    },
    render(api, d) {
      let i = 0, score = 0;
      const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];
      const step = () => {
        api.body.innerHTML = '';
        if (i >= d.items.length) return finish(api, { score, total: d.items.length });
        progress(api, i, d.items.length);
        const it = d.items[i];
        api.body.appendChild(el('div', 'quiz-q', `<span class="num">Вопрос ${i + 1} из ${d.items.length}</span>${esc(it.q)}`));
        const opts = el('div', 'options');
        it.a.forEach((a, k) => {
          const b = el('button', 'opt', `<span class="letter">${letters[k]}</span><span>${esc(a)}</span>`);
          b.addEventListener('click', () => {
            [...opts.children].forEach(x => x.disabled = true);
            if (k === it.c) { b.classList.add('ok'); score++; Sound.play('correct'); }
            else { b.classList.add('bad'); opts.children[it.c].classList.add('ok'); Sound.play('wrong'); }
            setTimeout(() => { i++; step(); }, 1000);
          });
          opts.appendChild(b);
        });
        api.body.appendChild(opts);
        Sound.speak(it.q);
      };
      step();
    },
  };

  /* =========================================================
     2. Найди пару
     ========================================================= */
  const pairs = {
    id: 'pairs', title: 'Найди пару', icon: 'ui/link',
    def: {
      task: 'Соедини слово с подходящей картинкой.',
      sub: 'Английский язык, дошкольники / 1 класс',
      items: [['Cat', 'img:pairs/cat'], ['Dog', 'img:pairs/dog'], ['Apple', 'img:pairs/apple'], ['Sun', 'img:pairs/sun'], ['Fish', 'img:pairs/fish'], ['Car', 'img:pairs/car']],
    },
    hint: 'Первая строка — задание. Далее по одной паре на строке:\nлево = право (слова, числа, примеры: 2+2 = 4).\nКартинки из набора: img:pairs/cat, dog, apple, sun, fish, car',
    toText: d => [d.task, ...d.items.map(p => `${p[0]} = ${p[1]}`)].join('\n'),
    fromText(t, prev) {
      const lines = t.split('\n').map(s => s.trim()).filter(Boolean);
      const task = lines.shift() || prev.task;
      const items = lines.map(l => l.split('=').map(s => s.trim())).filter(p => p.length === 2 && p[0] && p[1]);
      return { task, sub: prev.sub, items: items.length ? items : prev.items };
    },
    render(api, d) {
      api.body.innerHTML = '';
      let sel = null, done = 0, mistakes = 0;
      const wrap = el('div', 'pairs');
      const left = el('div', 'pairs-col'), right = el('div', 'pairs-col');
      const mk = (text, side, idx) => {
        const b = el('button', 'pair-item', rich(text, 'pic pic-sm'));
        b.dataset.side = side; b.dataset.idx = idx;
        b.addEventListener('click', () => {
          if (b.disabled) return;
          Sound.play('pick');
          if (sel && sel.dataset.side === side) { sel.classList.remove('sel'); sel = b; b.classList.add('sel'); return; }
          if (!sel) { sel = b; b.classList.add('sel'); return; }
          if (sel.dataset.idx === b.dataset.idx) {
            sel.classList.remove('sel'); sel.classList.add('ok'); b.classList.add('ok'); sel.disabled = b.disabled = true; sel = null;
            Sound.play('correct'); done++;
            if (done === d.items.length) setTimeout(() => finish(api, { score: d.items.length, total: d.items.length, text: mistakes ? `Все пары найдены! Ошибок: ${mistakes}` : 'Все пары найдены без единой ошибки!' }), 500);
          } else {
            const s = sel; s.classList.add('bad'); b.classList.add('bad'); mistakes++; Sound.play('wrong');
            setTimeout(() => { s.classList.remove('bad', 'sel'); b.classList.remove('bad'); }, 450); sel = null;
          }
        });
        return b;
      };
      shuffle(d.items.map((p, i) => i)).forEach(i => left.appendChild(mk(d.items[i][0], 'L', i)));
      shuffle(d.items.map((p, i) => i)).forEach(i => right.appendChild(mk(d.items[i][1], 'R', i)));
      wrap.append(left, right); api.body.appendChild(wrap);
    },
  };

  /* =========================================================
     3. Собери слово
     ========================================================= */
  const word = {
    id: 'word', title: 'Собери слово', icon: 'ui/abc',
    def: {
      task: 'Посмотри на картинку и собери слово из букв.',
      sub: 'Обучение грамоте, дошкольники',
      items: [['img:word/elephant', 'СЛОН'], ['img:word/flower', 'ЦВЕТОК'], ['img:word/house', 'ДОМ'], ['img:word/rocket', 'РАКЕТА'], ['img:word/frog', 'ЛЯГУШКА'], ['img:word/bear', 'МЕДВЕДЬ']],
    },
    hint: 'Первая строка — задание. Далее на каждой строке:\nподсказка = СЛОВО\nПодсказка — слово или картинка: img:word/elephant, flower, house, rocket, frog, bear',
    toText: d => [d.task, ...d.items.map(p => `${p[0]} = ${p[1]}`)].join('\n'),
    fromText(t, prev) {
      const lines = t.split('\n').map(s => s.trim()).filter(Boolean);
      const task = lines.shift() || prev.task;
      const items = lines.map(l => l.split('=').map(s => s.trim())).filter(p => p.length === 2 && p[1]).map(p => [p[0], p[1].toUpperCase()]);
      return { task, sub: prev.sub, items: items.length ? items : prev.items };
    },
    render(api, d) {
      let i = 0, mistakes = 0;
      const step = () => {
        api.body.innerHTML = '';
        if (i >= d.items.length) return finish(api, { score: d.items.length, total: d.items.length, text: `Все слова собраны! Ошибок: ${mistakes}` });
        progress(api, i, d.items.length);
        const [hint, w] = d.items[i];
        const letters = w.split('');
        let pos = 0;
        api.body.appendChild(el('div', 'word-pic', rich(hint, 'pic pic-lg')));
        const target = el('div', 'word-target');
        letters.forEach(() => target.appendChild(el('div', 'word-slot', '')));
        api.body.appendChild(target);
        const pool = el('div', 'word-letters');
        shuffle(letters.map((ch, k) => ({ ch, k }))).forEach(({ ch }) => {
          const b = el('button', 'letter-btn', esc(ch));
          b.addEventListener('click', () => {
            if (ch === letters[pos]) {
              b.disabled = true; const s = target.children[pos]; s.textContent = ch; s.classList.add('filled'); pos++; Sound.play('pop');
              if (pos === letters.length) {
                [...target.children].forEach(x => x.classList.add('ok')); Sound.play('correct'); Sound.speak(w.toLowerCase());
                setTimeout(() => { i++; step(); }, 1100);
              }
            } else { b.classList.add('bad'); mistakes++; Sound.play('wrong'); b.style.animation = 'shake .4s'; setTimeout(() => (b.style.animation = ''), 400); }
          });
          pool.appendChild(b);
        });
        api.body.appendChild(pool);
        api.body.appendChild(el('p', 'word-hint', `Нажимай буквы по порядку · слово ${i + 1} из ${d.items.length}`));
      };
      step();
    },
  };

  /* =========================================================
     4. Распредели по группам (drag & drop + tap)
     ========================================================= */
  const sort = {
    id: 'sort', title: 'Распредели по группам', icon: 'ui/folder',
    def: {
      task: 'Перетащи каждую карточку в нужную группу.',
      sub: 'Окружающий мир, 2–3 класс',
      groups: [
        { name: 'Овощи', items: ['Морковь', 'Огурец', 'Капуста', 'Свёкла'] },
        { name: 'Фрукты', items: ['Яблоко', 'Банан', 'Груша', 'Апельсин'] },
        { name: 'Ягоды', items: ['Клубника', 'Малина', 'Черника'] },
      ],
    },
    hint: 'Первая строка — задание. Далее каждая группа на своей строке:\nНазвание группы : элемент1, элемент2, элемент3',
    toText: d => [d.task, ...d.groups.map(g => `${g.name} : ${g.items.join(', ')}`)].join('\n'),
    fromText(t, prev) {
      const lines = t.split('\n').map(s => s.trim()).filter(Boolean);
      const task = lines.shift() || prev.task;
      const groups = lines.map(l => { const [name, rest] = l.split(':'); return name && rest ? { name: name.trim(), items: rest.split(',').map(s => s.trim()).filter(Boolean) } : null; }).filter(g => g && g.items.length);
      return { task, sub: prev.sub, groups: groups.length >= 2 ? groups : prev.groups };
    },
    render(api, d) {
      api.body.innerHTML = '';
      let picked = null, left = 0, mistakes = 0;
      api.body.appendChild(el('p', 'sort-help', 'Перетащите карточку мышью — или нажмите карточку, а затем группу.'));
      const pool = el('div', 'sort-pool');
      const bins = el('div', 'bins');
      const all = [];
      d.groups.forEach((g, gi) => g.items.forEach(it => all.push({ it, gi })));
      left = all.length;

      const place = (card, bin) => {
        const gi = +bin.dataset.gi;
        if (+card.dataset.gi === gi) {
          card.classList.remove('picked', 'dragging'); card.classList.add('ok'); card.draggable = false;
          bin.querySelector('.bin-items').appendChild(card); Sound.play('correct'); left--;
          if (!left) setTimeout(() => finish(api, { score: all.length, total: all.length, text: `Всё разложено по группам! Ошибок: ${mistakes}` }), 400);
        } else { bin.classList.add('bad'); Sound.play('wrong'); mistakes++; setTimeout(() => bin.classList.remove('bad'), 450); }
        picked = null;
      };

      shuffle(all).forEach(({ it, gi }) => {
        const c = el('div', 'sort-card', esc(it)); c.draggable = true; c.dataset.gi = gi;
        c.addEventListener('dragstart', e => { if (c.classList.contains('ok')) return e.preventDefault(); c.classList.add('dragging'); e.dataTransfer.setData('text/plain', '1'); picked = c; Sound.play('pick'); });
        c.addEventListener('dragend', () => c.classList.remove('dragging'));
        c.addEventListener('click', () => {
          if (c.classList.contains('ok')) return;
          if (picked) picked.classList.remove('picked');
          picked = picked === c ? null : c; if (picked) { c.classList.add('picked'); Sound.play('pick'); }
        });
        pool.appendChild(c);
      });

      d.groups.forEach((g, gi) => {
        const b = el('div', 'bin', `<div class="bin-title">${esc(g.name)}</div><div class="bin-items"></div>`); b.dataset.gi = gi;
        b.addEventListener('dragover', e => { e.preventDefault(); b.classList.add('over'); });
        b.addEventListener('dragleave', () => b.classList.remove('over'));
        b.addEventListener('drop', e => { e.preventDefault(); b.classList.remove('over'); if (picked) { Sound.play('drop'); place(picked, b); } });
        b.addEventListener('click', () => { if (picked && !picked.classList.contains('ok')) place(picked, b); });
        bins.appendChild(b);
      });
      api.body.append(pool, bins);
    },
  };

  /* =========================================================
     5. Верно / неверно
     ========================================================= */
  const truefalse = {
    id: 'truefalse', title: 'Верно / неверно', icon: 'ui/check',
    def: {
      task: 'Прочитай утверждение и реши: верно оно или нет.',
      sub: 'Математика, 2–3 класс',
      items: [['7 × 8 = 56', true], ['У квадрата пять углов', false], ['100 см — это 1 метр', true], ['В часе 100 минут', false], ['Число 15 делится на 3', true], ['Ноль — самое большое число', false]],
    },
    hint: 'Первая строка — задание. Далее по одному утверждению на строке.\nВерные утверждения начинайте с +, неверные с −:\n+ 2 + 2 = 4\n- Земля плоская',
    toText: d => [d.task, ...d.items.map(([s, v]) => `${v ? '+' : '-'} ${s}`)].join('\n'),
    fromText(t, prev) {
      const lines = t.split('\n').map(s => s.trim()).filter(Boolean);
      const task = lines.shift() || prev.task;
      const items = lines.map(l => { const m = l.match(/^([+\-−–])\s*(.+)$/); return m ? [m[2], m[1] === '+'] : null; }).filter(Boolean);
      return { task, sub: prev.sub, items: items.length ? items : prev.items };
    },
    render(api, d) {
      let i = 0, score = 0;
      const step = () => {
        api.body.innerHTML = '';
        if (i >= d.items.length) return finish(api, { score, total: d.items.length });
        progress(api, i, d.items.length);
        const [s, v] = d.items[i];
        const card = el('div', 'tf-card', `<div class="tf-statement">${esc(s)}</div>`);
        const btns = el('div', 'tf-buttons');
        const mk = (label, val, cls) => {
          const b = el('button', 'tf-btn ' + cls, label);
          b.addEventListener('click', () => {
            [...btns.children].forEach(x => { x.disabled = true; if (x !== b) x.classList.add('dim'); });
            if (val === v) { score++; Sound.play('correct'); card.appendChild(el('p', 'tf-fb ok', 'Верно!')); }
            else { Sound.play('wrong'); card.appendChild(el('p', 'tf-fb bad', `Правильный ответ: <b>${v ? 'Верно' : 'Неверно'}</b>`)); }
            setTimeout(() => { i++; step(); }, 1000);
          });
          return b;
        };
        btns.append(mk('Верно', true, 'tf-true'), mk('Неверно', false, 'tf-false'));
        card.appendChild(btns); api.body.appendChild(card);
        Sound.speak(s);
      };
      step();
    },
  };

  /* =========================================================
     6. Мемори
     ========================================================= */
  const memory = {
    id: 'memory', title: 'Мемори', icon: 'ui/cards',
    def: {
      task: 'Найди все одинаковые пары карточек.',
      sub: 'Внимание и память, дошкольники',
      items: ['img:memory/fox', 'img:memory/panda', 'img:memory/lion', 'img:memory/frog', 'img:memory/butterfly', 'img:memory/octopus'],
    },
    hint: 'Первая строка — задание. Вторая — карточки через запятую (короткие слова, числа или картинки), 4–8 штук.\nКартинки: img:memory/fox, panda, lion, frog, butterfly, octopus',
    toText: d => [d.task, d.items.join(', ')].join('\n'),
    fromText(t, prev) {
      const lines = t.split('\n').map(s => s.trim()).filter(Boolean);
      const task = lines.shift() || prev.task;
      const items = (lines.join(',')).split(',').map(s => s.trim()).filter(Boolean).slice(0, 8);
      return { task, sub: prev.sub, items: items.length >= 2 ? items : prev.items };
    },
    render(api, d) {
      api.body.innerHTML = '';
      let open = [], lock = false, found = 0, moves = 0;
      const meta = el('div', 'memory-meta', 'Ходов: 0'); api.body.appendChild(meta);
      const grid = el('div', 'memory-grid');
      const cards = shuffle([...d.items, ...d.items]);
      if (cards.length > 12) grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
      cards.forEach(v => {
        const c = el('button', 'mem-card', `<div class="mem-face mem-front">?</div><div class="mem-face mem-back">${rich(v, 'pic pic-md')}</div>`);
        c.dataset.v = v;
        c.addEventListener('click', () => {
          if (lock || c.classList.contains('flip')) return;
          c.classList.add('flip'); Sound.play('flip'); open.push(c);
          if (open.length === 2) {
            moves++; meta.textContent = `Ходов: ${moves}`; lock = true;
            const [a, b] = open;
            if (a.dataset.v === b.dataset.v) {
              a.classList.add('done'); b.classList.add('done'); found++; open = []; lock = false; Sound.play('correct');
              if (found === d.items.length) setTimeout(() => finish(api, { score: d.items.length, total: d.items.length, text: `Все пары найдены за ${moves} ходов!` }), 600);
            } else {
              Sound.play('wrong');
              setTimeout(() => { a.classList.remove('flip'); b.classList.remove('flip'); open = []; lock = false; }, 900);
            }
          }
        });
        grid.appendChild(c);
      });
      api.body.appendChild(grid);
    },
  };

  const list = [quiz, pairs, word, sort, truefalse, memory];
  window.Exercises = {
    list,
    byId: id => list.find(x => x.id === id),
    getData: ex => load(ex.id, ex.def),
    setData: (ex, data) => save(ex.id, data),
    reset: ex => reset(ex.id),
  };
})();
