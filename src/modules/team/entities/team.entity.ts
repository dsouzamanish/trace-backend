import { TeamMember } from '../../team-member/entities/team-member.entity';

export type TeamStatus = 'Active' | 'Inactive' | 'Archived';

export interface Team {
  uid: string;
  name: string;
  teamId: string;
  description?: string;
  manager?: TeamMember;
  managerUid?: string;
  members?: TeamMember[];
  memberUids?: string[];
  status: TeamStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamContentstack {
  uid: string;
  title: string;
  team_id: string;
  description?: string;
  manager?: Array<{ uid: string; _content_type_uid: string } & Partial<TeamMember>>;
  members?: Array<{ uid: string; _content_type_uid: string } & Partial<TeamMember>>;
  status: TeamStatus;
  created_at?: string;
  updated_at?: string;
}


