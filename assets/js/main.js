/* Minimal progressive enhancement for the portfolio page.
 * - Highlights active section in nav as you scroll
 * - Adds scroll progress indicator
 * - Adds keyboard-friendly behavior for in-page links
 * - Loads Projects (pinned repositories)
 * - Adds subtle reveal-on-scroll animations
 */

(function () {
  'use strict';

  const nav = document.querySelector('.top-nav');
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  // Scroll progress bar
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.innerHTML = '<div class="scroll-progress__bar" aria-hidden="true"></div>';
  document.body.appendChild(progress);
  const progressBar = progress.querySelector('.scroll-progress__bar');

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------
   * Reveal-on-scroll animations
   * ------------------------------ */
  function setupRevealAnimations() {
    const revealEls = Array.from(document.querySelectorAll('.reveal'));
    const staggerGroups = Array.from(document.querySelectorAll('.reveal-stagger'));

    if (prefersReducedMotion) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
      staggerGroups.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    // If IntersectionObserver isn't supported, just show everything.
    if (!('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
      staggerGroups.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    [...revealEls, ...staggerGroups].forEach((el) => obs.observe(el));
  }

  function setProgress() {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const ratio = height > 0 ? Math.min(1, Math.max(0, scrollTop / height)) : 0;
    progressBar.style.transform = `scaleX(${ratio})`;
  }

  // Active section highlighting via IntersectionObserver
  let activeId = null;
  function setActive(id) {
    if (activeId === id) return;
    activeId = id;
    navLinks.forEach((a) => {
      const isActive = a.getAttribute('href') === `#${id}`;
      a.classList.toggle('is-active', isActive);
      if (isActive) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
        if (visible[0] && visible[0].target && visible[0].target.id) {
          setActive(visible[0].target.id);
        }
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.5, 0.65],
        rootMargin: '-20% 0px -65% 0px',
      }
    );

    sections.forEach((s) => obs.observe(s));
  }

  // Smooth focus handling after anchor navigation
  navLinks.forEach((a) => {
    a.addEventListener('click', () => {
      const href = a.getAttribute('href');
      const target = href ? document.querySelector(href) : null;
      if (!target) return;

      window.setTimeout(() => {
        const prevTabIndex = target.getAttribute('tabindex');
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        if (prevTabIndex === null) target.removeAttribute('tabindex');
        else target.setAttribute('tabindex', prevTabIndex);
      }, prefersReducedMotion ? 0 : 220);
    });
  });

  // Update progress
  setProgress();
  window.addEventListener('scroll', setProgress, { passive: true });
  window.addEventListener('resize', setProgress);

  // Subtle elevation change when scrolling
  function updateNavScrolled() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    if (!nav) return;
    nav.classList.toggle('is-scrolled', y > 8);
  }

  updateNavScrolled();
  window.addEventListener('scroll', updateNavScrolled, { passive: true });

  // Init reveal animations after initial layout
  window.requestAnimationFrame(setupRevealAnimations);

  /* ------------------------------
   * Projects (Pinned)
   * ------------------------------ */

  const GITHUB_USER = 'arnold-abraham';
  const MAX_PROJECTS = 4;
  const PROJECTS_JSON_URL = '/assets/data/projects.json';

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function formatCompactNumber(n) {
    const num = Number(n) || 0;
    if (num < 1000) return String(num);
    const units = ['k', 'm', 'b'];
    let value = num;
    let idx = -1;
    while (value >= 1000 && idx < units.length - 1) {
      value /= 1000;
      idx++;
    }
    const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
    return `${rounded}${units[idx]}`;
  }

  function languageColor(lang) {
    const map = {
      Java: '#f59e0b',
      Python: '#60a5fa',
      JavaScript: '#fbbf24',
      TypeScript: '#38bdf8',
      HTML: '#fb7185',
      CSS: '#a78bfa',
      Shell: '#94a3b8',
      'Jupyter Notebook': '#f97316',
    };
    return map[lang] || 'rgba(96,165,250,.9)';
  }

  function renderProjectCard(repo) {
    const name = escapeHtml(repo.name);
    const url = repo.url;
    const desc = repo.description ? escapeHtml(repo.description) : 'No description provided.';
    const lang = repo.language ? escapeHtml(repo.language) : null;
    const stars = repo.stars ?? 0;
    const forks = repo.forks ?? 0;

    const langPill = lang
      ? `<span class="pill"><span class="dot" style="background:${languageColor(repo.language)}"></span>${lang}</span>`
      : '';

    const starPill = `<span class="pill">★ ${formatCompactNumber(stars)}</span>`;
    const forkPill = `<span class="pill">⑂ ${formatCompactNumber(forks)}</span>`;

    return `
      <a class="project-card reveal" href="${url}" target="_blank" rel="noreferrer noopener">
        <div class="project-title">
          <span>${name}</span>
          <span style="opacity:.75">↗</span>
        </div>
        <p class="project-desc">${desc}</p>
        <div class="project-meta">
          ${langPill}
          ${starPill}
          ${forkPill}
        </div>
      </a>
    `;
  }

  function renderProjects(container, projects) {
    const slice = (projects || []).slice(0, MAX_PROJECTS);
    if (!slice.length) {
      container.innerHTML = '<div class="project-skeleton">Projects couldn\'t be loaded right now. Please view my GitHub profile.</div>';
      return;
    }
    container.innerHTML = slice.map(renderProjectCard).join('');

    // After inserting cards, ensure reveal observer picks them up.
    setupRevealAnimations();
  }

  async function fetchProjectsFromLocalJson() {
    const url = `${PROJECTS_JSON_URL}?v=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`projects.json fetch failed: ${res.status}`);
    const data = await res.json();
    const projects = Array.isArray(data?.projects) ? data.projects : [];
    return projects;
  }

  async function fetchPinnedFromProfileHtml(username) {
    const res = await fetch(`https://github.com/${encodeURIComponent(username)}`, {
      headers: { 'Accept': 'text/html' },
    });
    if (!res.ok) throw new Error(`GitHub profile fetch failed: ${res.status}`);

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const pinnedItems = Array.from(doc.querySelectorAll('div.pinned-item-list-item'));
    if (!pinnedItems.length) throw new Error('No pinned items found');

    const repos = pinnedItems
      .map((item) => {
        const link = item.querySelector('a[href*="/"]');
        const href = link ? link.getAttribute('href') : null;
        if (!href) return null;

        const parts = href.split('/').filter(Boolean);
        if (parts.length < 2) return null;
        const name = parts[1];

        const descEl = item.querySelector('p.pinned-item-desc');
        const description = descEl ? descEl.textContent.trim() : '';

        const langEl = item.querySelector('[itemprop="programmingLanguage"]');
        const language = langEl ? langEl.textContent.trim() : null;

        const starsEl = item.querySelector('a[href$="/stargazers"]');
        const forksEl = item.querySelector('a[href$="/forks"]');
        const stars = starsEl ? Number((starsEl.textContent || '').trim().replaceAll(',', '')) : 0;
        const forks = forksEl ? Number((forksEl.textContent || '').trim().replaceAll(',', '')) : 0;

        return {
          name,
          description,
          language,
          stars: Number.isFinite(stars) ? stars : 0,
          forks: Number.isFinite(forks) ? forks : 0,
          url: `https://github.com/${username}/${name}`,
        };
      })
      .filter(Boolean);

    return repos;
  }

  async function loadProjects() {
    const container = document.getElementById('pinned-projects');
    if (!container) return;

    try {
      const local = await fetchProjectsFromLocalJson();
      // If local JSON has real data, use it.
      if (local && local.length) {
        renderProjects(container, local);
        return;
      }
    } catch {
      // ignore; fallback below
    }

    // Fallback: pinned only (no "all repos" fallbacks)
    try {
      const pinned = await fetchPinnedFromProfileHtml(GITHUB_USER);
      renderProjects(container, pinned);
    } catch {
      container.innerHTML = '<div class="project-skeleton">Projects couldn\'t be loaded right now. Please refresh, or view my GitHub profile.</div>';
    }
  }

  loadProjects();
})();
