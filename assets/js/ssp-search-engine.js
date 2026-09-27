(function (root) {
  const stopWords = new Set('a an and are as at be been can do does for from get had has have how i if in into is it its me my need of on or our should so that the their them there these they this to us want was we what when where which with would you your'.split(' '));
  const normalize = value => String(value || '').toLowerCase()
    .replace(/\bpowerapps\b/g, 'power apps').replace(/\bpowerautomate\b/g, 'power automate')
    .replace(/\bpowerpages\b/g, 'power pages').replace(/\bpowerbi\b/g, 'power bi')
    .replace(/\b(datavers|datavese)\b/g, 'dataverse').replace(/\b(automte|automatee)\b/g, 'automate')
    .replace(/[^a-z0-9]+/g, ' ').replace(/\b(log in|log on|sign in|sign on|login)\b/g, 'signin').trim();
  const wordForms = { apps: 'app', applications: 'app', application: 'app', flows: 'flow', approvals: 'approval', environments: 'environment', pipelines: 'pipeline', agents: 'agent', customers: 'customer', websites: 'website', costs: 'cost', roles: 'role', permissions: 'permission', policies: 'policy' };
  const tokens = value => [...new Set(normalize(value).split(/\s+/).map(word => wordForms[word] || word).filter(word => word.length > 1 && !stopWords.has(word)))];
  const queryFillers = new Set('please help make build create reduce use using customer people team business cannot cant forgot'.split(' '));
  const aliases = {
    slow: ['performance', 'delegation', 'monitor'], lag: ['performance'], speed: ['performance'],
    failing: ['troubleshoot', 'failures', 'error'], broken: ['troubleshoot', 'failures'], failed: ['failures', 'troubleshoot'],
    approval: ['approvals'], automate: ['automation', 'flow'], flows: ['flow'], apps: ['app'],
    rollout: ['governance', 'environment', 'alm'], company: ['enterprise'], environments: ['environment'],
    permission: ['security', 'access', 'role'], secure: ['security'], policy: ['dlp'],
    deploy: ['deployment', 'pipeline', 'alm'], pipelines: ['pipeline'], migrate: ['migration', 'modernize'],
    beginner: ['training', 'started'], certification: ['certifications', 'credentials'], agent: ['copilot'],
    website: ['site', 'portal'], site: ['website', 'portal'], portal: ['website', 'site'],
    licensing: ['license', 'pricing', 'cost', 'budget'], cost: ['licensing', 'license', 'pricing', 'budget'],
    pricing: ['licensing', 'license', 'cost', 'budget'], signin: ['authentication', 'password'],
    performant: ['performance'], performance: ['slow', 'performant', 'latency', 'bottleneck']
  };
  function productScope(query) {
    return normalize(query).match(/\b(model driven|canvas|power apps|power automate|power pages|power bi|copilot studio)\b/)?.[0] || null;
  }
  function searchWords(query) {
    const primary = /\b(slow|slowness|performance|lag|bottleneck)\b/i.test(query) ? query.split(/\bshould\b/i)[0] : query;
    const words = tokens(primary);
    const meaningful = words.filter(word => !queryFillers.has(word));
    return meaningful.length ? meaningful : words;
  }
  const scenarios = [
    {
      id: 'performance', test: /\b(slow|slowness|performance|delegation|lag|bottleneck)\b/i,
      title: 'Diagnose before you redesign',
      why: 'Your scenario mentions performance. Start with evidence about the bottleneck before deciding to migrate data or rebuild the app.',
      steps: [
        { title: 'Find the bottleneck', query: 'performance delegation monitor', why: 'Check traces, delegation, and representative user scenarios.', type: 'Skill' },
        { title: 'Check the relevant implementation guidance', query: 'create performant apps', why: 'Compare the implementation with documented app performance practices.', type: 'Resource' },
        { title: 'Evaluate a data change only if needed', query: 'Dataverse Data Model Designer', why: 'Use confirmed requirements to assess a different data model.', type: 'Skill' }
      ]
    },
    {
      id: 'troubleshoot', test: /\b(fail\w*|broken|error|troubleshoot)\b/i,
      title: 'Investigate the failure first',
      why: 'Your scenario describes a failure. Troubleshooting guidance is a better starting point than creating a replacement solution.',
      steps: [
        { title: 'Inspect the failure', query: 'troubleshoot cloud flow failures', why: 'Identify the failing action and collect a sanitized run history.', type: 'Resource' },
        { title: 'Harden the implementation', query: 'flow automation error handling', why: 'Review validation, retries, and failure handling.', type: 'Skill' }
      ]
    },
    {
      id: 'governance', test: /\b(govern\w*|dlp|enterprise|rollout|tenant)\b|across (the |our )?(company|organization)|roll\s+out/i,
      title: 'Set the guardrails before you scale',
      why: 'Your scenario involves governance or wider rollout. Establish ownership, environment boundaries, and access before expanding delivery.',
      steps: [
        { title: 'Plan your environments', query: 'Environment Strategy Blueprint', why: 'Define environment purpose, ownership, and DLP boundaries.', type: 'Skill' },
        { title: 'Map the access model', query: 'Security Role Mapper', why: 'Align personas and responsibilities with least-privilege access.', type: 'Skill' },
        { title: 'Plan controlled delivery', query: 'ALM Topology Planner', why: 'Decide deployment paths and release responsibilities.', type: 'Skill' }
      ]
    },
    {
      id: 'security', test: /\b(security|secure|permissions|access|pii|privacy)\b/i,
      title: 'Check access and sensitive data',
      why: 'Your scenario mentions security or access. Start with a focused assessment and use sanitized evidence, not customer records or credentials.',
      steps: [
        { title: 'Assess security risks', query: 'Solution Security Review', why: 'Identify security findings and remediation priorities.', type: 'Skill' },
        { title: 'Define least-privilege access', query: 'Security Role Mapper', why: 'Document which roles need which operations and records.', type: 'Skill' }
      ]
    },
    {
      id: 'automation', test: /\b(approval\w*|automat\w*|flow\w*)\b/i,
      title: 'Start with one working automation',
      why: 'Your scenario involves automation. Define the trigger, decisions, and exception path before expanding the workflow.',
      steps: [
        { title: 'Build the first useful flow', query: 'cloud flow automation', why: 'Turn the workflow into a testable implementation.', type: 'Skill' },
        { title: 'Check triggers and approvals', query: 'approvals triggers cloud flow', why: 'Use documented patterns for the actions the process needs.', type: 'Resource' }
      ]
    },
    {
      id: 'learn', test: /\b(learn\w*|beginner|training|certif\w*|lab\w*)\b/i,
      title: 'Choose a practical learning starting point',
      why: 'Your scenario is about learning. Start with the relevant training material, then apply it in a hands-on exercise.',
      steps: [
        { title: 'Find the relevant training', query: 'Power Platform training hub', why: 'Choose a path that matches your current experience.', type: 'Resource' },
        { title: 'Practice with hands-on labs', query: 'Power Series hands-on labs', why: 'Apply the concepts in a guided exercise.', type: 'Learning' }
      ]
    }
  ];

  function rank(entries, query, { partial = false } = {}) {
    const words = searchWords(query);
    if (!words.length) return [];
    const scope = productScope(query);
    const customerWebsite = /\b(website|site|portal)\b/.test(normalize(query)) && /\b(customers?|external|public)\b/.test(normalize(query));
    const expanded = [...new Set(words.flatMap(word => aliases[word] || []))];
    const documents = entries.map(entry => ({ entry, title: new Set(tokens(entry.title)), text: new Set(tokens((entry.text || '') + ' ' + (entry.category || ''))), context: normalize([entry.title, entry.text, entry.category, entry.url].filter(Boolean).join(' ')) }));
    const weight = new Map([...words, ...expanded].map(word => [word, 1 + Math.log(1 + entries.length / (1 + documents.filter(doc => doc.title.has(word) || doc.text.has(word)).length))]));
    return documents.map(({ entry, title, text, context }) => {
      const exact = normalize(entry.title) === normalize(query);
      const covers = word => [word, ...(aliases[word] || [])].some(term => title.has(term) || text.has(term));
      if (customerWebsite && !/\bpower pages\b/.test(context)) return { ...entry, score: 0 };
      if (!exact && ((!partial && !words.every(covers)) || (scope && !context.includes(scope)))) return { ...entry, score: 0 };
      if (/\b(cannot|can t|unable|failed|error|forgot)\b/.test(normalize(query)) && words.includes('signin') && !/\b(troubleshoot|error|failure|failed|password|support|issue|issues)\b/.test(context)) return { ...entry, score: 0 };
      const matched = words.filter(word => title.has(word) || text.has(word));
      const synonyms = expanded.filter(word => title.has(word) || text.has(word));
      let score = matched.reduce((total, word) => total + (title.has(word) ? 8 : 2) * weight.get(word), 0);
      score += synonyms.reduce((total, word) => total + (title.has(word) ? 6 : 2) * weight.get(word), 0);
      if (exact) score += 40;
      score += matched.length * 2;
      return { ...entry, score, matched: [...new Set([...matched, ...synonyms])] };
    }).filter(entry => entry.score > 0).sort((first, second) => second.score - first.score || first.title.localeCompare(second.title));
  }

  function relaxedRank(entries, query) {
    if (searchWords(query).length < 2) return { terms: [], results: [] };
    const results = rank(entries, query, { partial: true });
    if (!results.length) return { terms: [], results: [] };
    const details = matchDetails(results[0], query);
    const terms = [...details.keywords, ...details.related.map(item => item.keyword)];
    return { terms, results };
  }

  function matchDetails(entry, query) {
    const words = searchWords(query);
    const evidence = new Set(tokens([entry.title, entry.text, entry.category].filter(Boolean).join(' ')));
    const keywords = [];
    const related = [];
    const missing = [];
    words.forEach(word => {
      if (evidence.has(word)) keywords.push(word);
      else {
        const match = (aliases[word] || []).find(alias => evidence.has(alias));
        if (match) related.push({ keyword: word, match });
        else missing.push(word);
      }
    });
    return {
      percent: words.length ? Math.round(100 * (keywords.length + related.length * .5) / words.length) : null,
      keywords, related, missing
    };
  }

  function explain(entry, query) {
    if (entry.recommendationReason) return entry.recommendationReason;
    const match = matchDetails(entry, query);
    if (match.percent === null) return '';
    const reasons = [];
    if (normalize(entry.title) === normalize(query)) reasons.push('Its title matches your search.');
    else if (match.keywords.length) reasons.push(`Its title or catalog description covers ${match.keywords.map(word => `"${word}"`).join(', ')} from your search.`);
    if (match.related.length) reasons.push('Related topics: ' + match.related.map(item => `"${item.keyword}" relates to "${item.match}"`).join('; ') + '.');
    return reasons.join(' ');
  }

  function guidance(entries, query) {
    const scenario = scenarios.find(item => item.test.test(normalize(query)));
    if (!scenario) return null;
    const scope = productScope(query);
    if (scenario.id === 'performance' && scope && !['canvas', 'power apps'].includes(scope)) return null;
    if (scenario.id === 'troubleshoot' && scope && scope !== 'power automate') return null;
    const used = new Set();
    const steps = scenario.steps.map(step => {
      const result = rank(entries.filter(entry => (entry.type === step.type || (step.type === 'Skill' && entry.type === 'Guide')) && !used.has(entry.url)), step.query, { partial: true })[0];
      if (!result) return null;
      used.add(result.url);
      return { ...step, result };
    }).filter(Boolean);
    return steps.length ? { ...scenario, steps } : null;
  }

  const journeys = [
    { id: 'learn', label: "I'm new to Power Platform", question: 'Choose a learning path', intro: 'Compare the main starting points here. You do not need to choose a product before you understand the platform or try a guided exercise.', options: [
      { id: 'overview', label: 'Understand what it can do', title: 'Get to know Power Platform', why: 'Follow one short route that explains the platform, introduces the catalog terms, and ends with a working automation.', bestFor: 'People evaluating the platform or deciding where an idea belongs.', outcome: 'A working approval flow and enough context to choose a next product path.', action: 'Start the recommended beginner route', url: '#beginner-route', related: ['products'] },
      { id: 'practice', label: 'Try a hands-on exercise', title: 'Build an approval flow in a guided lab', why: 'Start with a specific 45-minute foundation lab instead of browsing the complete training directory.', bestFor: 'Makers who learn by following a complete scenario and have access to a Power Platform environment.', outcome: 'A working automated approval process built with a Power Automate cloud flow.', destination: 'Power Series lab / 45 minutes / opens with prerequisites and guided steps.', action: 'Start the cloud flow foundation lab', url: 'https://microsoft.github.io/apps-agents-workshop/labs/lab.html?path=automation-01-cloud-flow%2F01-cloud-flow.md&branch=main', related: ['building'] },
      { id: 'unsure', label: "I'm not sure", title: 'Start with the recommended route', why: 'Use a product-neutral introduction before completing one bounded hands-on exercise.', bestFor: 'Anyone who needs vocabulary, examples, and a low-pressure starting point.', outcome: 'Enough context to select a product, skill, or coached Build journey.', action: 'Start the recommended beginner route', url: '#beginner-route', related: ['products'] }
    ] },
    { id: 'build', label: 'I want to build something', question: 'Choose what you want to make', intro: 'Start from the outcome, not the technology. Each path explains the first useful increment and then introduces the relevant Power Platform experience.', options: [
      { id: 'app', label: 'An app for my team', title: 'Create a usable app increment', why: 'Frame one user task, choose the lightest-fit app experience, and build a testable end-to-end slice.', bestFor: 'Team tasks that need tailored screens, structured records, or a custom experience.', outcome: 'A demonstrated first increment and a clear choice among Canvas, model-driven, code app, or generative page.', action: 'Start the coached app journey', url: 'ssp-build-guide.html#create-app', related: ['building', 'architecture-guidance'] },
      { id: 'flow', label: 'An automated task or approval', title: 'Automate one repeatable process', why: 'Define the trigger, result, and exception owner before choosing a cloud or desktop flow.', bestFor: 'Repeatable work, approvals, system handoffs, and attended desktop tasks.', outcome: 'A tested success path, visible failure handling, and an owned recovery process.', action: 'Start the automation journey', url: 'ssp-build-guide.html#automate-process', related: ['building'] },
      { id: 'site', label: 'A website', title: 'Build a code-first Power Pages site', why: 'Use a focused lab to create a Power Pages website, connect it to Dataverse, and see the complete external-experience path.', bestFor: 'Pro-code developers and Power Apps makers who can use GitHub Copilot.', outcome: 'A working code-first website connected to Dataverse.', destination: 'Power Series lab / 40 minutes / opens with prerequisites and guided steps.', action: 'Start the Power Pages lab', url: 'https://microsoft.github.io/apps-agents-workshop/labs/lab.html?path=byoc-powerpages%2Fbyoc-powerpages.md&branch=main', related: ['architecture-guidance'] },
      { id: 'agent', label: 'An AI assistant or agent', title: 'Build a supervised agent experience', why: 'Use a Level 100 lab to automate an app task while keeping human review and approval in the loop.', bestFor: 'Information workers who want a bounded first agent scenario.', outcome: 'A working supervised-agent scenario with a concrete human-review path.', destination: 'Power Series lab / 1 hour / opens with prerequisites and guided steps.', action: 'Start the supervised agents lab', url: 'https://microsoft.github.io/apps-agents-workshop/labs/lab.html?path=powerapps-mcp%2Fpower-apps-mcp-server-agents-and-agent-feed.md&branch=main', related: ['building'] },
      { id: 'unsure', label: "I'm not sure which tool to use", title: 'Compare experiences by user outcome', why: 'Review the available product surfaces, then use the coached Build journeys when the intended task is clearer.', bestFor: 'Early ideas where the user, interaction, or automation boundary is still uncertain.', outcome: 'A short list of suitable experiences and a better-defined first increment.', action: 'Compare Power Platform products', url: '#products', related: ['architecture-guidance'] }
    ] },
    { id: 'fix', label: "Something isn't working", question: 'Start with the symptom you can verify', intro: 'Use the closest symptom to gather evidence before rebuilding or changing architecture. Each path identifies what to inspect and what a useful diagnosis should produce.', options: [
      { id: 'slow', label: 'My app is slow', title: 'Check app performance before rebuilding', why: 'For canvas apps, inspect queries, loading, delegation, and representative user scenarios before changing the design.', bestFor: 'Slow loading, delayed interaction, excessive calls, or performance that varies by data volume.', outcome: 'Evidence of the bottleneck and a prioritized set of fixes to test.', action: 'Check canvas app performance', url: 'https://learn.microsoft.com/power-apps/maker/canvas-apps/create-performant-apps-overview', related: ['products'] },
      { id: 'app', label: 'My app has an error', title: 'Find the matching app issue', why: 'Compare the observed error and reproduction steps with known Power Apps problems before attempting a broad workaround.', bestFor: 'Repeatable maker or runtime errors with a known message or affected action.', outcome: 'A confirmed issue category, reproduction evidence, and the safest documented resolution.', action: 'Troubleshoot Power Apps', url: 'https://learn.microsoft.com/troubleshoot/power-platform/power-apps/create-and-use-apps/common-issues-and-resolutions', related: ['products'] },
      { id: 'flow', label: 'My automation or approval is failing', title: 'Inspect the failing flow step', why: 'Use sanitized run history to locate the failing action and understand its input, output, retry, and exception behavior.', bestFor: 'Failed, timed-out, skipped, or repeatedly retried cloud-flow actions.', outcome: 'The failing boundary, its likely cause, and a testable correction or recovery path.', action: 'Troubleshoot a cloud flow', url: 'https://learn.microsoft.com/power-automate/fix-flow-failures', related: ['building'] },
      { id: 'unsure', label: 'Something else / I am not sure', title: 'Find the correct support path', why: 'Identify the affected product and capture the symptom, time, user impact, and reproducible steps before seeking support.', bestFor: 'Issues that do not fit the common app-performance, app-error, or flow-failure paths.', outcome: 'A useful support description and the correct product documentation or community destination.', action: 'Find product support', url: '#products', related: ['community'] }
    ] },
    { id: 'review', label: 'I want to check my solution', question: 'Choose the evidence you want from a review', intro: 'Select the scope that matches what you can provide. SSP explains the expected sanitized input and output before sending you to a canonical review tool or framework.', options: [
      { id: 'solution', label: 'The overall solution', title: 'Review the solution across five pillars', why: 'Assess reliability, security, operational excellence, performance efficiency, and experience optimization together.', bestFor: 'Architecture proposals or implemented solutions that need a prioritized cross-cutting review.', outcome: 'Evidence-based findings, risks, and recommended next actions organized by architectural pillar.', action: 'Explore solution review guidance', url: 'ssp-review.html#skills', related: ['architecture-guidance'] },
      { id: 'flows', label: 'Power Automate workflows', title: 'Inspect your workflows with OverFlow', why: 'Bring a sanitized solution ZIP to view its workflows together and optionally overlay an existing findings JSON.', bestFor: 'Comparing workflow structure, actions, dependencies, and existing review findings.', outcome: 'A consolidated browser view of the workflows and any supplied findings.', action: 'Review the OverFlow option', url: 'ssp-review.html#skills', related: ['building'] },
      { id: 'pages', label: 'A Power Pages website', title: 'Inspect your site with OverPage', why: 'Bring a sanitized solution or site export ZIP; existing findings and network captures are optional.', bestFor: 'Reviewing Power Pages structure, code, preview behavior, and network evidence.', outcome: 'A focused site review in the canonical OverPage viewer with optional evidence overlays.', action: 'Review the OverPage option', url: 'ssp-review.html#skills', related: ['architecture-guidance'] },
      { id: 'unsure', label: "I'm not sure", title: 'Compare review scopes', why: 'Use the Review pillar to compare architecture, security, performance, and tool-assisted quality reviews.', bestFor: 'Solutions where the highest-risk review area is not yet clear.', outcome: 'A selected review scope, required evidence, and an appropriate review destination.', action: 'Compare review options', url: 'ssp-review.html#skills', related: ['architecture-guidance'] }
    ] },
    { id: 'scale', label: "I'm bringing this to more people", question: 'Choose the rollout risk to address first', intro: 'Growth is not only a deployment task. Compare adoption, access, and platform-management paths before expanding to more users, teams, or environments.', options: [
      { id: 'people', label: 'Help people adopt it', title: 'Plan adoption alongside delivery', why: 'Prepare ownership, communication, training, support, and feedback for the people who will use the solution.', bestFor: 'Solutions that work technically but need coordinated onboarding and sustained use.', outcome: 'Named owners, audience-specific communication, training, support, and success measures.', action: 'Explore adoption guidance', url: '#adoption', related: ['training'] },
      { id: 'access', label: 'Access and sensitive information', title: 'Review security before expanding access', why: 'Recheck identities, permissions, sharing, connectors, and data protection for the wider audience.', bestFor: 'New user groups, external access, sensitive data, or broader connector use.', outcome: 'A documented access model and prioritized security or data-protection changes.', action: 'Explore security guidance', url: '#governance', related: ['architecture-guidance'] },
      { id: 'unsure', label: 'The rollout plan / I am not sure', title: 'Set up ownership and guardrails', why: 'Plan environments, administration, governance, release controls, and support before expanding across teams.', bestFor: 'Broader rollouts where platform ownership or the environment path is unclear.', outcome: 'A rollout checklist covering ownership, environments, controls, release, support, and adoption.', action: 'Plan a wider rollout', url: '#governance', related: ['adoption', 'architecture-guidance'] }
    ] }
  ];

  function nextStep(goalId, answerId) {
    return journeys.find(journey => journey.id === goalId)?.options.find(option => option.id === answerId) || null;
  }

  const api = { rank, relaxedRank, guidance, explain, matchDetails, tokens, journeys, nextStep };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SSPSearch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);