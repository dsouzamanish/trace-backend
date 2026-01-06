import { TeamMember } from '../../team-member/entities/team-member.entity';

export type BlockerCategory =
  | 'Process'
  | 'Technical'
  | 'Dependency'
  | 'Infrastructure'
  | 'Communication'
  | 'Resource'
  | 'Knowledge'
  | 'Access'
  | 'External'
  | 'Review'
  | 'Customer Escalation'
  | 'Other';
export type BlockerSeverity = 'Low' | 'Medium' | 'High';
export type BlockerStatus = 'Open' | 'Resolved' | 'Ignored';

export interface Blocker {
  uid: string;
  teamMember: TeamMember | string;
  description: string;
  category: BlockerCategory;
  severity: BlockerSeverity;
  timestamp: string;
  status: BlockerStatus;
  reportedVia: string;
  managerNotes?: string;
  slackMessageId?: string;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BlockerContentstack {
  uid: string;
  team_member: Array<{ uid: string; _content_type_uid: string }> | unknown;
  description: string;
  category: BlockerCategory;
  severity: BlockerSeverity;
  timestamp: string;
  status: BlockerStatus;
  reported_via: string;
  manager_notes?: string;
  slack_message_id?: string;
  attachments?: Array<{ url: string }>;
  created_at?: string;
  updated_at?: string;
}

export interface BlockerStats {
  total: number;
  byCategory: Record<BlockerCategory, number>;
  bySeverity: Record<BlockerSeverity, number>;
  byStatus: Record<BlockerStatus, number>;
  weeklyTrend: Array<{ week: string; count: number }>;
}

