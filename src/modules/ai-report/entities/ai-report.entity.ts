export type ReportType = 'individual' | 'team';
export type ReportPeriod = 'weekly' | 'monthly';
export type BlockerSeverity = 'High' | 'Medium' | 'Low';

export interface ActionItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  // Enhanced fields for more specific recommendations
  severity?: BlockerSeverity;
  category?: string;
  suggestedSolution?: string;
  estimatedEffort?: 'quick-win' | 'short-term' | 'long-term';
  relatedBlockers?: string[];
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
  // Stored as JSON strings in Contentstack text fields
  action_items: string | ActionItem[];
  insights: string | string[];
  generated_at: string;
  created_at?: string;
  updated_at?: string;
}

