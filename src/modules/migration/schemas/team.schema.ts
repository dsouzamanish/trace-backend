/**
 * Team Content Type Schema
 * Represents a team with manager and members.
 */
export const teamSchema = {
  content_type: {
    title: 'Team',
    uid: 'team',
    schema: [
      {
        display_name: 'Team Name',
        uid: 'title',
        data_type: 'text',
        mandatory: true,
        unique: true,
        field_metadata: {
          _default: true,
          description: 'Name of the team',
        },
      },
      {
        display_name: 'Team ID',
        uid: 'team_id',
        data_type: 'text',
        mandatory: true,
        unique: true,
        field_metadata: {
          description: 'Unique identifier for the team (e.g., engineering, product, design)',
        },
      },
      {
        display_name: 'Description',
        uid: 'description',
        data_type: 'text',
        mandatory: false,
        unique: false,
        field_metadata: {
          description: 'Brief description of the team',
          multiline: true,
        },
      },
      {
        display_name: 'Manager',
        uid: 'manager',
        data_type: 'reference',
        mandatory: true,
        unique: false,
        reference_to: ['team_member'],
        field_metadata: {
          description: 'Team manager (single team member reference)',
          ref_multiple: false,
        },
      },
      {
        display_name: 'Members',
        uid: 'members',
        data_type: 'reference',
        mandatory: false,
        unique: false,
        reference_to: ['team_member'],
        field_metadata: {
          description: 'Team members (multiple team member references)',
          ref_multiple: true,
        },
      },
      {
        display_name: 'Status',
        uid: 'status',
        data_type: 'text',
        mandatory: true,
        unique: false,
        enum: {
          advanced: false,
          choices: [{ value: 'Active' }, { value: 'Inactive' }, { value: 'Archived' }],
        },
        display_type: 'dropdown',
        field_metadata: {
          description: 'Current status of the team',
        },
      },
    ],
    options: {
      is_page: false,
      singleton: false,
      title: 'title',
      sub_title: ['team_id', 'status'],
    },
  },
};


