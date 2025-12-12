/**
 * Sample Blockers Seed Data
 * Creates sample blockers for testing and demonstration.
 * Note: team_member reference will be populated during seeding.
 */
export const blockersSeed = [
  {
    entry: {
      title: 'Technical - API response times are slow',
      description:
        'The user authentication API is taking over 3 seconds to respond during peak hours, causing user frustration and timeout errors.',
      category: 'Technical',
      severity: 'High',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Web',
    },
    assignToIndex: 1, // Sarah Johnson
  },
  {
    entry: {
      title: 'Dependency - Waiting for design specs',
      description:
        'Cannot proceed with the dashboard redesign as we are still waiting for the updated design specifications from the UX team.',
      category: 'Dependency',
      severity: 'Medium',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Slack',
    },
    assignToIndex: 2, // Michael Chen
  },
  {
    entry: {
      title: 'Infrastructure - CI/CD pipeline failures',
      description:
        'The deployment pipeline has been failing intermittently for the past two days. Tests pass locally but fail in CI environment.',
      category: 'Infrastructure',
      severity: 'High',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Resolved',
      reported_via: 'Web',
      manager_notes: 'Resolved by increasing CI runner memory allocation.',
    },
    assignToIndex: 6, // David Kim
  },
  {
    entry: {
      title: 'Process - Unclear requirements',
      description:
        'The requirements for the new reporting feature are ambiguous. Need clarification on data aggregation logic before proceeding.',
      category: 'Process',
      severity: 'Medium',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Web',
    },
    assignToIndex: 5, // Lisa Wang
  },
  {
    entry: {
      title: 'Technical - Database connection pool exhaustion',
      description:
        'Production database is running out of connection pool during high traffic. Need to optimize connection handling.',
      category: 'Technical',
      severity: 'High',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Slack',
    },
    assignToIndex: 7, // Rachel Green
  },
  {
    entry: {
      title: 'Dependency - Third-party API rate limits',
      description:
        'We are hitting rate limits on the payment gateway API during checkout peak times, causing failed transactions.',
      category: 'Dependency',
      severity: 'High',
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Resolved',
      reported_via: 'Web',
      manager_notes: 'Negotiated higher rate limits with the payment provider.',
    },
    assignToIndex: 1, // Sarah Johnson
  },
  {
    entry: {
      title: 'Process - Code review bottleneck',
      description:
        'PRs are sitting in review queue for 3+ days. Need more reviewers or adjusted review process.',
      category: 'Process',
      severity: 'Medium',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Web',
    },
    assignToIndex: 2, // Michael Chen
  },
  {
    entry: {
      title: 'Technical - Memory leak in worker service',
      description:
        'The background worker service shows increasing memory usage over time, requiring frequent restarts.',
      category: 'Technical',
      severity: 'Medium',
      timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Web',
    },
    assignToIndex: 6, // David Kim
  },
  {
    entry: {
      title: 'Other - VPN connectivity issues',
      description:
        'Remote team members are experiencing frequent VPN disconnections, affecting productivity.',
      category: 'Other',
      severity: 'Low',
      timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Ignored',
      reported_via: 'Slack',
      manager_notes: 'IT team is aware and working on infrastructure upgrade.',
    },
    assignToIndex: 3, // Emily Davis
  },
  {
    entry: {
      title: 'Infrastructure - Staging environment down',
      description:
        'Staging environment has been unavailable since yesterday morning. QA testing is blocked.',
      category: 'Infrastructure',
      severity: 'High',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Resolved',
      reported_via: 'Web',
      manager_notes: 'Server was restarted and issue resolved.',
    },
    assignToIndex: 3, // Emily Davis
  },
];

