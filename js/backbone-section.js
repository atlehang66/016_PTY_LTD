/* ============================================================
   Ark Tech — "Digital backbone" second hero section
   ------------------------------------------------------------
   Triggers the scroll-in reveal for headline, copy, CTA, and
   the animated network visual. No dependencies.
   ============================================================ */
(function () {
  const section = document.getElementById('backbone');
  if (!section) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    section.classList.add('in-view');
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        section.classList.add('in-view');
        observer.unobserve(section);
      });
    },
    { threshold: 0.3, rootMargin: '0px 0px -60px 0px' }
  );

  observer.observe(section);
})();