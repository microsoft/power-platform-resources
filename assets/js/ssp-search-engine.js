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
    { id: 'learn', label: "I'm new to Power Platform", question: 'Where would you like to begin?', options: [
      { id: 'overview', label: 'Understand what it can do', title: 'Get to know Power Platform', why: 'Explore the products and the kinds of work they can help with before choosing one.', action: 'Explore Power Platform', url: 'https://powerplatform.com', related: ['training'] },
      { id: 'practice', label: 'Try a hands-on exercise', title: 'Build alongside a guided lab', why: 'Choose an exercise and follow the steps at your own pace.', action: 'Choose a hands-on lab', url: 'https://microsoft.github.io/apps-agents-workshop/labs/', related: ['training'] },
      { id: 'unsure', label: "I'm not sure", title: 'Start with the basics', why: 'Begin with introductory training before deciding which product to use.', action: 'Open beginner training', url: 'https://learn.microsoft.com/training/powerplatform/', related: ['get-started'] }
    ] },
    { id: 'build', label: 'I want to build something', question: 'What would you like to create?', options: [
      { id: 'app', label: 'An app for my team', title: 'Turn your idea into a plan', why: 'Describe the business problem and identify the people, data, and steps your app needs.', action: 'Plan your first solution', url: 'https://learn.microsoft.com/power-apps/maker/plan-designer/create-plan', related: ['building', 'architecture-guidance'] },
      { id: 'flow', label: 'An automated task or approval', title: 'Create your first automation', why: 'Start with one trigger and a small, testable task before adding more steps.', action: 'Start with Power Automate', url: 'https://learn.microsoft.com/power-automate/getting-started', related: ['building'] },
      { id: 'site', label: 'A website', title: 'Create a Power Pages site', why: 'Start with site creation, then plan the information and access your visitors need.', action: 'Create your first site', url: 'https://learn.microsoft.com/power-pages/getting-started/create-manage', related: ['building'] },
      { id: 'agent', label: 'An AI assistant or agent', title: 'Start with Copilot Studio', why: 'Explore how to build an agent before connecting it to your business information.', action: 'Open Copilot Studio guidance', url: 'https://learn.microsoft.com/microsoft-copilot-studio/', related: ['ai-copilot'] },
      { id: 'unsure', label: "I'm not sure which tool to use", title: 'Compare the available products', why: 'Match what you need to accomplish to a product before you start building.', action: 'Compare Power Platform products', url: '#products', related: ['architecture-guidance'] }
    ] },
    { id: 'fix', label: "Something isn't working", question: 'What needs help?', options: [
      { id: 'slow', label: 'My app is slow', title: 'Check app performance before rebuilding', why: 'For canvas apps, check queries, loading, and other bottlenecks. For other app types, start with the product support links below.', action: 'Check canvas app performance', url: 'https://learn.microsoft.com/power-apps/maker/canvas-apps/create-performant-apps-overview', related: ['products'] },
      { id: 'app', label: 'My app has an error', title: 'Find the matching app issue', why: 'Start with known Power Apps problems and their documented resolutions.', action: 'Troubleshoot Power Apps', url: 'https://learn.microsoft.com/troubleshoot/power-platform/power-apps/create-and-use-apps/common-issues-and-resolutions', related: ['products'] },
      { id: 'flow', label: 'My automation or approval is failing', title: 'Inspect the failing flow step', why: 'Use the run history to locate the failure before changing or replacing the automation.', action: 'Troubleshoot a cloud flow', url: 'https://learn.microsoft.com/power-automate/fix-flow-failures', related: ['building'] },
      { id: 'unsure', label: 'Something else / I am not sure', title: 'Find help for your product', why: 'Choose the product you use to reach its documentation, community, and support options.', action: 'Find product support', url: '#products', related: ['community'] }
    ] },
    { id: 'review', label: 'I want to check my solution', question: 'What would you like to check?', options: [
      { id: 'solution', label: 'The overall solution', title: 'Check your design against established practices', why: 'Review reliability, security, performance, operations, and the user experience.', action: 'Open the solution review framework', url: 'https://aka.ms/powa', related: ['architecture-guidance'] },
      { id: 'flows', label: 'Power Automate workflows', title: 'Inspect your workflows with OverFlow', why: 'Bring a sanitized solution ZIP. You can view its workflows together and optionally add an existing findings JSON.', action: 'Open PowerCAT OverFlow', url: 'https://microsoft.github.io/power-cat-skills/PowerCAT-Overflow.html', related: ['building'] },
      { id: 'pages', label: 'A Power Pages website', title: 'Inspect your site with OverPage', why: 'Bring a sanitized solution or site export ZIP. Existing findings and network captures are optional.', action: 'Open PowerCAT OverPage', url: 'https://microsoft.github.io/power-cat-skills/PowerCAT-OverPage.html', related: ['architecture-guidance'] },
      { id: 'unsure', label: "I'm not sure", title: 'Choose the right kind of review', why: 'Compare architecture, security, performance, and quality reviews for your solution.', action: 'Explore review options', url: 'ssp-review.html#skills', related: ['architecture-guidance'] }
    ] },
    { id: 'scale', label: "I'm bringing this to more people", question: 'What do you need to prepare?', options: [
      { id: 'people', label: 'Help people adopt it', title: 'Plan adoption alongside delivery', why: 'Prepare ownership, communication, training, and support for the people who will use the solution.', action: 'Explore adoption guidance', url: '#adoption', related: ['training'] },
      { id: 'access', label: 'Access and sensitive information', title: 'Review security before expanding access', why: 'Check how identities, permissions, and data protection apply to the wider audience.', action: 'Review Power Platform security', url: 'https://learn.microsoft.com/power-platform/admin/security/security-overview', related: ['governance'] },
      { id: 'unsure', label: 'The rollout plan / I am not sure', title: 'Set up ownership and guardrails', why: 'Plan environments, administration, and governance before expanding across teams.', action: 'Plan a wider rollout', url: '#governance', related: ['adoption', 'architecture-guidance'] }
    ] }
  ];

  function nextStep(goalId, answerId) {
    return journeys.find(journey => journey.id === goalId)?.options.find(option => option.id === answerId) || null;
  }

  const api = { rank, guidance, tokens, journeys, nextStep };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SSPSearch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);