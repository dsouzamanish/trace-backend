/**
 * Team Member Content Type Schema
 * Stores details of each team member to associate blockers with them.
 */
export const teamMemberSchema = {
  content_type: {
    title: 'Team Member',
    uid: 'team_member',
    schema: [
      {
        display_name: 'Title',
        uid: 'title',
        data_type: 'text',
        mandatory: true,
        unique: false,
        field_metadata: {
          _default: true,
          description: 'Display name - auto-generated from first and last name',
        },
      },
      {
        display_name: 'First Name',
        uid: 'first_name',
        data_type: 'text',
        mandatory: true,
        unique: false,
        field_metadata: {
          description: "Member's first name",
        },
      },
      {
        display_name: 'Last Name',
        uid: 'last_name',
        data_type: 'text',
        mandatory: true,
        unique: false,
        field_metadata: {
          description: "Member's last name",
        },
      },
      {
        display_name: 'Email',
        uid: 'email',
        data_type: 'text',
        mandatory: true,
        unique: true,
        field_metadata: {
          description: 'Used for login/Slack mapping',
        },
      },
      {
        display_name: 'Slack ID',
        uid: 'slack_id',
        data_type: 'text',
        mandatory: false,
        unique: false,
        field_metadata: {
          description: 'Slack user ID used to link submissions',
        },
      },
      {
        display_name: 'Profile Picture',
        uid: 'profile_pic',
        data_type: 'file',
        mandatory: false,
        unique: false,
        field_metadata: {
          description: 'Profile image of member',
          rich_text_type: 'standard',
        },
      },
      {
        display_name: 'Profile Picture URL',
        uid: 'profile_pic_url',
        data_type: 'text',
        mandatory: false,
        unique: false,
        field_metadata: {
          description: 'External profile picture URL (e.g., from Google OAuth)',
        },
      },
      {
        display_name: 'Designation',
        uid: 'designation',
        data_type: 'text',
        mandatory: false,
        unique: false,
        enum: {
          advanced: false,
          choices: [
            { value: 'Engineer' },
            { value: 'Sr. Engineer' },
            { value: 'Tech Lead' },
            { value: 'QA' },
            { value: 'Manager' },
            { value: 'Other' },
          ],
        },
        display_type: 'dropdown',
        field_metadata: {
          description: "Member's role in the team",
        },
      },
      {
        display_name: 'Team (Deprecated)',
        uid: 'team',
        data_type: 'text',
        mandatory: false,
        unique: false,
        field_metadata: {
          description: 'Deprecated: Use team_ref instead. Team name kept for backward compatibility.',
        },
      },
      {
        display_name: 'Team Reference',
        uid: 'team_ref',
        data_type: 'reference',
        mandatory: false,
        unique: false,
        reference_to: ['team'],
        field_metadata: {
          description: 'Reference to Team entry - primary way to associate member with team',
          ref_multiple: false,
        },
      },
      {
        display_name: 'Is Manager',
        uid: 'is_manager',
        data_type: 'boolean',
        mandatory: false,
        unique: false,
        field_metadata: {
          description: 'Marks if the user can view team data',
          default_value: false,
        },
      },
      {
        display_name: 'Joined Date',
        uid: 'joined_date',
        data_type: 'isodate',
        mandatory: false,
        unique: false,
        field_metadata: {
          description: 'Date user joined team',
        },
      },
      {
        display_name: 'Status',
        uid: 'status',
        data_type: 'text',
        mandatory: false,
        unique: false,
        enum: {
          advanced: false,
          choices: [{ value: 'Active' }, { value: 'Inactive' }],
        },
        display_type: 'dropdown',
        field_metadata: {
          description: 'Active or Inactive user',
          default_value: 'Active',
        },
      },
    ],
    options: {
      is_page: false,
      singleton: false,
      title: 'title',
      sub_title: ['email'],
    },
  },
};
