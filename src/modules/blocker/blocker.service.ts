import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ContentstackService } from '../contentstack/contentstack.service';
import { TeamMemberService } from '../team-member/team-member.service';
import {
  Blocker,
  BlockerContentstack,
  BlockerStats,
  BlockerCategory,
  BlockerSeverity,
  BlockerStatus,
} from './entities/blocker.entity';
import { CreateBlockerDto } from './dto/create-blocker.dto';
import { UpdateBlockerDto } from './dto/update-blocker.dto';
import { FilterBlockerDto } from './dto/filter-blocker.dto';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';

const CONTENT_TYPE_UID = 'blocker';

@Injectable()
export class BlockerService {
  constructor(
    private contentstackService: ContentstackService,
    private teamMemberService: TeamMemberService,
  ) {}

  /**
   * Transform Contentstack entry to Blocker entity
   */
  private transformEntry(entry: BlockerContentstack): Blocker {
    const teamMemberRef = Array.isArray(entry.team_member)
      ? entry.team_member[0]?.uid
      : entry.team_member;

    return {
      uid: entry.uid,
      teamMember: teamMemberRef as string,
      description: entry.description,
      category: entry.category,
      severity: entry.severity,
      timestamp: entry.timestamp,
      status: entry.status,
      reportedVia: entry.reported_via,
      managerNotes: entry.manager_notes,
      slackMessageId: entry.slack_message_id,
      attachments: entry.attachments?.map((a) => a.url),
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    };
  }

  /**
   * Transform DTO to Contentstack entry format
   */
  private toContentstackFormat(
    dto: CreateBlockerDto | UpdateBlockerDto,
    teamMemberUid?: string,
  ): Record<string, unknown> {
    const entry: Record<string, unknown> = {};

    if ('description' in dto && dto.description) entry.description = dto.description;
    if ('category' in dto && dto.category) entry.category = dto.category;
    if ('severity' in dto && dto.severity) entry.severity = dto.severity;
    if ('status' in dto && dto.status) entry.status = dto.status;
    if ('managerNotes' in dto) entry.manager_notes = dto.managerNotes;

    if ('timestamp' in dto) {
      entry.timestamp = dto.timestamp || new Date().toISOString();
    }

    if ('reportedVia' in dto) {
      entry.reported_via = dto.reportedVia || 'Web';
    }

    if ('slackMessageId' in dto) {
      entry.slack_message_id = dto.slackMessageId;
    }

    // Set team member reference
    if (teamMemberUid) {
      entry.team_member = [{ uid: teamMemberUid, _content_type_uid: 'team_member' }];
    }

    // Generate title for Contentstack
    if (dto.category && dto.description) {
      const shortDesc = dto.description.substring(0, 30);
      entry.title = `${dto.category} - ${shortDesc}`;
    }

    return entry;
  }

  async create(createDto: CreateBlockerDto): Promise<Blocker> {
    // Verify team member exists
    const teamMember = await this.teamMemberService.findById(createDto.teamMemberUid);
    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    const data = this.toContentstackFormat(
      {
        ...createDto,
        timestamp: createDto.timestamp || new Date().toISOString(),
        reportedVia: createDto.reportedVia || 'Web',
      },
      createDto.teamMemberUid,
    );

    // Set initial status
    data.status = 'Open';

    const entry = await this.contentstackService.createEntry<BlockerContentstack>(
      CONTENT_TYPE_UID,
      data,
    );

    return this.transformEntry(entry);
  }

  async findAll(filterDto: FilterBlockerDto): Promise<{ blockers: Blocker[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (filterDto.category) {
      where.category = filterDto.category;
    }
    if (filterDto.severity) {
      where.severity = filterDto.severity;
    }
    if (filterDto.status) {
      where.status = filterDto.status;
    }

    const entries = await this.contentstackService.getEntries<BlockerContentstack>(CONTENT_TYPE_UID, {
      where,
      limit: filterDto.limit,
      skip: filterDto.skip,
      includeReference: ['team_member'],
    });

    const total = await this.contentstackService.getEntryCount(CONTENT_TYPE_UID, where);

    return {
      blockers: entries.map((entry) => this.transformEntry(entry)),
      total,
    };
  }

  async findById(uid: string): Promise<Blocker | null> {
    const entry = await this.contentstackService.getEntryByUid<BlockerContentstack>(
      CONTENT_TYPE_UID,
      uid,
      ['team_member'],
    );

    return entry ? this.transformEntry(entry) : null;
  }

  async findByTeamMember(
    teamMemberUid: string,
    filterDto?: FilterBlockerDto,
  ): Promise<{ blockers: Blocker[]; total: number }> {
    const where: Record<string, unknown> = {
      'team_member.uid': teamMemberUid,
    };

    if (filterDto?.category) {
      where.category = filterDto.category;
    }
    if (filterDto?.severity) {
      where.severity = filterDto.severity;
    }
    if (filterDto?.status) {
      where.status = filterDto.status;
    }

    const entries = await this.contentstackService.getEntries<BlockerContentstack>(CONTENT_TYPE_UID, {
      where,
      limit: filterDto?.limit || 10,
      skip: filterDto?.skip || 0,
      includeReference: ['team_member'],
    });

    const total = await this.contentstackService.getEntryCount(CONTENT_TYPE_UID, where);

    return {
      blockers: entries.map((entry) => this.transformEntry(entry)),
      total,
    };
  }

  async findByTeam(
    team: string,
    filterDto?: FilterBlockerDto,
  ): Promise<{ blockers: Blocker[]; total: number }> {
    // First get all team members in the team
    const teamMembers = await this.teamMemberService.findByTeam(team);
    const teamMemberUids = teamMembers.map((m) => m.uid);

    if (teamMemberUids.length === 0) {
      return { blockers: [], total: 0 };
    }

    // Fetch blockers for all team members
    const allBlockers: Blocker[] = [];

    for (const uid of teamMemberUids) {
      const { blockers } = await this.findByTeamMember(uid, filterDto);
      allBlockers.push(...blockers);
    }

    // Sort by timestamp descending
    allBlockers.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      blockers: allBlockers,
      total: allBlockers.length,
    };
  }

  async update(uid: string, updateDto: UpdateBlockerDto, user: CurrentUserData): Promise<Blocker> {
    const existingBlocker = await this.findById(uid);
    if (!existingBlocker) {
      throw new NotFoundException('Blocker not found');
    }

    // Check permissions: only owner or manager can update
    const isOwner = existingBlocker.teamMember === user.uid;
    const isManager = user.isManager;

    if (!isOwner && !isManager) {
      throw new ForbiddenException('You do not have permission to update this blocker');
    }

    // Only managers can update manager_notes
    if (updateDto.managerNotes && !isManager) {
      throw new ForbiddenException('Only managers can add manager notes');
    }

    const data = this.toContentstackFormat(updateDto);
    const entry = await this.contentstackService.updateEntry<BlockerContentstack>(
      CONTENT_TYPE_UID,
      uid,
      data,
    );

    return this.transformEntry(entry);
  }

  async getStatsForUser(teamMemberUid: string): Promise<BlockerStats> {
    const { blockers } = await this.findByTeamMember(teamMemberUid, { limit: 1000 } as FilterBlockerDto);
    return this.calculateStats(blockers);
  }

  async getStatsForTeam(team: string): Promise<BlockerStats> {
    const { blockers } = await this.findByTeam(team, { limit: 1000 } as FilterBlockerDto);
    return this.calculateStats(blockers);
  }

  private calculateStats(blockers: Blocker[]): BlockerStats {
    const byCategory: Record<BlockerCategory, number> = {
      Process: 0,
      Technical: 0,
      Dependency: 0,
      Infrastructure: 0,
      Communication: 0,
      Resource: 0,
      Knowledge: 0,
      Access: 0,
      External: 0,
      Review: 0,
      'Customer Escalation': 0,
      Other: 0,
    };

    const bySeverity: Record<BlockerSeverity, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
    };

    const byStatus: Record<BlockerStatus, number> = {
      Open: 0,
      Resolved: 0,
      Ignored: 0,
    };

    const weeklyData: Record<string, number> = {};

    blockers.forEach((blocker) => {
      byCategory[blocker.category]++;
      bySeverity[blocker.severity]++;
      byStatus[blocker.status]++;

      // Calculate week
      const date = new Date(blocker.timestamp);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
    });

    // Convert weekly data to array and sort
    const weeklyTrend = Object.entries(weeklyData)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12); // Last 12 weeks

    return {
      total: blockers.length,
      byCategory,
      bySeverity,
      byStatus,
      weeklyTrend,
    };
  }
}

