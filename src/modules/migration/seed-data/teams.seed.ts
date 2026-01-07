/**
 * Sample Teams Seed Data
 * Creates teams that will contain team members.
 * This should be seeded BEFORE team members.
 */
export const teamsSeed = [
  {
    entry: {
      title: 'Engineering',
      team_id: 'engineering',
      description: 'Core engineering team responsible for product development',
      status: 'Active',
    },
    // Member emails to link after team member creation
    memberEmails: [
      'john.smith@example.com',      // Tech Lead / Manager
      'sarah.johnson@example.com',    // Sr. Engineer
      'michael.chen@example.com',     // Engineer
      'lisa.wang@example.com',        // Engineer
    ],
    managerEmail: 'john.smith@example.com',
  },
  {
    entry: {
      title: 'Quality Assurance',
      team_id: 'quality-assurance',
      description: 'Quality assurance and testing team',
      status: 'Active',
    },
    memberEmails: [
      'alex.rodriguez@example.com',   // Manager
      'emily.davis@example.com',      // QA
    ],
    managerEmail: 'alex.rodriguez@example.com',
  },
  {
    entry: {
      title: 'Infrastructure',
      team_id: 'infrastructure',
      description: 'Infrastructure and DevOps team',
      status: 'Active',
    },
    memberEmails: [
      'rachel.green@example.com',     // Tech Lead / Manager
      'david.kim@example.com',        // Sr. Engineer
    ],
    managerEmail: 'rachel.green@example.com',
  },
];

