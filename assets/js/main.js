/* Progressive enhancement for the portfolio page.
 * - Mobile menu, theme toggle, sticky-nav state, scroll progress, back-to-top
 * - Active section highlighting
 * - Reveal-on-scroll, typed role, stat count-up
 * - Collapsible experience bullets, skill category filter, copy email
 * - Loads Projects (pinned repositories) from assets/data/projects.json
 */

(function () {
  'use strict';

  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ------------------------------
   * Theme toggle
   * ------------------------------ */
  const themeBtn = $('.theme-toggle');
  function currentTheme() {
    const explicit = root.getAttribute('data-theme');
    if (explicit) return explicit;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  themeBtn?.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch { /* storage unavailable */ }
  });

  /* ------------------------------
   * Mobile menu
   * ------------------------------ */
  const menuBtn = $('.menu-toggle');
  const navLinksWrap = $('#nav-links');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    menuBtn?.setAttribute('aria-expanded', String(open));
    menuBtn?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn?.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  navLinksWrap?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', (e) => {
    if (!root.classList.contains('menu-open')) return;
    if (e.target.closest('.nav')) return;
    setMenu(false);
  });
  window.matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ------------------------------
   * Scroll: progress, nav state, back-to-top
   * ------------------------------ */
  const header = $('.site-header');
  const progressBar = $('.scroll-progress__bar');
  const toTop = $('.to-top');
  let ticking = false;
  function onScroll() {
    const y = window.scrollY || root.scrollTop || 0;
    const height = root.scrollHeight - root.clientHeight;
    const ratio = height > 0 ? Math.min(1, Math.max(0, y / height)) : 0;
    if (progressBar) progressBar.style.transform = `scaleX(${ratio})`;
    header?.classList.toggle('is-scrolled', y > 8);
    toTop?.classList.toggle('is-visible', y > 600);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));

  /* ------------------------------
   * Active section highlighting
   * ------------------------------ */
  const navLinks = $$('.nav-links a[href^="#"]');
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => {
          const on = a.getAttribute('href') === `#${e.target.id}`;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => obs.observe(s));
  }

  /* ------------------------------
   * Reveal-on-scroll
   * ------------------------------ */
  let revealObs = null;
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    revealObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        revealObs.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
  }
  function observeReveals(scope = document) {
    $$('.reveal:not(.is-visible), .spoken:not(.is-visible)', scope).forEach((el, i) => {
      if (!revealObs) { el.classList.add('is-visible'); return; }
      // small stagger for siblings in grids
      el.style.transitionDelay = el.parentElement?.matches('.skill-grid, .projects-grid, .edu-grid, .stats') ? `${(i % 3) * 70}ms` : '';
      revealObs.observe(el);
    });
  }
  observeReveals();

  /* ------------------------------
   * Typed role rotator
   * ------------------------------ */
  const typed = $('.typed');
  if (typed && !prefersReducedMotion) {
    const words = (typed.dataset.words || '').split('|').filter(Boolean);
    let w = 0, c = words[0]?.length || 0, deleting = true;
    const tick = () => {
      const word = words[w];
      c += deleting ? -1 : 1;
      typed.textContent = word.slice(0, c);
      let delay = deleting ? 35 : 70;
      if (!deleting && c === word.length) { deleting = true; delay = 1800; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 300; }
      setTimeout(tick, delay);
    };
    if (words.length > 1) setTimeout(tick, 2200);
  }

  /* ------------------------------
   * Stat count-up
   * ------------------------------ */
  const counters = $$('.stat-num[data-count]');
  if (counters.length && !prefersReducedMotion && 'IntersectionObserver' in window) {
    const countObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        countObs.unobserve(e.target);
        const el = e.target;
        const target = Number(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const start = performance.now();
        const dur = 1200;
        const step = (t) => {
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = `${Math.round(target * eased)}${suffix}`;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => countObs.observe(el));
  }

  /* ------------------------------
   * Collapsible experience bullets
   * ------------------------------ */
  const VISIBLE_POINTS = 3;
  $$('.job').forEach((job) => {
    const items = $$('.job-points li', job);
    if (items.length <= VISIBLE_POINTS + 1) return;
    job.classList.add('is-collapsible');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'more-btn';
    btn.setAttribute('aria-expanded', 'false');
    const hidden = items.length - VISIBLE_POINTS;
    const label = (open) => `${open ? 'Show less' : `Show ${hidden} more`} <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
    btn.innerHTML = label(false);
    btn.addEventListener('click', () => {
      const open = job.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      btn.innerHTML = label(open);
    });
    $('.job-points', job).after(btn);
  });

  /* ------------------------------
   * Skill category filter
   * ------------------------------ */
  const filters = $$('.skill-filters .filter');
  const skillCards = $$('.skill-card');
  const isNarrow = window.matchMedia('(max-width: 639px)');
  function applyFilter(cat) {
    filters.forEach((f) => {
      const on = f.dataset.filter === cat;
      f.classList.toggle('is-active', on);
      f.setAttribute('aria-pressed', String(on));
    });
    skillCards.forEach((card) => {
      const match = cat === 'all' || card.dataset.cat === cat;
      // On phones hide non-matching cards; on wider screens dim them to keep the grid stable.
      card.classList.toggle('is-hidden', !match && isNarrow.matches);
      card.classList.toggle('is-dim', !match && !isNarrow.matches);
    });
  }
  filters.forEach((f) => f.addEventListener('click', () => {
    applyFilter(f.dataset.filter);
    f.scrollIntoView({ block: 'nearest', inline: 'center', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }));
  isNarrow.addEventListener('change', () => {
    const active = $('.skill-filters .filter.is-active');
    applyFilter(active ? active.dataset.filter : 'all');
  });

  /* ------------------------------
   * Copy email + toast
   * ------------------------------ */
  const toast = $('.toast');
  let toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }
  $$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = 'Copied';
      showToast('Email copied to clipboard');
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    } catch {
      showToast(btn.dataset.copy);
    }
  }));

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------
   * Projects (Pinned)
   * ------------------------------ */
  const MAX_PROJECTS = 4;
  const PROJECTS_JSON_URL = '/assets/data/projects.json';
  // Shown as hand-written case studies in index.html
  const FEATURED_REPOS = new Set(['panel-360', 'food-delivery-microservices']);

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function prettyName(name) {
    return String(name).replace(/[-_]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function languageColor(lang) {
    const map = {
      Java: '#f59e0b',
      Python: '#3b82f6',
      JavaScript: '#eab308',
      TypeScript: '#0ea5e9',
      HTML: '#f43f5e',
      CSS: '#8b5cf6',
      Shell: '#64748b',
      'Jupyter Notebook': '#f97316',
    };
    return map[lang] || '#6ea8fe';
  }

  function renderProjectCard(repo) {
    const url = /^https:\/\/github\.com\//.test(repo.url || '') ? repo.url : 'https://github.com/arnold-abraham';
    const desc = repo.description ? escapeHtml(repo.description.trim()) : 'No description provided.';
    const lang = repo.language ? escapeHtml(repo.language) : null;

    return `
      <a class="card project-card reveal" href="${escapeHtml(url)}" target="_blank" rel="noreferrer noopener">
        <div class="project-top">
          <span class="project-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </span>
          <svg class="project-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>
        </div>
        <h3>${escapeHtml(prettyName(repo.name))}</h3>
        <p class="project-desc">${desc}</p>
        <div class="project-meta">
          ${lang ? `<span><i class="dot" style="background:${languageColor(repo.language)}"></i>${lang}</span>` : ''}
        </div>
      </a>
    `;
  }

  function attachSpotlight(container) {
    $$('.project-card', container).forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  async function loadProjects() {
    const container = document.getElementById('pinned-projects');
    if (!container) return;
    const fail = '<div class="card project-error">Projects couldn\'t be loaded right now. Please view my GitHub profile.</div>';

    try {
      const res = await fetch(`${PROJECTS_JSON_URL}?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`projects.json fetch failed: ${res.status}`);
      const data = await res.json();
      const projects = (Array.isArray(data?.projects) ? data.projects : [])
        .filter((p) => !FEATURED_REPOS.has(p.name))
        .slice(0, MAX_PROJECTS);
      container.innerHTML = projects.length ? projects.map(renderProjectCard).join('') : fail;
      observeReveals(container);
      attachSpotlight(container);
    } catch {
      container.innerHTML = fail;
    }
  }

  loadProjects();
})();
