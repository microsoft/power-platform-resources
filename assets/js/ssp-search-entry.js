(() => {
  const nav = document.getElementById('siteNav');
  if (nav && !nav.querySelector('a[href="ssp-search.html"]')) {
    const link = document.createElement('a');
    link.href = 'ssp-search.html';
    link.textContent = 'Resources';
    if (location.pathname.endsWith('/ssp-search.html')) link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
  const themeToggle = document.getElementById('themeBtn');
  if (themeToggle && !document.querySelector('.header-search')) {
    const searchLink = document.createElement('a');
    searchLink.href = 'ssp-search.html?focus=search';
    searchLink.className = 'icon-btn header-search';
    searchLink.setAttribute('aria-label', 'Search the Self-Service Portal');
    searchLink.title = 'Search';
    searchLink.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>';
    themeToggle.parentElement.insertBefore(searchLink, themeToggle);
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
    if (url.hostname === 'learn.microsoft.com') return null;
    if (url.href === 'https://microsoft.github.io/apps-agents-workshop/labs/' && link.closest('#siteNav')) return null;
    const clean = value => (value || '').replace(/\s+/g, ' ').trim();
    const plainText = value => clean(value)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1');
    const label = link.cloneNode(true);
    label.querySelectorAll('[aria-hidden="true"]').forEach(node => node.remove());
    let title = clean(link.dataset.previewTitle || label.textContent || link.getAttribute('aria-label') || link.querySelector('img')?.alt) || url.hostname;
    let summary = plainText(link.dataset.previewSummary || link.getAttribute('title'));
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
  const skillsAdvisorUrl = 'https://aka.ms/powerplatformskillsadvisor';
  const plainText = value => (value || '').replace(/\s+/g, ' ').trim()
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1');
  function staticSkillDetails(link) {
    const owner = link.dataset.skillOwner || (link.href === skillsAdvisorUrl ? 'non-power-cat' : '');
    if (!owner) return null;
    const card = link.closest('.skill-card, li');
    const clean = value => (value || '').replace(/\s+/g, ' ').trim();
    const title = clean(link.dataset.previewTitle || link.textContent);
    const context = clean(link.dataset.previewSummary || card?.querySelector('p')?.textContent || card?.textContent);
    return {
      type: 'Skill',
      products: [],
      purpose: context,
      status: 'See destination for availability',
      publisher: owner === 'power-cat' ? 'Power CAT' : 'Microsoft',
      marketplace: owner === 'power-cat' ? 'Power CAT Skills' : 'Skills Advisor catalog',
      canonicalSource: link.dataset.canonicalSource || link.href,
      route: owner === 'power-cat'
        ? 'Power CAT canonical source'
        : link.dataset.canonicalSource ? 'Canonical skill source' : 'Power Platform Skills Advisor',
      title
    };
  }
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
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'external-preview-close';
      close.setAttribute('aria-label', 'Close details');
      close.title = 'Close details';
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '\u00d7';
      close.append(icon);
      preview.prepend(close);
      const reason = document.createElement('p');
      reason.id = 'externalPreviewReason';
      preview.querySelector('#externalPreviewSummary').after(reason);
      const details = document.createElement('div');
      details.id = 'externalPreviewSkill';
      reason.after(details);
      preview.setAttribute('aria-describedby', 'externalPreviewSummary externalPreviewReason externalPreviewNote');
      continueLink = preview.querySelector('a');
      preview.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
        preview.close();
        sourceLink?.focus({ preventScroll: true });
      }));
      preview.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        preview.close();
      });
      continueLink.addEventListener('click', () => preview.close());
      preview.addEventListener('close', () => {
        document.dispatchEvent(new CustomEvent('ssp:preview-close'));
        sourceLink?.focus({ preventScroll: true });
      });
    }
    sourceLink = link;
    preview.querySelector('#externalPreviewTitle').textContent = resource.title;
    preview.querySelector('#externalPreviewSummary').textContent = resource.summary;
    const reason = link.dataset.previewReason || '';
    preview.querySelector('#externalPreviewReason').textContent = reason ? 'Why suggested: ' + reason : '';
    preview.querySelector('#externalPreviewReason').hidden = !reason;
    const skill = link.dataset.skillDetails ? JSON.parse(link.dataset.skillDetails) : staticSkillDetails(link);
    const lab = link.dataset.labDetails ? JSON.parse(link.dataset.labDetails) : null;
    const details = preview.querySelector('#externalPreviewSkill');
    details.replaceChildren();
    details.hidden = !skill && !lab;
    preview.querySelector('.external-preview-kicker').textContent = skill ? skill.type + ' details' : 'External resource';
    continueLink.textContent = skill
    ? (skill.route === 'Power CAT Skills Marketplace'
      ? 'Open marketplace details'
      : skill.route === 'Power CAT canonical source'
        ? 'Open Power CAT canonical source'
        : skill.route === 'Canonical skill source' ? 'Open canonical skill source' : 'Open Power Platform Skills Advisor')
    : 'Continue to site';
    if (lab) {
      preview.querySelector('.external-preview-kicker').textContent = 'Lab details';
      continueLink.textContent = 'Open lab';
    }
    if (skill || lab) {
      const metadata = document.createElement('dl');
      metadata.className = 'skill-detail-metadata';
      const fields = skill ? [
        ['Products', skill.products.join(', ')], ['Purpose', skill.purpose],
        ['Availability', skill.status], ['Publisher', skill.publisher], ['Catalog', skill.marketplace],
        ['Category', skill.category], ['Plugin', skill.plugin], ['Expected route', skill.route],
        ['License', skill.license], ['Snapshot imported', skill.verified],
        ['Skill source', skill.canonicalSource], ['Plugin documentation', skill.docsSource]
      ] : [
        ['Audience', lab.persona], ['Level', lab.level], ['Duration', lab.duration],
        ['Source', 'Microsoft Power Series'], ['License', lab.license], ['Catalog imported', lab.imported]
      ];
      for (const [label, value] of fields) {
        if (!value) continue;
        const term = document.createElement('dt');
        term.textContent = label;
        const description = document.createElement('dd');
        description.textContent = plainText(value);
        metadata.append(term, description);
      }
      details.append(metadata);
      for (const [label, value] of (skill ? [
        ['What it does', skill.what],
        ['When to use it', skill.when],
        ['How it works', skill.how],
        ['Usage', skill.note],
        ['Suggested prompt', skill.prompt]
      ] : [])) {
        if (!value) continue;
        const heading = document.createElement('h3');
        heading.textContent = label;
        details.append(heading);
        if (Array.isArray(value)) {
          const list = document.createElement('ul');
          value.forEach(item => {
            const row = document.createElement('li');
            row.textContent = plainText(item);
            list.append(row);
          });
          details.append(list);
        } else {
          const paragraph = document.createElement('p');
          paragraph.textContent = plainText(value);
          details.append(paragraph);
        }
      }
      if (skill?.install) {
        const heading = document.createElement('h3');
        heading.textContent = 'Install command';
        const code = document.createElement('code');
        code.textContent = skill.install;
        const pre = document.createElement('pre');
        pre.append(code);
        details.append(heading, pre);
      }
      const caveat = document.createElement('p');
      caveat.textContent = skill
        ? 'Opens published instructions, not a running skill. Review prerequisites and access requirements in the source before using it in a compatible host.'
        : 'Review the prerequisites and required environment in the published lab before starting. Duration is the estimate provided by the workshop authors.';
      details.append(caveat);
    }
    const destination = skill?.route === 'Power Platform Skills Advisor' ? skillsAdvisorUrl : resource.url.href;
    preview.querySelector('#externalPreviewDestination').textContent = destination;
    const target = link.getAttribute('target');
    const opensNewTab = newTab || (target && !['_self', '_top', '_parent'].includes(target.toLowerCase()));
    preview.querySelector('#externalPreviewNote').textContent = opensNewTab ? 'Opens on another site in a new tab.' : 'Opens on another site in this tab.';
    continueLink.href = destination;
    continueLink.target = opensNewTab ? '_blank' : '_self';
    preview.showModal();
    document.dispatchEvent(new CustomEvent('ssp:preview-open', { detail: { url: link.href } }));
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