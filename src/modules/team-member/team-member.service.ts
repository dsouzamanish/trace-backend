import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { ContentstackService } from '../contentstack/contentstack.service';
import { TeamMember, TeamMemberContentstack } from './entities/team-member.entity';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamService } from '../team/team.service';

const CONTENT_TYPE_UID = 'team_member';

@Injectable()
export class TeamMemberService {
  constructor(
    private contentstackService: ContentstackService,
    @Inject(forwardRef(() => TeamService))
    private teamService: TeamService,
  ) {}

  /**
   * Transform Contentstack entry to TeamMember entity
   */
  private transformEntry(entry: TeamMemberContentstack): TeamMember {
    // Extract teamUid and teamName from team_ref reference field
    const teamRef = entry.team_ref?.[0];
    
    return {
      uid: entry.uid,
      firstName: entry.first_name,
      lastName: entry.last_name,
      email: entry.email,
      slackId: entry.slack_id,
      // Use profile_pic_url (external URL) or fall back to profile_pic file URL
      profilePic: entry.profile_pic_url || entry.profile_pic?.url,
      designation: entry.designation,
      team: entry.team,                    // Deprecated: kept for backward compatibility
      teamUid: teamRef?.uid,               // New: Team entry UID
      teamName: teamRef?.title || entry.team,  // New: Team name from reference or fallback to old field
      isManager: entry.is_manager,
      joinedDate: entry.joined_date,
      status: entry.status,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    };
  }

  /**
   * Transform DTO to Contentstack entry format
   */
  private toContentstackFormat(dto: CreateTeamMemberDto | UpdateTeamMemberDto): Record<string, unknown> {
    const entry: Record<string, unknown> = {};

    if ('firstName' in dto && dto.firstName) entry.first_name = dto.firstName;
    if ('lastName' in dto && dto.lastName) entry.last_name = dto.lastName;
    if ('email' in dto && dto.email) entry.email = dto.email;
    if ('slackId' in dto) entry.slack_id = dto.slackId;
    if ('profilePic' in dto && dto.profilePic) entry.profile_pic_url = dto.profilePic;
    if ('designation' in dto) entry.designation = dto.designation;
    if ('team' in dto) entry.team = dto.team;
    if ('isManager' in dto) entry.is_manager = dto.isManager;
    if ('status' in dto) entry.status = dto.status;

    // Set title for Contentstack entry
    if (dto.firstName && dto.lastName) {
      entry.title = `${dto.firstName} ${dto.lastName}`;
    }

    return entry;
  }

  async create(createDto: CreateTeamMemberDto): Promise<TeamMember> {
    // Check if email already exists
    const existingMember = await this.findByEmail(createDto.email);
    if (existingMember) {
      throw new ConflictException('A team member with this email already exists');
    }

    const data = this.toContentstackFormat(createDto);
    const entry = await this.contentstackService.createEntry<TeamMemberContentstack>(
      CONTENT_TYPE_UID,
      data,
    );

    return this.transformEntry(entry);
  }

  async findAll(options?: { team?: string; isManager?: boolean }): Promise<TeamMember[]> {
    const where: Record<string, unknown> = { status: 'Active' };

    if (options?.team) {
      where.team = options.team;
    }
    if (options?.isManager !== undefined) {
      where.is_manager = options.isManager;
    }

    const entries = await this.contentstackService.getEntries<TeamMemberContentstack>(
      CONTENT_TYPE_UID,
      { where, includeReference: ['team_ref'], limit: 100 },
    );

    return entries.map((entry) => this.transformEntry(entry));
  }

  async findById(uid: string): Promise<TeamMember | null> {
    const entry = await this.contentstackService.getEntryByUid<TeamMemberContentstack>(
      CONTENT_TYPE_UID,
      uid,
      ['team_ref'],  // Resolve team_ref reference to get teamUid and teamName
    );

    return entry ? this.transformEntry(entry) : null;
  }

  async findByEmail(email: string): Promise<TeamMember | null> {
    // Use getEntries with includeReference to resolve team_ref
    const entries = await this.contentstackService.getEntries<TeamMemberContentstack>(
      CONTENT_TYPE_UID,
      { 
        where: { email },
        includeReference: ['team_ref'],
        limit: 1,
      },
    );

    return entries.length > 0 ? this.transformEntry(entries[0]) : null;
  }

  async findBySlackId(slackId: string): Promise<TeamMember | null> {
    // Use getEntries with includeReference to resolve team_ref
    const entries = await this.contentstackService.getEntries<TeamMemberContentstack>(
      CONTENT_TYPE_UID,
      { 
        where: { slack_id: slackId },
        includeReference: ['team_ref'],
        limit: 1,
      },
    );

    return entries.length > 0 ? this.transformEntry(entries[0]) : null;
  }

  /**
   * Find team members by team name (uses Team entry's members reference)
   * This fetches fresh data from the Team entry, avoiding CDN caching issues
   */
  async findByTeam(teamName: string): Promise<TeamMember[]> {
    // Find the Team entry by name and get resolved members
    const team = await this.teamService.findByName(teamName);
    
    if (!team || !team.members) {
      return [];
    }

    // Filter only active members
    return team.members.filter((member) => member.status === 'Active');
  }

  /**
   * Find team members by team UID (uses Team entry's members reference)
   * Primary method for fetching team members - uses reference resolution
   */
  async findByTeamUid(teamUid: string): Promise<TeamMember[]> {
    const team = await this.teamService.findById(teamUid);
    
    if (!team || !team.members) {
      return [];
    }

    // Filter only active members
    return team.members.filter((member) => member.status === 'Active');
  }

  async update(uid: string, updateDto: UpdateTeamMemberDto): Promise<TeamMember> {
    const existingMember = await this.findById(uid);
    if (!existingMember) {
      throw new NotFoundException('Team member not found');
    }

    // Check email uniqueness if email is being updated
    if (updateDto.email && updateDto.email !== existingMember.email) {
      const memberWithEmail = await this.findByEmail(updateDto.email);
      if (memberWithEmail) {
        throw new ConflictException('A team member with this email already exists');
      }
    }

    const data = this.toContentstackFormat(updateDto);
    const entry = await this.contentstackService.updateEntry<TeamMemberContentstack>(
      CONTENT_TYPE_UID,
      uid,
      data,
    );

    return this.transformEntry(entry);
  }

  async remove(uid: string): Promise<void> {
    const existingMember = await this.findById(uid);
    if (!existingMember) {
      throw new NotFoundException('Team member not found');
    }

    await this.contentstackService.deleteEntry(CONTENT_TYPE_UID, uid);
  }
}
