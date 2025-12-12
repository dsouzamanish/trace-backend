export type Designation = 'Engineer' | 'Sr. Engineer' | 'Tech Lead' | 'QA' | 'Manager' | 'Other';
export type MemberStatus = 'Active' | 'Inactive';

export interface TeamMember {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  slackId?: string;
  profilePic?: string;
  profilePicUrl?: string;
  designation?: Designation;
  team?: string;
  isManager?: boolean;
  joinedDate?: string;
  status?: MemberStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMemberContentstack {
  uid: string;
  first_name: string;
  last_name: string;
  email: string;
  slack_id?: string;
  profile_pic?: { url: string };
  profile_pic_url?: string;
  designation?: Designation;
  team?: string;
  is_manager?: boolean;
  joined_date?: string;
  status?: MemberStatus;
  created_at?: string;
  updated_at?: string;
}
