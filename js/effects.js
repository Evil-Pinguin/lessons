/* =========================================================
   Визуальные эффекты: появление при прокрутке, 3D-наклон,
   волна на кнопках, свечение за курсором, счётчики,
   прогресс прокрутки, всплывающие «+1».
   ========================================================= */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    /* --- появление при прокрутке --- */
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    /* --- блик-полоска на карточках --- */
    document.querySelectorAll('.card.glass, .price.glass, .type.glass, .steps li.glass').forEach(el => {
      const s = document.createElement('span'); s.className = 'shine'; el.appendChild(s);
    });

    /* --- прогресс прокрутки + шапка --- */
    const bar = document.createElement('div'); bar.className = 'scroll-progress'; document.body.appendChild(bar);
    const header = document.querySelector('.site-header');
    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      bar.style.width = (p * 100) + '%';
      header.classList.toggle('scrolled', h.scrollTop > 20);
    };
    document.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    if (reduce) return;

    /* --- свечение за курсором --- */
    const glow = document.getElementById('cursorGlow');
    let gx = 0, gy = 0, tx = 0, ty = 0, raf = null;
    const tick = () => { gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12; glow.style.left = gx + 'px'; glow.style.top = gy + 'px'; raf = Math.abs(tx - gx) + Math.abs(ty - gy) > .5 ? requestAnimationFrame(tick) : null; };
    document.addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY; document.body.classList.add('has-mouse');
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });

    /* --- 3D-наклон карточки героя --- */
    document.querySelectorAll('.tilt').forEach(card => {
      const wrap = card.parentElement;
      wrap.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(0)`;
        card.style.boxShadow = `${-x * 30}px ${20 - y * 20}px 60px rgba(60,70,120,.22)`;
      });
      wrap.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.boxShadow = ''; });
    });

    /* --- волна на кнопках --- */
    document.addEventListener('pointerdown', e => {
      const b = e.target.closest('.btn, .tab, .opt, .tf-btn, .letter-btn');
      if (!b) return;
      const r = b.getBoundingClientRect();
      const s = document.createElement('span'); s.className = 'ripple';
      const size = Math.max(r.width, r.height);
      s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
      b.style.overflow = 'hidden';
      b.appendChild(s); setTimeout(() => s.remove(), 650);
    });

    /* --- счётчики в герое --- */
    document.querySelectorAll('.count').forEach(el => {
      const to = +el.dataset.to, t0 = performance.now(), dur = 1200;
      const step = now => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(to * e);
        if (k < 1) requestAnimationFrame(step);
      };
      setTimeout(() => requestAnimationFrame(step), 500);
    });

    /* --- всплывающие «+1» при правильном ответе --- */
    document.addEventListener('click', e => {
      const t = e.target.closest('.opt, .tile, .pair-item, .tf-btn, .mem-card');
      if (!t) return;
      setTimeout(() => {
        if (!t.classList.contains('ok') && !t.classList.contains('done')) return;
        const f = document.createElement('span'); f.className = 'float-score'; f.textContent = '+1';
        f.style.left = e.clientX + 'px'; f.style.top = e.clientY - 20 + 'px';
        document.body.appendChild(f); setTimeout(() => f.remove(), 900);
      }, 30);
    });
  });
})();
