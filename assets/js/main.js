/* Minimal progressive enhancement for the portfolio page.
 * - Highlights active section in nav as you scroll
 * - Adds scroll progress indicator
 * - Adds keyboard-friendly behavior for in-page links
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
        // Pick the most visible entry
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

      // Let browser scroll (CSS handles smooth scroll), then focus the section for accessibility.
      // Make the section programmatically focusable only when needed.
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
})();
