/**
 * AI Report Content Type Schema
 * Stores AI-generated reports with insights and action items.
 */
export const aiReportSchema = {
  content_type: {
    title: 'AI Report',
    uid: 'ai_report',
    schema: [
      {
        display_name: 'Title',
        uid: 'title',
        data_type: 'text',
        mandatory: true,
        unique: false,
        field_metadata: {
          _default: true,
          description: 'Report title',
        },
      },
      {
        display_name: 'Report Type',
        uid: 'report_type',
        data_type: 'text',
        mandatory: true,
        unique: false,
        enum: {
          advanced: false,
          choices: [{ value: 'individual' }, { value: 'team' }],
        },
        display_type: 'dropdown',
        field_metadata: {
          description: 'Type of report - individual or team',
        },
      },
      {
        display_name: 'Target Member',
        uid: 'target_member',
        data_type: 'reference',
        mandatory: false,
        unique: false,
        reference_to: ['team_member'],
        field_metadata: {
          description: 'Team member for individual reports',
          ref_multiple: false,
        },
      },
      {
        display_name: 'Target Team',
        uid: 'target_team',
        data_type: 'text',
        mandatory: false,
        unique: false,
        field_metadata: {
          description: 'Team name for team reports',
        },
      },
      {
        display_name: 'Report Period',
        uid: 'report_period',
        data_type: 'text',
        mandatory: true,
        unique: false,
        enum: {
          advanced: false,
          choices: [{ value: 'weekly' }, { value: 'monthly' }],
        },
        display_type: 'dropdown',
        field_metadata: {
          description: 'Period covered by the report',
        },
      },
      {
        display_name: 'Summary',
        uid: 'summary',
        data_type: 'text',
        mandatory: true,
        unique: false,
        field_metadata: {
          description: 'AI-generated summary of blockers',
          multiline: true,
        },
      },
      {
        display_name: 'Action Items',
        uid: 'action_items',
        data_type: 'text',
        mandatory: false,
        unique: false,
        field_metadata: {
          description: 'JSON string of action items with title, description, and priority',
          multiline: true,
        },
      },
      {
        display_name: 'Insights',
        uid: 'insights',
        data_type: 'text',
        mandatory: false,
        unique: false,
        field_metadata: {
          description: 'JSON string of key insights',
          multiline: true,
        },
      },
      {
        display_name: 'Generated At',
        uid: 'generated_at',
        data_type: 'isodate',
        mandatory: true,
        unique: false,
        field_metadata: {
          description: 'When the report was generated',
        },
      },
    ],
    options: {
      is_page: false,
      singleton: false,
      title: 'title',
      sub_title: ['report_type', 'report_period'],
    },
  },
};
