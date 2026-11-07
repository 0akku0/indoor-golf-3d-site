// ============================================================
// Back Nine Demo — Scroll panel reveal + navigation dots
// ============================================================

import { getScrollProgress } from './three-scene.js';

// Each panel is active when scroll progress is within [start, end]
const PANELS = [
  { id: 'panel-welcome',   start: 0,    end: 0.22 },
  { id: 'panel-reception', start: 0.14, end: 0.38 },
  { id: 'panel-bay1',      start: 0.30, end: 0.54 },
  { id: 'panel-bays23',    start: 0.46, end: 0.68 },
  { id: 'panel-private',   start: 0.60, end: 0.82 },
  { id: 'panel-findus',    start: 0.76, end: 1.00 },
];

// Scroll spacer height (controls scroll travel)
const SCROLL_HEIGHT_VH = 600;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set scroll spacer height
  const spacer = document.getElementById('scroll-spacer');
  if (spacer) {
    spacer.style.height = SCROLL_HEIGHT_VH + 'vh';
  }

  // Build nav dots
  const navEl = document.getElementById('scroll-nav');
  if (navEl) {
    navEl.innerHTML = '';
    PANELS.forEach((p, i) => {
      const dot = document.createElement('div');
      dot.className = 'scroll-nav-dot';
      dot.dataset.idx = i;
      dot.title = p.id.replace('panel-','');
      dot.addEventListener('click', () => scrollToPanel(i));
      navEl.appendChild(dot);
    });
  }

  // Initial render
  updatePanels();

  // Scroll listener — passive for performance
  window.addEventListener('scroll', updatePanels, { passive: true });

  // Hide scroll hint after first scroll
  const hint = document.querySelector('.scroll-hint');
  if (hint) {
    window.addEventListener('scroll', () => {
      hint.style.opacity = window.scrollY > 80 ? '0' : '1';
    }, { passive: true });
  }
});

function updatePanels() {
  const progress = getScrollProgress();

  PANELS.forEach((p, i) => {
    const el = document.getElementById(p.id);
    if (!el) return;

    const active = progress >= p.start && progress <= p.end;
    el.classList.toggle('active', active);

    // Update nav dot
    const dot = document.querySelector(`.scroll-nav-dot[data-idx="${i}"]`);
    if (dot) dot.classList.toggle('active', active);
  });
}

function scrollToPanel(idx) {
  const p = PANELS[idx];
  if (!p) return;
  const midProgress = (p.start + p.end) / 2;
  const total = document.body.scrollHeight - window.innerHeight;
  window.scrollTo({ top: midProgress * total, behavior: 'smooth' });
}
