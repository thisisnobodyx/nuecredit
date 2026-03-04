/* ═══════════════════════════════════════════════════════════
   nueCredit — Global JavaScript
   Shared across all pages. Include at bottom of every <body>:
   <script src="../js/main.js"></script>
   ═══════════════════════════════════════════════════════════ */

// ── SCROLL REVEAL ────────────────────────────────────────────
const reveals = document.querySelectorAll('.reveal');
if (reveals.length) {
  const ro = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); ro.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => ro.observe(el));
}

// ── TIMELINE ─────────────────────────────────────────────────
const wrap  = document.getElementById('tlWrap');
const fill  = document.getElementById('tlFill');
const steps = document.querySelectorAll('[data-step]');
if (wrap && fill && steps.length) {
  function updateFill() {
    const vis = [...steps].filter(s => s.classList.contains('on'));
    if (!vis.length) { fill.style.height = '0px'; return; }
    const last = vis[vis.length - 1].querySelector('.tl-dot');
    const wt = wrap.getBoundingClientRect().top + window.scrollY;
    const dt = last.getBoundingClientRect().top + window.scrollY + last.offsetHeight / 2;
    fill.style.height = Math.max(0, dt - wt) + 'px';
  }
  const tio = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); updateFill(); } });
  }, { threshold: 0.4, rootMargin: '0px 0px -60px 0px' });
  steps.forEach(s => tio.observe(s));
  window.addEventListener('scroll', updateFill, { passive: true });
  window.addEventListener('resize', updateFill, { passive: true });
}

// ── MOBILE NAV ───────────────────────────────────────────────
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
}

// ── NAV SCROLL ───────────────────────────────────────────────
const navEl = document.getElementById('nav');
if (navEl) {
  window.addEventListener('scroll', () => {
    navEl.style.background = window.scrollY > 60
      ? 'rgba(10,10,10,.97)'
      : 'rgba(10,10,10,.85)';
  }, { passive: true });
}

// ── ACTIVE NAV LINK ──────────────────────────────────────────
(function markActiveLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === path) a.classList.add('active');
  });
})();
