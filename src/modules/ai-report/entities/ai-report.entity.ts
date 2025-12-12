export type ReportType = 'individual' | 'team';
export type ReportPeriod = 'weekly' | 'monthly';

export interface ActionItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AiReport {
  uid: string;
  reportType: ReportType;
  targetMember?: string;
  targetTeam?: string;
  reportPeriod: ReportPeriod;
  summary: string;
  actionItems: ActionItem[];
  insights: string[];
  generatedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AiReportContentstack {
  uid: string;
  report_type: ReportType;
  target_member?: Array<{ uid: string; _content_type_uid: string }>;
  target_team?: string;
  report_period: ReportPeriod;
  summary: string;
  action_items: ActionItem[];
  insights: string[];
  generated_at: string;
  created_at?: string;
  updated_at?: string;
}

