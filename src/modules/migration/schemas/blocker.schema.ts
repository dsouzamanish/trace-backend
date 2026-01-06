/**
 * Blocker Content Type Schema
 * Stores each blocker entry reported by a team member.
 */
export const blockerSchema = {
  content_type: {
    title: 'Blocker',
    uid: 'blocker',
    schema: [
      {
        display_name: 'Title',
        uid: 'title',
        data_type: 'text',
        mandatory: true,
        unique: false,
        field_metadata: {
          _default: true,
          description: 'Auto-generated title from category and description',
        },
      },
      {
        display_name: 'Team Member',
        uid: 'team_member',
        data_type: 'reference',
        mandatory: true,
        unique: false,
        reference_to: ['team_member'],
        field_metadata: {
          description: 'Links to the team member entry',
          ref_multiple: false,
        },
      },
      {
        display_name: 'Description',
        uid: 'description',
        data_type: 'text',
        mandatory: true,
        unique: false,
        field_metadata: {
          description: 'Description of the blocker',
          multiline: true,
        },
      },
      {
        display_name: 'Category',
        uid: 'category',
        data_type: 'text',
        mandatory: true,
        unique: false,
        enum: {
          advanced: false,
          choices: [
            { value: 'Process' },
            { value: 'Technical' },
            { value: 'Dependency' },
            { value: 'Infrastructure' },
            { value: 'Communication' },
            { value: 'Resource' },
            { value: 'Knowledge' },
            { value: 'Access' },
            { value: 'External' },
            { value: 'Review' },
            { value: 'Other' },
          ],
        },
        display_type: 'dropdown',
        field_metadata: {
          description: 'Type of blocker',
        },
      },
      {
        display_name: 'Severity',
        uid: 'severity',
        data_type: 'text',
        mandatory: true,
        unique: false,
        enum: {
          advanced: false,
          choices: [{ value: 'Low' }, { value: 'Medium' }, { value: 'High' }],
        },
        display_type: 'dropdown',
        field_metadata: {
          description: 'Impact level',
        },
      },
      {
        display_name: 'Reported At',
        uid: 'timestamp',
        data_type: 'isodate',
        mandatory: true,
        unique: false,
        field_metadata: {
          description: 'Time of submission',
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
          choices: [
            { value: 'Open' },
            { value: 'Resolved' },
            { value: 'Ignored' },
          ],
        },
        display_type: 'dropdown',
        field_metadata: {
          description: 'State of blocker',
          default_value: 'Open',
        },
      },
      {
        display_name: 'Reported Via',
        uid: 'reported_via',
        data_type: 'text',
        mandatory: false,
        unique: false,
        field_metadata: {
          description: 'Source of submission (Slack or Web)',
          default_value: 'Web',
        },
      },
      {
        display_name: 'Manager Notes',
        uid: 'manager_notes',
        data_type: 'text',
        mandatory: false,
        unique: false,
        field_metadata: {
          description: 'Optional comments or resolution notes',
          multiline: true,
        },
      },
      {
        display_name: 'Slack Message ID',
        uid: 'slack_message_id',
        data_type: 'text',
        mandatory: false,
        unique: false,
        field_metadata: {
          description: 'For cross-reference with Slack',
        },
      },
      {
        display_name: 'Attachments',
        uid: 'attachments',
        data_type: 'file',
        mandatory: false,
        unique: false,
        multiple: true,
        field_metadata: {
          description: 'Optional screenshots or files',
        },
      },
    ],
    options: {
      is_page: false,
      singleton: false,
      title: 'title',
      sub_title: ['category', 'severity'],
    },
  },
};
