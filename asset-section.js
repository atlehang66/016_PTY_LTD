/* ============================================================
   Ark Tech — "Software Is an Asset" dashboard section
   ------------------------------------------------------------
   Reveals cards/badges on scroll and animates the counters.
   No dependencies. Respects prefers-reduced-motion.
   ============================================================ */
(function () {
  const section = document.getElementById('asset');
  if (!section) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    if (isNaN(target)) return;

    if (reduceMotion) {
      el.textContent = target.toFixed(decimals);
      return;
    }

    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = target * eased;
      el.textContent = value.toFixed(decimals);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(tick);
  }

  const revealTargets = section.querySelectorAll('.asset-card, .asset-badge');

  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealTargets.forEach((el) => {
      el.classList.add('in-view');
      el.querySelectorAll('[data-counter]').forEach(animateCounter);
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('in-view');
        el.querySelectorAll('[data-counter]').forEach(animateCounter);
        observer.unobserve(el);
      });
    },
    { threshold: 0.35, rootMargin: '0px 0px -40px 0px' }
  );

  revealTargets.forEach((el, i) => {
    if (el.classList.contains('asset-card')) {
      el.style.transitionDelay = (i * 0.1).toFixed(2) + 's';
    }
    observer.observe(el);
  });
})();