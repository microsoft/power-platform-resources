(function (root) {
  const stopWords = new Set('a an and are as at be been can do does for from get had has have how i if in into is it its me my need of on or our should so that the their them there these they this to us want was we what when where which with would you your'.split(' '));
  const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const tokens = value => [...new Set(normalize(value).split(/\s+/).filter(word => word.length > 1 && !stopWords.has(word)))];
  const aliases = {
    slow: ['performance', 'delegation', 'monitor'], lag: ['performance'], speed: ['performance'],
    failing: ['troubleshoot', 'failures', 'error'], broken: ['troubleshoot', 'failures'], failed: ['failures', 'troubleshoot'],
    approval: ['approvals'], automate: ['automation', 'flow'], flows: ['flow'], apps: ['app'],
    rollout: ['governance', 'environment', 'alm'], company: ['enterprise'], environments: ['environment'],
    permissions: ['security', 'access', 'role'], secure: ['security'], policies: ['policy', 'dlp'],
    deploy: ['deployment', 'pipeline', 'alm'], pipelines: ['pipeline'], migrate: ['migration', 'modernize'],
    beginner: ['training', 'started'], certification: ['certifications', 'credentials'], agents: ['agent', 'copilot']
  };
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

  function rank(entries, query) {
    const words = tokens(query);
    if (!words.length) return [];
    const expanded = [...new Set(words.flatMap(word => aliases[word] || []))];
    const documents = entries.map(entry => ({ entry, title: new Set(tokens(entry.title)), text: new Set(tokens(entry.text + ' ' + entry.category)) }));
    const weight = new Map([...words, ...expanded].map(word => [word, 1 + Math.log(1 + entries.length / (1 + documents.filter(doc => doc.title.has(word) || doc.text.has(word)).length))]));
    return documents.map(({ entry, title, text }) => {
      const matched = words.filter(word => title.has(word) || text.has(word));
      const synonyms = expanded.filter(word => title.has(word) || text.has(word));
      let score = matched.reduce((total, word) => total + (title.has(word) ? 8 : 2) * weight.get(word), 0);
      score += synonyms.reduce((total, word) => total + (title.has(word) ? 6 : 2) * weight.get(word), 0);
      if (normalize(entry.title) === normalize(query)) score += 40;
      score += matched.length * 2;
      return { ...entry, score, matched: [...new Set([...matched, ...synonyms])] };
    }).filter(entry => entry.score > 0).sort((first, second) => second.score - first.score || first.title.localeCompare(second.title));
  }

  function guidance(entries, query) {
    const scenario = scenarios.find(item => item.test.test(query));
    if (!scenario) return null;
    const used = new Set();
    const steps = scenario.steps.map(step => {
      const result = rank(entries.filter(entry => (entry.type === step.type || (step.type === 'Skill' && entry.type === 'Guide')) && !used.has(entry.url)), step.query)[0];
      if (!result) return null;
      used.add(result.url);
      return { ...step, result };
    }).filter(Boolean);
    return steps.length ? { ...scenario, steps } : null;
  }

  const api = { rank, guidance, tokens };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SSPSearch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);