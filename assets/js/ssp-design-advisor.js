(function (root, factory) {
  const advisor = factory();
  if (typeof module === 'object' && module.exports) module.exports = advisor;
  else root.SSPDesignAdvisor = advisor;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const question = (id, title, options) => ({ id, title, options: options.map(([value, label]) => ({ value, label })) });
  const common = [
    question('role', 'Which perspective are you bringing?', [['maker', 'Maker or developer'], ['architect', 'Architect or technical lead'], ['both', 'A mixed delivery team']]),
    question('goal', 'What are you designing for?', [['new', 'A new solution'], ['modernize', 'Modernizing an existing app'], ['govern', 'Enterprise rollout and governance'], ['review', 'Reviewing a proposed design']]),
    question('users', 'Who will use the solution?', [['internal', 'People inside the organization'], ['external', 'Customers, partners, or the public'], ['mixed', 'Internal and external users'], ['unsure', 'Not decided yet']]),
    question('workload', 'What is the main workload?', [['app', 'An application'], ['automation', 'A process or automation'], ['agent', 'A conversational agent'], ['mixed', 'A combination of these'], ['unsure', 'Not decided yet']]),
    question('data', 'Where does the business data live?', [['dataverse', 'Dataverse'], ['existing', 'Existing services or other data stores'], ['new', 'A new data model is needed'], ['unsure', 'Not decided yet']]),
    { ...question('constraint', 'What are your top priorities? Rank up to three.', [['sensitive', 'Sensitive data and access control'], ['integration', 'Integration with existing systems'], ['licensing', 'Licensing and budget'], ['scale', 'Scale, reliability, or performance'], ['unsure', 'Not decided yet']]), ranked: true }
  ];
  const branches = {
    new: question('experience', 'Which experience matters most?', [['mobile', 'Task-focused or mobile work'], ['records', 'Managing structured business records'], ['portal', 'A website or self-service portal'], ['unsure', 'Not decided yet']]),
    modernize: question('pain', 'Why does the current app need to change?', [['performance', 'Slow or unreliable behavior'], ['manual', 'Too much manual work'], ['legacy', 'Maintenance or technology constraints'], ['unsure', 'The cause is not clear yet']]),
    govern: question('scope', 'How broad is the rollout?', [['team', 'One team or department'], ['multiple', 'Several delivery teams'], ['tenant', 'An organization-wide program'], ['unsure', 'Not decided yet']]),
    review: question('evidence', 'What evidence is available?', [['design', 'Design documents only'], ['prototype', 'A prototype or proof of concept'], ['live', 'An existing implementation'], ['unsure', 'Evidence has not been collected yet']])
  };
  const guides = {
    architecture: ['Solution Architecture Blueprint', 'solution-architecture-blueprint', 'https://learn.microsoft.com/power-platform/architecture/'],
    environment: ['Environment Strategy Blueprint', 'environment-strategy-blueprint', 'https://learn.microsoft.com/power-platform/guidance/adoption/environment-strategy'],
    data: ['Dataverse Data Model Designer', 'dataverse-data-model-designer', 'https://learn.microsoft.com/power-apps/maker/data-platform/data-platform-intro'],
    experience: ['Experience Pattern Selector', 'experience-pattern-selector', 'https://learn.microsoft.com/power-platform/well-architected/experience-optimization/'],
    integration: ['Integration Pattern Selector', 'integration-pattern-selector', 'https://learn.microsoft.com/power-platform/architecture/'],
    security: ['Security Role Mapper', 'security-role-mapper', 'https://learn.microsoft.com/power-platform/admin/security-roles-privileges'],
    alm: ['ALM Topology Planner', 'alm-topology-planner', 'https://learn.microsoft.com/power-platform/alm/overview-alm'],
    review: ['Well-Architected Design Check', 'well-architected-design-check', 'https://learn.microsoft.com/power-platform/well-architected/']
  };
  const caveat = 'This is a rule-based design starting point, not architecture approval, a licensing determination, or an executed skill. Validate recommendations against current Microsoft guidance and organizational policies.';

  function questionsFor(answers = {}) {
    return [...common, ...(Object.hasOwn(branches, answers.goal) ? [branches[answers.goal]] : [])];
  }
  function normalize(answers = {}) {
    const clean = {};
    common.forEach(item => {
      if (item.ranked) {
        const values = Array.isArray(answers[item.id]) ? answers[item.id] : [answers[item.id]];
        const valid = [...new Set(values.filter(value => item.options.some(option => option.value === value)))];
        const priorities = valid.includes('unsure') ? ['unsure'] : valid.slice(0, 3);
        if (priorities.length) clean[item.id] = priorities;
      } else if (item.options.some(option => option.value === answers[item.id])) clean[item.id] = answers[item.id];
    });
    const branch = branches[clean.goal];
    if (branch && branch.options.some(option => option.value === answers[branch.id])) clean[branch.id] = answers[branch.id];
    return clean;
  }
  function recommend(input) {
    const answers = normalize(input);
    const questions = questionsFor(answers);
    const missing = questions.filter(item => !answers[item.id]).map(item => item.id);
    if (missing.length) return { complete: false, missing };
    const recommendations = [];
    const assumptions = [];
    const options = [];
    const add = (key, reason) => {
      const [title, id, source] = guides[key];
      if (!recommendations.some(item => item.id === id)) recommendations.push({ title, id, source, reason, url: 'ssp-design.html#skill-' + id });
    };
    const starts = { new: 'architecture', modernize: 'architecture', govern: 'environment', review: 'review' };
    const reasons = {
      new: 'Define the business outcome, system boundaries, and decision log before choosing components.',
      modernize: 'Document the current architecture and pain points before selecting a replacement or migration.',
      govern: 'Agree environment ownership, data policies, and delivery boundaries before expanding adoption.',
      review: 'Use the Well-Architected pillars to collect risks, evidence, and decisions requiring validation.'
    };
    add(starts[answers.goal], reasons[answers.goal]);
    if (answers.workload === 'automation') {
      options.push('Evaluate Power Automate for the process, with explicit triggers, exceptions, ownership, and operational monitoring.');
      add('integration', 'Automation needs defined service boundaries, connector behavior, and failure handling.');
    } else if (answers.workload === 'agent') {
      options.push('Evaluate Copilot Studio for conversational tasks; define knowledge boundaries, permitted actions, escalation, and evaluation before implementation.');
      add('architecture', 'An agent needs clear boundaries between knowledge, actions, business systems, and human decisions.');
    } else if (answers.workload === 'unsure') {
      options.push('Keep the product choice open until a representative user task and its success criteria are agreed.');
    } else if (answers.workload === 'mixed') {
      options.push('Compare a composed solution using apps, automation, and agents; justify each component against a specific user task.');
      add('integration', 'A composed workload needs explicit component responsibilities and integration contracts.');
    } else if (['external', 'mixed'].includes(answers.users) || answers.experience === 'portal') {
      options.push('Compare Power Pages for web-based self-service with other access patterns. Confirm identity, authorization, licensing, and accessibility requirements first.');
      add('experience', 'External or portal access changes identity, user experience, and data-access decisions.');
    } else if (answers.experience === 'records' && answers.data === 'dataverse') {
      options.push('Evaluate a model-driven app for structured Dataverse records, forms, views, and role-focused business processes.');
      add('experience', 'The record-focused experience and Dataverse data make a model-driven app a candidate, not a requirement.');
    } else if (answers.experience === 'mobile') {
      options.push('Evaluate a canvas app for tailored task-focused work; validate device support, connectivity, delegation, and accessibility.');
      add('experience', 'A mobile or task-focused experience needs testing against actual device and connectivity constraints.');
    } else {
      options.push('Compare canvas, model-driven, and web experiences against user tasks and access needs before choosing an app surface.');
      add('experience', 'The available answers do not establish a single best app experience.');
    }
    if (answers.constraint.includes('sensitive') || ['external', 'mixed'].includes(answers.users)) {
      add('security', 'Sensitive data or external access requires explicit identity, authorization, and least-privilege decisions.');
      assumptions.push('Confirm identity, data classification, retention, and access tests. Dataverse roles do not replace product-specific controls such as Power Pages web roles and table permissions.');
    }
    if (answers.data === 'existing' || answers.constraint.includes('integration')) {
      add('integration', 'Existing systems require decisions about authentication, ownership, latency, limits, and failure recovery.');
      assumptions.push('Validate connector availability, API limits, and residency. Do not assume a migration to Dataverse is necessary.');
    } else if (['new', 'dataverse'].includes(answers.data)) {
      add('data', answers.data === 'new' ? 'Define a logical model first; use the Dataverse guide if Dataverse is selected.' : 'Validate Dataverse relationships, ownership, and access against the business model.');
    }
    if (answers.constraint.includes('licensing')) assumptions.push('Confirm current licensing, capacity, premium connectors, external-user entitlements, and budget with the licensing owner; these answers cannot establish cost or entitlement.');
    if (answers.constraint.includes('scale')) {
      add('review', 'Scale and reliability concerns need measurable service expectations and representative performance tests.');
      assumptions.push('Set expected volumes, concurrency, latency, recovery targets, and service limits before accepting the design.');
    }
    if (answers.goal === 'modernize') {
      if (answers.pain === 'performance') {
        options.push('Diagnose the slow or unreliable path with traces before treating migration as the remedy.');
        add('review', 'Performance evidence should distinguish design limitations from implementation defects.');
      }
      if (answers.pain === 'manual') options.push('Map manual handoffs and exception cases before deciding which work to automate.');
      if (answers.pain === 'legacy') assumptions.push('Inventory dependencies, support constraints, and coexistence requirements before selecting what to retain or replace.');
      add('alm', 'Plan staged change, validation, coexistence, and recovery before replacing the current app.');
    }
    if (answers.goal === 'govern') {
      add('alm', 'Define source control, solution boundaries, approval gates, and repeatable releases.');
      assumptions.push(answers.scope === 'team' ? 'Agree a named owner and development-to-production path for the team.' : 'Validate delegated ownership, provisioning, support, and policy exceptions across delivery teams.');
    }
    if (answers.goal === 'review') assumptions.push(answers.evidence === 'live' ? 'Use sanitized implementation evidence and traces for Review checks; do not include production data or secrets.' : 'Design and prototype evidence cannot establish production security or performance. Record what still needs implementation-level testing.');
    questions.filter(item => item.ranked ? answers[item.id].includes('unsure') : answers[item.id] === 'unsure').forEach(item => assumptions.push('Unresolved: ' + item.title));
    const priorityGuides = { sensitive: guides.security[1], integration: guides.integration[1], scale: guides.review[1] };
    const primary = recommendations[0];
    const rankedGuides = answers.constraint.map(value => recommendations.find(item => item.id === priorityGuides[value])).filter(Boolean);
    recommendations.splice(0, recommendations.length, primary, ...rankedGuides.filter(item => item !== primary), ...recommendations.filter(item => item !== primary && !rankedGuides.includes(item)));
    const priorities = answers.constraint.map((value, index) => ({ rank: index + 1, label: common.find(item => item.id === 'constraint').options.find(option => option.value === value).label }));
    rankedGuides.forEach(item => {
      const rank = answers.constraint.findIndex(value => priorityGuides[value] === item.id) + 1;
      item.reason = `Priority ${rank}: ` + item.reason;
    });
    assumptions.push('Verify licensing, environment permissions, organizational policy, and a named delivery owner before implementation.');
    const titles = { new: 'Frame a new solution', modernize: 'Assess before modernizing', govern: 'Establish delivery guardrails', review: 'Validate the design against evidence' };
    return {
      complete: true, title: titles[answers.goal], options, recommendations, assumptions, caveat, priorities,
      nextAction: answers.role === 'maker' ? 'Use the first guide to create a small design brief, then review open decisions with a technical lead before building.' : 'Record options, tradeoffs, owners, and evidence needed at each approval gate; review the brief with the delivery team.',
      topicUrl: 'ssp-design-guide.html#' + answers.goal,
      reviewUrl: answers.goal === 'review' && answers.evidence === 'live' ? 'ssp-review.html#skills' : null,
      answers: questions.map(item => ({ question: item.title, answer: item.ranked ? priorities.map(priority => `${priority.rank}. ${priority.label}`).join('; ') : item.options.find(option => option.value === answers[item.id]).label }))
    };
  }
  function toMarkdown(result, baseUrl, skills = []) {
    if (!result.complete) throw new Error('Complete the advisor questions before exporting.');
    const link = value => new URL(value, baseUrl).href;
    const lines = ['# Design starting point', '', '## ' + result.title, '', result.caveat, '', '## Your answers', ''];
    result.answers.forEach(item => lines.push('- **' + item.question + '** ' + item.answer));
    lines.push('', '## Options to evaluate', '', ...result.options.map(item => '- ' + item), '', '## Suggested guide sequence', '');
    result.recommendations.forEach((item, index) => lines.push(`${index + 1}. [${item.title}](${link(item.url)})`, '   ' + item.reason, '   [Microsoft Learn guidance](' + item.source + ')', ''));
    if (skills.length) {
      lines.push('## Supporting published skills', '', 'Source instructions only. Review prerequisites and permissions in a compatible host before execution.', '');
      skills.forEach(item => lines.push('- [' + item.title + '](' + item.url + ')', '  ' + item.scope));
    }
    lines.push('', '## Assumptions to validate', '', ...result.assumptions.map(item => '- ' + item), '', '## Next action', '', result.nextAction, '', '[Design topic](' + link(result.topicUrl) + ')');
    if (result.reviewUrl) lines.push('[Review implementation evidence](' + link(result.reviewUrl) + ')');
    return lines.join('\n') + '\n';
  }
  return { questionsFor, normalize, recommend, toMarkdown };
});