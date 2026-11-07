// ============================================================
// Back Nine Demo — Shared navigation behaviour
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.site-nav');
  const hamburger = document.querySelector('.nav-hamburger');

  // Scroll-based nav background
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile hamburger
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      document.body.classList.toggle('mobile-nav-open');
      const isOpen = document.body.classList.contains('mobile-nav-open');
      hamburger.setAttribute('aria-expanded', isOpen);
    });
    // Close on nav link click
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.addEventListener('click', () => {
        document.body.classList.remove('mobile-nav-open');
      });
    });
  }

  // Mark current page active
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Mobile/capability detection
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
                   window.innerWidth < 768 ||
                   !window.WebGLRenderingContext;
  if (isMobile) document.body.classList.add('is-mobile');

  // Scroll-reveal for .reveal elements (used on mobile and non-3D pages)
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  }
});
