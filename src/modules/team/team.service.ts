import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ContentstackService } from '../contentstack/contentstack.service';
import { Team, TeamContentstack } from './entities/team.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamMember } from '../team-member/entities/team-member.entity';

const CONTENT_TYPE_UID = 'team';

@Injectable()
export class TeamService {
  constructor(private contentstackService: ContentstackService) {}

  /**
   * Transform Contentstack entry to Team entity
   */
  private transformEntry(entry: TeamContentstack): Team {
    return {
      uid: entry.uid,
      name: entry.title,
      teamId: entry.team_id,
      description: entry.description,
      managerUid: entry.manager?.[0]?.uid,
      manager: entry.manager?.[0] as TeamMember | undefined,
      memberUids: entry.members?.map((m) => m.uid) || [],
      members: entry.members as TeamMember[] | undefined,
      status: entry.status,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    };
  }

  /**
   * Transform Team data to Contentstack format
   */
  private toContentstackFormat(
    data: CreateTeamDto | UpdateTeamDto,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if ('name' in data && data.name) {
      result.title = data.name;
    }

    if ('teamId' in data && data.teamId) {
      result.team_id = data.teamId;
    }

    if (data.description !== undefined) {
      result.description = data.description;
    }

    if (data.managerUid) {
      result.manager = [
        { uid: data.managerUid, _content_type_uid: 'team_member' },
      ];
    }

    if (data.memberUids) {
      result.members = data.memberUids.map((uid) => ({
        uid,
        _content_type_uid: 'team_member',
      }));
    }

    if (data.status) {
      result.status = data.status;
    }

    return result;
  }

  /**
   * Create a new team
   */
  async create(createTeamDto: CreateTeamDto): Promise<Team> {
    // Check if team with this ID already exists
    const existingTeam = await this.findByTeamId(createTeamDto.teamId);
    if (existingTeam) {
      throw new ConflictException(
        `Team with ID "${createTeamDto.teamId}" already exists`,
      );
    }

    const data = this.toContentstackFormat(createTeamDto);
    data.status = createTeamDto.status || 'Active';

    const entry = await this.contentstackService.createEntry<TeamContentstack>(
      CONTENT_TYPE_UID,
      data,
    );

    return this.transformEntry(entry);
  }

  /**
   * Get all teams
   */
  async findAll(): Promise<Team[]> {
    const entries = await this.contentstackService.getEntries<TeamContentstack>(
      CONTENT_TYPE_UID,
      {
        includeReference: ['manager', 'members'],
        limit: 100,
      },
    );

    return entries.map((entry) => this.transformEntry(entry));
  }

  /**
   * Get team by UID
   */
  async findById(uid: string): Promise<Team | null> {
    const entry =
      await this.contentstackService.getEntryByUid<TeamContentstack>(
        CONTENT_TYPE_UID,
        uid,
        ['manager', 'members'],
      );

    return entry ? this.transformEntry(entry) : null;
  }

  /**
   * Get team by team_id
   */
  async findByTeamId(teamId: string): Promise<Team | null> {
    const entry =
      await this.contentstackService.findEntryByField<TeamContentstack>(
        CONTENT_TYPE_UID,
        'team_id',
        teamId,
      );

    return entry ? this.transformEntry(entry) : null;
  }

  /**
   * Get team by name (title field) with resolved members
   */
  async findByName(name: string): Promise<Team | null> {
    const entries = await this.contentstackService.getEntries<TeamContentstack>(
      CONTENT_TYPE_UID,
      {
        where: { title: name },
        includeReference: ['manager', 'members'],
        limit: 1,
      },
    );

    return entries.length > 0 ? this.transformEntry(entries[0]) : null;
  }

  /**
   * Update a team
   */
  async update(uid: string, updateTeamDto: UpdateTeamDto): Promise<Team> {
    const existingTeam = await this.findById(uid);
    if (!existingTeam) {
      throw new NotFoundException(`Team with UID "${uid}" not found`);
    }

    const data = this.toContentstackFormat(updateTeamDto);

    const entry =
      await this.contentstackService.updateEntry<TeamContentstack>(
        CONTENT_TYPE_UID,
        uid,
        data,
      );

    return this.transformEntry(entry);
  }

  /**
   * Delete a team
   */
  async delete(uid: string): Promise<void> {
    const existingTeam = await this.findById(uid);
    if (!existingTeam) {
      throw new NotFoundException(`Team with UID "${uid}" not found`);
    }

    await this.contentstackService.deleteEntry(CONTENT_TYPE_UID, uid);
  }

  /**
   * Add a member to a team
   */
  async addMember(teamUid: string, memberUid: string): Promise<Team> {
    const team = await this.findById(teamUid);
    if (!team) {
      throw new NotFoundException(`Team with UID "${teamUid}" not found`);
    }

    const currentMemberUids = team.memberUids || [];
    if (currentMemberUids.includes(memberUid)) {
      return team; // Already a member
    }

    return this.update(teamUid, {
      memberUids: [...currentMemberUids, memberUid],
    });
  }

  /**
   * Remove a member from a team
   */
  async removeMember(teamUid: string, memberUid: string): Promise<Team> {
    const team = await this.findById(teamUid);
    if (!team) {
      throw new NotFoundException(`Team with UID "${teamUid}" not found`);
    }

    const currentMemberUids = team.memberUids || [];
    const updatedMemberUids = currentMemberUids.filter(
      (uid) => uid !== memberUid,
    );

    return this.update(teamUid, {
      memberUids: updatedMemberUids,
    });
  }

  /**
   * Get teams for a specific member
   */
  async findTeamsByMember(memberUid: string): Promise<Team[]> {
    const allTeams = await this.findAll();
    return allTeams.filter(
      (team) =>
        team.memberUids?.includes(memberUid) || team.managerUid === memberUid,
    );
  }

  /**
   * Get active teams only
   */
  async findActiveTeams(): Promise<Team[]> {
    const entries = await this.contentstackService.getEntries<TeamContentstack>(
      CONTENT_TYPE_UID,
      {
        where: { status: 'Active' },
        includeReference: ['manager', 'members'],
        limit: 100,
      },
    );

    return entries.map((entry) => this.transformEntry(entry));
  }

  /**
   * Check if a team member is a manager of any team
   * Returns true if the member is set as the manager in any Team entry
   */
  async isTeamManager(memberUid: string): Promise<boolean> {
    const allTeams = await this.findAll();
    return allTeams.some((team) => team.managerUid === memberUid);
  }

  /**
   * Get teams where the member is a manager
   */
  async findTeamsManagedBy(memberUid: string): Promise<Team[]> {
    const allTeams = await this.findAll();
    return allTeams.filter((team) => team.managerUid === memberUid);
  }
}


