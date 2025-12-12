import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ContentstackService } from '../contentstack/contentstack.service';
import { TeamMember, TeamMemberContentstack } from './entities/team-member.entity';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

const CONTENT_TYPE_UID = 'team_member';

@Injectable()
export class TeamMemberService {
  constructor(private contentstackService: ContentstackService) {}

  /**
   * Transform Contentstack entry to TeamMember entity
   */
  private transformEntry(entry: TeamMemberContentstack): TeamMember {
    return {
      uid: entry.uid,
      firstName: entry.first_name,
      lastName: entry.last_name,
      email: entry.email,
      slackId: entry.slack_id,
      // Use profile_pic_url (external URL) or fall back to profile_pic file URL
      profilePic: entry.profile_pic_url || entry.profile_pic?.url,
      designation: entry.designation,
      team: entry.team,
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
      { where, limit: 100 },
    );

    return entries.map((entry) => this.transformEntry(entry));
  }

  async findById(uid: string): Promise<TeamMember | null> {
    const entry = await this.contentstackService.getEntryByUid<TeamMemberContentstack>(
      CONTENT_TYPE_UID,
      uid,
    );

    return entry ? this.transformEntry(entry) : null;
  }

  async findByEmail(email: string): Promise<TeamMember | null> {
    const entry = await this.contentstackService.findEntryByField<TeamMemberContentstack>(
      CONTENT_TYPE_UID,
      'email',
      email,
    );

    return entry ? this.transformEntry(entry) : null;
  }

  async findBySlackId(slackId: string): Promise<TeamMember | null> {
    const entry = await this.contentstackService.findEntryByField<TeamMemberContentstack>(
      CONTENT_TYPE_UID,
      'slack_id',
      slackId,
    );

    return entry ? this.transformEntry(entry) : null;
  }

  async findByTeam(team: string): Promise<TeamMember[]> {
    const entries = await this.contentstackService.getEntries<TeamMemberContentstack>(
      CONTENT_TYPE_UID,
      { where: { team, status: 'Active' }, limit: 100 },
    );

    return entries.map((entry) => this.transformEntry(entry));
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
