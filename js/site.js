// js/site.js
(() => {
  // ==== 二重読み込みガード ====
  if (window.__siteInit) return;
  window.__siteInit = true;

  const html = document.documentElement;

  // ========== 1) WideSlider ==========
  (() => {
    const slider = document.querySelector('.wideslider');
    if (!slider) return;

    const track   = slider.querySelector('.ws-track');
    const slides  = Array.from(slider.querySelectorAll('.ws-slide'));
    const prevBtn = slider.querySelector('.ws-arrow.prev');
    const nextBtn = slider.querySelector('.ws-arrow.next');
    const dotsWrap = slider.querySelector('.ws-dots');
    if (!track || slides.length === 0 || !dotsWrap) return;

    let index = 0;
    let timer = null;
    const DURATION = 4800;       // 自動送り間隔
    const SWIPE_THRESHOLD = 30;  // スワイプ判定(px)

    // ドット生成
    const dots = slides.map((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'ws-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', `${i + 1}枚目へ`);
      d.addEventListener('click', () => goTo(i, true));
      dotsWrap.appendChild(d);
      return d;
    });

    function update() {
      track.style.transform = `translateX(${-100 * index}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }
    function goTo(i, user = false) {
      index = (i + slides.length) % slides.length;
      update();
      if (user) restart();
    }
    const next = () => goTo(index + 1);
    const prev = () => goTo(index - 1);

    prevBtn?.addEventListener('click', () => goTo(index - 1, true));
    nextBtn?.addEventListener('click', () => goTo(index + 1, true));

    function start() { if (!timer) timer = setInterval(next, DURATION); }
    function stop()  { if (timer) { clearInterval(timer); timer = null; } }
    function restart(){ stop(); start(); }

    // ホバー/フォーカスで一時停止
    ['mouseenter','focusin'].forEach(ev => slider.addEventListener(ev, stop));
    ['mouseleave','focusout'].forEach(ev => slider.addEventListener(ev, start));

    // スワイプ（タッチ/ドラッグ）
    let startX = 0, diffX = 0, dragging = false;
    function onStart(x){ dragging = true; startX = x; diffX = 0; stop(); }
    function onMove(x){ if (dragging) diffX = x - startX; }
    function onEnd(){
      if (!dragging) return;
      dragging = false;
      if (Math.abs(diffX) > SWIPE_THRESHOLD) { diffX < 0 ? next() : prev(); }
      else { update(); start(); }
    }
    slider.addEventListener('touchstart', e => onStart(e.touches[0].clientX), { passive: true });
    slider.addEventListener('touchmove',  e => onMove(e.touches[0].clientX), { passive: true });
    slider.addEventListener('touchend', onEnd);
    slider.addEventListener('mousedown', e => onStart(e.clientX));
    window.addEventListener('mousemove', e => onMove(e.clientX));
    window.addEventListener('mouseup', onEnd);

    // 初期化
    update(); start();
    // リサイズ時の保険
    window.addEventListener('resize', () => requestAnimationFrame(update));
  })();

  // ========== 2) Hamburger / Drawer ==========
  (() => {
    const hamburger = document.getElementById('hamburger');
    const drawer    = document.getElementById('drawer');
    const overlay   = document.getElementById('overlay');
    if (!hamburger || !drawer || !overlay) return;

    // A11y 初期属性
    hamburger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');

    let lastActive = null;

    const lockScroll = () => html.classList.add('no-scroll');   // CSSで overflow:hidden;
    const unlockScroll = () => html.classList.remove('no-scroll');

    const firstFocusable = () =>
      drawer.querySelector('a,button,[tabindex]:not([tabindex="-1"])');

    const openNav = () => {
      lastActive = document.activeElement;
      hamburger.classList.add('is-open');
      drawer.classList.add('open');
      overlay.classList.add('show');
      hamburger.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      lockScroll();
      const f = firstFocusable();
      if (f) setTimeout(() => f.focus(), 0);
    };

    const closeNav = () => {
      hamburger.classList.remove('is-open');
      drawer.classList.remove('open');
      overlay.classList.remove('show');
      hamburger.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      unlockScroll();
      if (lastActive && typeof lastActive.focus === 'function') {
        setTimeout(() => lastActive.focus(), 0);
      }
    };

    const toggleNav = () =>
      drawer.classList.contains('open') ? closeNav() : openNav();

    // クリック類
    hamburger.addEventListener('click', (e) => { e.preventDefault(); toggleNav(); });
    overlay.addEventListener('click', closeNav);
    drawer.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a && !a.hasAttribute('data-keep-open')) closeNav();
    });

    // Esc で閉じる
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });

    // 860px超で強制クローズ（状態持ち越し防止）
    const BREAKPOINT = 860;
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > BREAKPOINT) closeNav();
      }, 120);
    });

    // ハッシュ遷移／戻る復元対策
    window.addEventListener('hashchange', closeNav);
    window.addEventListener('pageshow', closeNav);
  })();

  // ========== 3) Scroll-in Reveal ==========
  (() => {
   const reveals = document.querySelectorAll(
  '.title-hero, .p-card, .svc-card, .pickup-card, .pickup-feature--split'
);

    if (!reveals.length) return;
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          ent.target.classList.add('reveal-in');
          obs.unobserve(ent.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
    reveals.forEach(el => io.observe(el));
  })();
})();

/* --- サービスページ　エアコンのクリーニング注意事項　アコーディオン制御 --- */
document.querySelectorAll(".svc-accordion-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", !expanded);
    const content = btn.nextElementSibling;
    content.style.maxHeight = expanded ? null : content.scrollHeight + "px";
  });
});
