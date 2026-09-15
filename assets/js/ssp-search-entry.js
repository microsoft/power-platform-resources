(() => {
  const nav = document.getElementById('siteNav');
  if (nav && !nav.querySelector('a[href="ssp-search.html"]')) {
    const link = document.createElement('a');
    link.href = 'ssp-search.html';
    link.textContent = 'Search';
    if (location.pathname.endsWith('/ssp-search.html')) link.setAttribute('aria-current', 'page');
    nav.prepend(link);
  }
  document.querySelectorAll('.skill-card').forEach(card => {
    const heading = card.querySelector('h3');
    if (heading && !card.id) card.id = 'skill-' + heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  });
  const actions = document.querySelector('.hero-actions');
  if (actions && document.querySelector('.skill-card')) {
    const catalogLink = document.createElement('a');
    catalogLink.href = 'ssp-search.html#skills';
    catalogLink.className = 'btn ghost';
    catalogLink.textContent = 'Browse all advisor skills';
    actions.appendChild(catalogLink);
  }
  const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target && target.classList.contains('skill-card')) {
    target.style.scrollMarginTop = '90px';
    target.scrollIntoView();
  }
  document.querySelectorAll('[data-scenario-entry]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const query = form.querySelector('textarea').value.trim();
      if (!query) return;
      try { sessionStorage.setItem('sspScenario', query); } catch {}
      location.href = 'ssp-search.html';
    });
  });
})();