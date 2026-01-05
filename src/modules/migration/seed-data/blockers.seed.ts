/**
 * Sample Blockers Seed Data
 * Creates sample blockers for testing and demonstration.
 * Note: team_member reference will be populated during seeding.
 * 
 * Team Members Index Reference:
 * 0 - John Smith (Tech Lead, Engineering, Manager)
 * 1 - Sarah Johnson (Sr. Engineer, Engineering)
 * 2 - Michael Chen (Engineer, Engineering)
 * 3 - Emily Davis (QA, Quality Assurance)
 * 4 - Alex Rodriguez (Manager, Quality Assurance, Manager)
 * 5 - Lisa Wang (Engineer, Engineering)
 * 6 - David Kim (Sr. Engineer, Infrastructure)
 * 7 - Rachel Green (Tech Lead, Infrastructure, Manager)
 */
export const blockersSeed = [
  // ============ John Smith (0) - Tech Lead, Engineering ============
  {
    entry: {
      title: 'Technical - Sprint planning tool integration failing',
      description:
        'The Jira integration is not syncing sprint data correctly. Story points and assignments are not reflecting in our dashboard, making sprint planning difficult.',
      category: 'Technical',
      severity: 'High',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Web',
    },
    assignToIndex: 0, // John Smith
  },
  {
    entry: {
      title: 'Process - Team capacity planning challenges',
      description:
        'Struggling to accurately estimate team capacity due to varying skill levels and unexpected leave requests. Need a better framework for capacity planning.',
      category: 'Process',
      severity: 'Medium',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Web',
    },
    assignToIndex: 0, // John Smith
  },

  // ============ Sarah Johnson (1) - Sr. Engineer, Engineering ============
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
      title: 'Technical - OAuth token refresh not working',
      description:
        'Users are being logged out unexpectedly because the OAuth token refresh mechanism is failing silently in certain edge cases.',
      category: 'Technical',
      severity: 'High',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Slack',
    },
    assignToIndex: 1, // Sarah Johnson
  },

  // ============ Michael Chen (2) - Engineer, Engineering ============
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
      title: 'Technical - React component rendering performance',
      description:
        'The data table component is re-rendering unnecessarily on every state change, causing noticeable lag with large datasets.',
      category: 'Technical',
      severity: 'Medium',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Web',
    },
    assignToIndex: 2, // Michael Chen
  },

  // ============ Emily Davis (3) - QA, Quality Assurance ============
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
  {
    entry: {
      title: 'Process - Test data management issues',
      description:
        'Test data in staging gets corrupted frequently due to concurrent test runs. Need isolated test data environments.',
      category: 'Process',
      severity: 'Medium',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Web',
    },
    assignToIndex: 3, // Emily Davis
  },
  {
    entry: {
      title: 'Dependency - Missing API documentation',
      description:
        'Cannot write comprehensive API tests because the API documentation is incomplete and outdated. Need dev team to update Swagger specs.',
      category: 'Dependency',
      severity: 'Medium',
      timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Web',
    },
    assignToIndex: 3, // Emily Davis
  },

  // ============ Alex Rodriguez (4) - Manager, Quality Assurance ============
  {
    entry: {
      title: 'Process - QA resource allocation conflicts',
      description:
        'Multiple projects need QA resources at the same time. Need better coordination with project managers for QA scheduling.',
      category: 'Process',
      severity: 'High',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Web',
    },
    assignToIndex: 4, // Alex Rodriguez
  },
  {
    entry: {
      title: 'Dependency - Automation framework license expiring',
      description:
        'Our Selenium Grid enterprise license expires next month. Need budget approval for renewal to continue automated testing.',
      category: 'Dependency',
      severity: 'High',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Web',
    },
    assignToIndex: 4, // Alex Rodriguez
  },
  {
    entry: {
      title: 'Other - Test coverage metrics reporting',
      description:
        'Leadership wants weekly test coverage reports but our current tooling does not support automated report generation.',
      category: 'Other',
      severity: 'Low',
      timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Resolved',
      reported_via: 'Slack',
      manager_notes: 'Integrated SonarQube for automated coverage reporting.',
    },
    assignToIndex: 4, // Alex Rodriguez
  },

  // ============ Lisa Wang (5) - Engineer, Engineering ============
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
      title: 'Technical - Unit test flakiness',
      description:
        'Several unit tests are flaky due to timing issues with async operations. Tests pass locally but fail randomly in CI.',
      category: 'Technical',
      severity: 'Medium',
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Web',
    },
    assignToIndex: 5, // Lisa Wang
  },
  {
    entry: {
      title: 'Dependency - Blocked by backend API changes',
      description:
        'Cannot complete frontend feature because the backend team has not deployed the required API endpoint changes.',
      category: 'Dependency',
      severity: 'High',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Slack',
    },
    assignToIndex: 5, // Lisa Wang
  },

  // ============ David Kim (6) - Sr. Engineer, Infrastructure ============
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
      title: 'Infrastructure - Kubernetes pod evictions',
      description:
        'Production pods are being evicted due to memory pressure on nodes. Need to review resource limits and node capacity.',
      category: 'Infrastructure',
      severity: 'High',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Slack',
    },
    assignToIndex: 6, // David Kim
  },
  {
    entry: {
      title: 'Dependency - Waiting for cloud provider support',
      description:
        'Opened a critical support ticket with AWS for RDS performance issues. Still waiting for their response after 48 hours.',
      category: 'Dependency',
      severity: 'High',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Web',
    },
    assignToIndex: 6, // David Kim
  },

  // ============ Rachel Green (7) - Tech Lead, Infrastructure ============
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
      title: 'Process - On-call rotation gaps',
      description:
        'Several team members are on vacation next week and we have gaps in the on-call rotation schedule. Need to find coverage.',
      category: 'Process',
      severity: 'Medium',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Web',
    },
    assignToIndex: 7, // Rachel Green
  },
  {
    entry: {
      title: 'Infrastructure - SSL certificate expiring',
      description:
        'SSL certificates for three production domains expire in 10 days. Auto-renewal failed and manual intervention is needed.',
      category: 'Infrastructure',
      severity: 'High',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      reported_via: 'Web',
    },
    assignToIndex: 7, // Rachel Green
  },
  {
    entry: {
      title: 'Dependency - Terraform provider bug',
      description:
        'The latest Terraform AWS provider has a bug preventing infrastructure updates. Blocked until the provider releases a fix or we downgrade.',
      category: 'Dependency',
      severity: 'Medium',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Resolved',
      reported_via: 'Web',
      manager_notes: 'Downgraded to previous provider version as a workaround.',
    },
    assignToIndex: 7, // Rachel Green
  },
];
