(() => {
  const nav = document.getElementById('siteNav');
  if (nav && !nav.querySelector('a[href="ssp-search.html"]')) {
    const link = document.createElement('a');
    link.href = 'ssp-search.html';
    link.textContent = 'Resources';
    if (location.pathname.endsWith('/ssp-search.html')) link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
  const learnLink = nav?.querySelector('a[href="https://microsoft.github.io/apps-agents-workshop/labs/"]');
  if (learnLink) {
    learnLink.target = '_blank';
    learnLink.rel = 'noopener noreferrer';
    learnLink.title = 'Learn (opens in a new tab)';
    learnLink.setAttribute('aria-label', 'Learn (opens in a new tab)');
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = ' \u2197';
    learnLink.append(icon);
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
})();

(() => {
  function describeExternalLink(link) {
    const url = new URL(link.href, location.href);
    if (!['https:', 'http:'].includes(url.protocol) || url.origin === location.origin || link.hasAttribute('download')) return null;
    if (url.href === 'https://microsoft.github.io/apps-agents-workshop/labs/' && link.closest('#siteNav')) return null;
    const clean = value => (value || '').replace(/\s+/g, ' ').trim();
    const label = link.cloneNode(true);
    label.querySelectorAll('[aria-hidden="true"]').forEach(node => node.remove());
    let title = clean(link.dataset.previewTitle || label.textContent || link.getAttribute('aria-label') || link.querySelector('img')?.alt) || url.hostname;
    let summary = clean(link.dataset.previewSummary || link.getAttribute('title'));
    if (url.hostname === 'microsoft.github.io' && ['/apps-agents-workshop/labs/', '/apps-agents-workshop/labs/index.html'].includes(url.pathname)) {
      title = 'Power Series hands-on labs';
      summary ||= 'Explore hands-on labs for learning and practicing with Power Platform.';
    }
    if (url.hostname === 'github.com' && url.pathname.endsWith('/issues/new')) {
      summary ||= 'Open a GitHub issue to share feedback, describe a problem, or suggest a change. GitHub sign-in may be required to submit it.';
    }
    const row = link.closest('li');
    if (!summary && row) {
      const context = row.cloneNode(true);
      context.querySelectorAll('ul, ol, a, [aria-hidden="true"]').forEach(node => node.remove());
      const description = clean(context.textContent).replace(/^[-:;,\s]+|[-:;,\s]+$/g, '');
      if (/[a-zA-Z]{3}/.test(description)) summary = description;
    }
    if (!summary && url.hostname === 'aka.ms' && url.pathname.toLowerCase() === '/powerplatformskillsadvisor') {
      summary = 'Browse the published Power Platform Skills Advisor catalog. This link opens the catalog, not an individual guide.';
    }
    if (!summary) {
      const source = url.hostname === 'learn.microsoft.com' ? 'Microsoft Learn resource'
        : url.hostname === 'github.com' ? 'GitHub resource'
        : /(^|\.)youtube\.com$/.test(url.hostname) || url.hostname === 'youtu.be' ? 'Video resource'
        : 'External resource';
      summary = `${source}: ${title}. No additional summary is available in this site's listing.`;
    }
    return { title, summary, url };
  }

  let preview;
  let sourceLink;
  let continueLink;
  function openPreview(link, newTab) {
    const resource = describeExternalLink(link);
    if (!resource) return false;
    if (!preview) {
      preview = document.createElement('dialog');
      preview.className = 'external-preview';
      preview.setAttribute('aria-labelledby', 'externalPreviewTitle');
      preview.setAttribute('aria-describedby', 'externalPreviewSummary externalPreviewNote');
      preview.innerHTML = '<p class="external-preview-kicker">External resource</p><h2 id="externalPreviewTitle"></h2><p id="externalPreviewSummary"></p><div class="external-preview-destination"><strong>Destination</strong><p id="externalPreviewDestination"></p></div><p id="externalPreviewNote"></p><div class="external-preview-actions"><button type="button" class="btn ghost" autofocus>Stay here</button><a class="btn" rel="noopener noreferrer">Continue to site</a></div>';
      document.body.appendChild(preview);
      const reason = document.createElement('p');
      reason.id = 'externalPreviewReason';
      preview.querySelector('#externalPreviewSummary').after(reason);
      preview.setAttribute('aria-describedby', 'externalPreviewSummary externalPreviewReason externalPreviewNote');
      continueLink = preview.querySelector('a');
      preview.querySelector('button').addEventListener('click', () => preview.close());
      continueLink.addEventListener('click', () => preview.close());
      preview.addEventListener('close', () => sourceLink?.focus({ preventScroll: true }));
    }
    sourceLink = link;
    preview.querySelector('#externalPreviewTitle').textContent = resource.title;
    preview.querySelector('#externalPreviewSummary').textContent = resource.summary;
    const reason = link.dataset.previewReason || '';
    preview.querySelector('#externalPreviewReason').textContent = reason ? 'Why suggested: ' + reason : '';
    preview.querySelector('#externalPreviewReason').hidden = !reason;
    preview.querySelector('#externalPreviewDestination').textContent = resource.url.href;
    const target = link.getAttribute('target');
    const opensNewTab = newTab || (target && !['_self', '_top', '_parent'].includes(target.toLowerCase()));
    preview.querySelector('#externalPreviewNote').textContent = opensNewTab ? 'Opens on another site in a new tab.' : 'Opens on another site in this tab.';
    continueLink.href = resource.url.href;
    continueLink.target = opensNewTab ? '_blank' : '_self';
    preview.showModal();
    preview.querySelector('button').focus();
    return true;
  }

  function intercept(event) {
    if (event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
    const link = event.target.closest?.('a[href]');
    if (!link || preview?.contains(link)) return;
    if (openPreview(link, event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1)) event.preventDefault();
  }
  document.addEventListener('click', intercept);
  document.addEventListener('auxclick', intercept);
})();