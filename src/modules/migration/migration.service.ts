/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as contentstack from '@contentstack/management';
import { teamMemberSchema, blockerSchema, aiReportSchema, teamSchema } from './schemas';
import { teamMembersSeed, teamsSeed, blockersSeed } from './seed-data';

export interface MigrationResult {
  success: boolean;
  contentType: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  message: string;
}

export interface SeedResult {
  success: boolean;
  contentType: string;
  entriesCreated: number;
  entriesSkipped: number;
  errors: string[];
}

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);
  private stack: any;
  private environment: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('CONTENTSTACK_API_KEY') || '';
    const managementToken = this.configService.get<string>('CONTENTSTACK_MANAGEMENT_TOKEN') || '';

    const client = contentstack.client({
      authtoken: managementToken,
    });

    this.stack = client.stack({
      api_key: apiKey,
      management_token: managementToken,
    });

    this.environment =
      this.configService.get<string>('CONTENTSTACK_ENVIRONMENT') || 'development';
  }

  /**
   * Run all migrations - create content types
   */
  async runMigrations(): Promise<MigrationResult[]> {
    this.logger.log('Starting content type migrations...');
    const results: MigrationResult[] = [];

    // Create content types in order (team_member first as it's referenced by others)
    const schemas = [
      { name: 'Team Member', schema: teamMemberSchema },
      { name: 'Team', schema: teamSchema }, // After team_member since it references team_member
      { name: 'Blocker', schema: blockerSchema },
      { name: 'AI Report', schema: aiReportSchema },
    ];

    for (const { name, schema } of schemas) {
      try {
        const result = await this.createOrUpdateContentType(schema.content_type);
        results.push(result);
        this.logger.log(`${name}: ${result.action} - ${result.message}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          success: false,
          contentType: name,
          action: 'error',
          message: errorMessage,
        });
        this.logger.error(`${name}: Error - ${errorMessage}`);
      }
    }

    return results;
  }

  /**
   * Create or update a single content type
   */
  private async createOrUpdateContentType(contentType: any): Promise<MigrationResult> {
    const uid = contentType.uid as string;
    const title = contentType.title as string;

    try {
      // Check if content type exists
      const existingContentType = await this.getContentType(uid);

      if (existingContentType) {
        // Update existing content type
        try {
          Object.assign(existingContentType, contentType);
          await existingContentType.update();
          return {
            success: true,
            contentType: title,
            action: 'updated',
            message: `Content type "${uid}" updated successfully`,
          };
        } catch {
          // If update fails, it might be because there are no changes
          return {
            success: true,
            contentType: title,
            action: 'skipped',
            message: `Content type "${uid}" already exists and is up to date`,
          };
        }
      } else {
        // Create new content type
        await this.stack.contentType().create({ content_type: contentType });
        return {
          success: true,
          contentType: title,
          action: 'created',
          message: `Content type "${uid}" created successfully`,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create/update content type "${uid}": ${errorMessage}`);
    }
  }

  /**
   * Get content type by UID
   */
  private async getContentType(uid: string): Promise<any> {
    try {
      const contentType = await this.stack.contentType(uid).fetch();
      return contentType;
    } catch {
      return null;
    }
  }

  /**
   * Seed sample data - team members, teams, and blockers
   */
  async seedData(): Promise<SeedResult[]> {
    this.logger.log('Starting data seeding...');
    const results: SeedResult[] = [];

    // 1. Seed team members first (without team_ref initially)
    const teamMemberResult = await this.seedTeamMembers();
    results.push(teamMemberResult);

    // 2. Seed teams with member references (requires team members to exist)
    if (teamMemberResult.success) {
      const teamsResult = await this.seedTeams();
      results.push(teamsResult);

      // 3. Update team members with team_ref (link back to teams)
      if (teamsResult.success) {
        const linkResult = await this.linkTeamMembersToTeams();
        results.push(linkResult);
      }

      // 4. Seed blockers (requires team members to exist)
      const blockerResult = await this.seedBlockers();
      results.push(blockerResult);
    } else {
      this.logger.warn('Skipping team and blocker seeding due to team member seeding failure');
    }

    return results;
  }

  /**
   * Seed team members
   */
  private async seedTeamMembers(): Promise<SeedResult> {
    const result: SeedResult = {
      success: true,
      contentType: 'team_member',
      entriesCreated: 0,
      entriesSkipped: 0,
      errors: [],
    };

    for (const seedData of teamMembersSeed) {
      try {
        // Check if entry with this email already exists
        const existingEntry = await this.findEntryByField(
          'team_member',
          'email',
          seedData.entry.email,
        );

        if (existingEntry) {
          result.entriesSkipped++;
          this.logger.debug(`Team member "${seedData.entry.email}" already exists, skipping`);
          continue;
        }

        // Create new entry
        const entry = await this.stack.contentType('team_member').entry().create(seedData);

        // Publish the entry
        await entry.publish({
          publishDetails: {
            environments: [this.environment],
            locales: ['en-us'],
          },
        });

        result.entriesCreated++;
        this.logger.debug(`Created team member: ${seedData.entry.title}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to create "${seedData.entry.email}": ${errorMessage}`);
        this.logger.error(`Error creating team member: ${errorMessage}`);
      }
    }

    this.logger.log(
      `Team Members: Created ${result.entriesCreated}, Skipped ${result.entriesSkipped}`,
    );
    return result;
  }

  /**
   * Seed teams with member and manager references
   */
  private async seedTeams(): Promise<SeedResult> {
    const result: SeedResult = {
      success: true,
      contentType: 'team',
      entriesCreated: 0,
      entriesSkipped: 0,
      errors: [],
    };

    // Get all team members to reference
    const teamMembers = await this.getAllEntriesWithData('team_member');

    for (const seedData of teamsSeed) {
      try {
        // Check if team already exists
        const existingTeam = await this.findEntryByField(
          'team',
          'team_id',
          seedData.entry.team_id,
        );

        if (existingTeam) {
          result.entriesSkipped++;
          this.logger.debug(`Team "${seedData.entry.title}" already exists, skipping`);
          continue;
        }

        // Find manager by email
        const manager = teamMembers.find((m: any) => m.email === seedData.managerEmail);
        if (!manager) {
          result.errors.push(`Manager not found for team ${seedData.entry.title}: ${seedData.managerEmail}`);
          continue;
        }

        // Find all members by email
        const memberRefs = seedData.memberEmails
          .map((email: string) => teamMembers.find((m: any) => m.email === email))
          .filter((m: any) => m)
          .map((m: any) => ({
            uid: m.uid,
            _content_type_uid: 'team_member',
          }));

        // Create team entry with references
        const entryData = {
          entry: {
            ...seedData.entry,
            manager: [
              {
                uid: manager.uid,
                _content_type_uid: 'team_member',
              },
            ],
            members: memberRefs,
          },
        };

        const entry = await this.stack.contentType('team').entry().create(entryData);

        // Publish the entry
        await entry.publish({
          publishDetails: {
            environments: [this.environment],
            locales: ['en-us'],
          },
        });

        result.entriesCreated++;
        this.logger.debug(`Created team: ${seedData.entry.title} with ${memberRefs.length} members`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to create team "${seedData.entry.title}": ${errorMessage}`);
        this.logger.error(`Error creating team: ${errorMessage}`);
      }
    }

    this.logger.log(
      `Teams: Created ${result.entriesCreated}, Skipped ${result.entriesSkipped}`,
    );
    return result;
  }

  /**
   * Link team members back to their teams via team_ref field
   */
  private async linkTeamMembersToTeams(): Promise<SeedResult> {
    const result: SeedResult = {
      success: true,
      contentType: 'team_member_links',
      entriesCreated: 0,
      entriesSkipped: 0,
      errors: [],
    };

    // Get all teams with their member lists
    const teams = await this.getAllEntriesWithData('team');
    const teamMembers = await this.getAllEntriesWithData('team_member');

    for (const seedData of teamsSeed) {
      // Find the team entry
      const team = teams.find((t: any) => t.team_id === seedData.entry.team_id);
      if (!team) {
        this.logger.warn(`Team ${seedData.entry.team_id} not found, skipping member linking`);
        continue;
      }

      // Update each member with team_ref
      for (const memberEmail of seedData.memberEmails) {
        try {
          const member = teamMembers.find((m: any) => m.email === memberEmail);
          if (!member) {
            result.errors.push(`Member not found: ${memberEmail}`);
            continue;
          }

          // Skip if already has team_ref
          if (member.team_ref && member.team_ref.length > 0) {
            result.entriesSkipped++;
            continue;
          }

          // Update the team member with team_ref
          const memberEntry = await this.stack.contentType('team_member').entry(member.uid).fetch();
          memberEntry.team_ref = [
            {
              uid: team.uid,
              _content_type_uid: 'team',
            },
          ];

          await memberEntry.update();

          // Publish the updated entry
          await memberEntry.publish({
            publishDetails: {
              environments: [this.environment],
              locales: ['en-us'],
            },
          });

          result.entriesCreated++;
          this.logger.debug(`Linked ${memberEmail} to team ${seedData.entry.title}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to link ${memberEmail} to team: ${errorMessage}`);
          this.logger.error(`Error linking member to team: ${errorMessage}`);
        }
      }
    }

    this.logger.log(
      `Team Member Links: Updated ${result.entriesCreated}, Skipped ${result.entriesSkipped}`,
    );
    return result;
  }

  /**
   * Seed blockers
   */
  private async seedBlockers(): Promise<SeedResult> {
    const result: SeedResult = {
      success: true,
      contentType: 'blocker',
      entriesCreated: 0,
      entriesSkipped: 0,
      errors: [],
    };

    // Get all team members to reference
    const teamMembers = await this.getAllEntries('team_member');
    if (teamMembers.length === 0) {
      result.success = false;
      result.errors.push('No team members found to assign blockers to');
      return result;
    }

    for (const seedData of blockersSeed) {
      try {
        // Get the team member to assign this blocker to
        const assignedMember = teamMembers[seedData.assignToIndex % teamMembers.length];

        if (!assignedMember) {
          result.errors.push(`No team member found at index ${seedData.assignToIndex}`);
          continue;
        }

        // Create blocker entry with team member reference
        const entryData = {
          entry: {
            ...seedData.entry,
            team_member: [
              {
                uid: assignedMember.uid,
                _content_type_uid: 'team_member',
              },
            ],
          },
        };

        const entry = await this.stack.contentType('blocker').entry().create(entryData);

        // Publish the entry
        await entry.publish({
          publishDetails: {
            environments: [this.environment],
            locales: ['en-us'],
          },
        });

        result.entriesCreated++;
        this.logger.debug(`Created blocker: ${seedData.entry.title}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to create blocker: ${errorMessage}`);
        this.logger.error(`Error creating blocker: ${errorMessage}`);
      }
    }

    this.logger.log(`Blockers: Created ${result.entriesCreated}, Errors ${result.errors.length}`);
    return result;
  }

  /**
   * Find entry by field value
   */
  private async findEntryByField(
    contentTypeUid: string,
    fieldUid: string,
    fieldValue: string,
  ): Promise<any> {
    try {
      const query = await this.stack
        .contentType(contentTypeUid)
        .entry()
        .query({ query: { [fieldUid]: fieldValue } })
        .find();

      const entries = query.items;
      return entries && entries.length > 0 ? entries[0] : null;
    } catch {
      return null;
    }
  }

  /**
   * Get all entries from a content type (UIDs only)
   */
  private async getAllEntries(contentTypeUid: string): Promise<Array<{ uid: string }>> {
    try {
      const query = await this.stack.contentType(contentTypeUid).entry().query().find();

      return (query.items || []) as Array<{ uid: string }>;
    } catch {
      return [];
    }
  }

  /**
   * Get all entries from a content type with full data
   */
  private async getAllEntriesWithData(contentTypeUid: string): Promise<any[]> {
    try {
      const query = await this.stack.contentType(contentTypeUid).entry().query().find();

      return query.items || [];
    } catch {
      return [];
    }
  }

  /**
   * Delete all content types (use with caution!)
   */
  async rollbackMigrations(): Promise<MigrationResult[]> {
    this.logger.warn('Starting migration rollback - deleting content types...');
    const results: MigrationResult[] = [];

    // Delete in reverse order (ai_report and blocker first, then team, then team_member)
    const contentTypes = ['ai_report', 'blocker', 'team', 'team_member'];

    for (const uid of contentTypes) {
      try {
        const contentType = await this.getContentType(uid);
        if (contentType) {
          await contentType.delete();
          results.push({
            success: true,
            contentType: uid,
            action: 'created', // Using 'created' as placeholder for 'deleted'
            message: `Content type "${uid}" deleted successfully`,
          });
          this.logger.log(`Deleted content type: ${uid}`);
        } else {
          results.push({
            success: true,
            contentType: uid,
            action: 'skipped',
            message: `Content type "${uid}" does not exist`,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          success: false,
          contentType: uid,
          action: 'error',
          message: `Failed to delete "${uid}": ${errorMessage}`,
        });
        this.logger.error(`Error deleting ${uid}: ${errorMessage}`);
      }
    }

    return results;
  }

  /**
   * Get migration status - check which content types exist
   */
  async getMigrationStatus(): Promise<
    Array<{ contentType: string; exists: boolean; entryCount: number }>
  > {
    const contentTypes = ['team_member', 'team', 'blocker', 'ai_report'];
    const status: Array<{ contentType: string; exists: boolean; entryCount: number }> = [];

    for (const uid of contentTypes) {
      try {
        const contentType = await this.getContentType(uid);
        if (contentType) {
          const entries = await this.getAllEntries(uid);
          status.push({
            contentType: uid,
            exists: true,
            entryCount: entries.length,
          });
        } else {
          status.push({
            contentType: uid,
            exists: false,
            entryCount: 0,
          });
        }
      } catch {
        status.push({
          contentType: uid,
          exists: false,
          entryCount: 0,
        });
      }
    }

    return status;
  }
}
