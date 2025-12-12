import { Controller, Post, Get, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MigrationService } from './migration.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('migration')
@Controller('migration')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @Get('status')
  @Public()
  @ApiOperation({
    summary: 'Get migration status',
    description: 'Check which content types exist and how many entries each has',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the status of all content types',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          contentType: { type: 'string' },
          exists: { type: 'boolean' },
          entryCount: { type: 'number' },
        },
      },
    },
  })
  async getStatus() {
    return this.migrationService.getMigrationStatus();
  }

  @Post('run')
  @Public()
  @ApiOperation({
    summary: 'Run migrations',
    description: 'Create all required content types in Contentstack',
  })
  @ApiResponse({
    status: 201,
    description: 'Migration results',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          contentType: { type: 'string' },
          action: { type: 'string', enum: ['created', 'updated', 'skipped', 'error'] },
          message: { type: 'string' },
        },
      },
    },
  })
  async runMigrations() {
    return this.migrationService.runMigrations();
  }

  @Post('seed')
  @Public()
  @ApiOperation({
    summary: 'Seed sample data',
    description: 'Create sample team members and blockers for testing',
  })
  @ApiResponse({
    status: 201,
    description: 'Seed results',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          contentType: { type: 'string' },
          entriesCreated: { type: 'number' },
          entriesSkipped: { type: 'number' },
          errors: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  })
  async seedData() {
    return this.migrationService.seedData();
  }

  @Post('run-all')
  @Public()
  @ApiOperation({
    summary: 'Run migrations and seed data',
    description: 'Create content types and seed sample data in one call',
  })
  async runAll() {
    const migrationResults = await this.migrationService.runMigrations();
    
    // Only seed if migrations were successful
    const hasErrors = migrationResults.some((r) => r.action === 'error');
    if (hasErrors) {
      return {
        migrations: migrationResults,
        seed: null,
        message: 'Seeding skipped due to migration errors',
      };
    }

    // Wait a bit for content types to be fully available
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const seedResults = await this.migrationService.seedData();
    return {
      migrations: migrationResults,
      seed: seedResults,
      message: 'Migrations and seeding completed',
    };
  }

  @Delete('rollback')
  @Public()
  @ApiOperation({
    summary: 'Rollback migrations',
    description: 'Delete all content types (WARNING: This will delete all data!)',
  })
  @ApiResponse({
    status: 200,
    description: 'Rollback results',
  })
  async rollback() {
    return this.migrationService.rollbackMigrations();
  }
}

