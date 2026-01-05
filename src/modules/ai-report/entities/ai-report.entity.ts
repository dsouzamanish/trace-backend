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
  blockerRef?: string;              // e.g., "B1", "B2" - reference to the specific blocker
  blockerDescription?: string;      // The exact blocker this addresses
  teamToInvolve?: string;           // e.g., "DevOps", "Backend team", "QA team"
  suggestedSolution?: string;       // Step-by-step solution
  immediateNextStep?: string;       // The ONE thing to do first
  estimatedEffort?: 'quick-win' | 'short-term' | 'long-term';
  relatedBlockers?: string[];       // For grouped recommendations
}

export interface AiReport {
  uid: string;
  reportType: ReportType;
  targetMember?: string;
  targetTeam?: string;
  reportPeriod: ReportPeriod;
  startDate: string;           // Start of the report date range (ISO date)
  endDate: string;             // End of the report date range (ISO date)
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
  start_date: string;          // Start of the report date range
  end_date: string;            // End of the report date range
  summary: string;
  // Stored as JSON strings in Contentstack text fields
  action_items: string | ActionItem[];
  insights: string | string[];
  generated_at: string;
  created_at?: string;
  updated_at?: string;
}

