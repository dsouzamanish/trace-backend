import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AiReportService } from './ai-report.service';
import { ReportPeriod } from './entities/ai-report.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('ai-reports')
@Controller('ai-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AiReportController {
  constructor(private readonly aiReportService: AiReportService) {}

  @Post('generate/my')
  @ApiOperation({ summary: 'Generate AI report for current user (returns existing if already generated for period)' })
  @ApiQuery({ name: 'period', enum: ['weekly', 'monthly'], required: false })
  @ApiQuery({ name: 'force', type: Boolean, required: false, description: 'Force regenerate even if report exists' })
  generateMyReport(
    @CurrentUser('uid') userId: string,
    @Query('period') period: ReportPeriod = 'weekly',
    @Query('force') force?: string,
  ) {
    const forceRegenerate = force === 'true';
    return this.aiReportService.generateIndividualReport(userId, period, forceRegenerate);
  }

  @Post('generate/member/:memberId')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Generate AI report for a team member (returns existing if already generated for period)' })
  @ApiQuery({ name: 'period', enum: ['weekly', 'monthly'], required: false })
  @ApiQuery({ name: 'force', type: Boolean, required: false, description: 'Force regenerate even if report exists' })
  generateMemberReport(
    @Param('memberId') memberId: string,
    @Query('period') period: ReportPeriod = 'weekly',
    @Query('force') force?: string,
  ) {
    const forceRegenerate = force === 'true';
    return this.aiReportService.generateIndividualReport(memberId, period, forceRegenerate);
  }

  @Post('generate/team/:teamName')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Generate AI report for a team (returns existing if already generated for period)' })
  @ApiQuery({ name: 'period', enum: ['weekly', 'monthly'], required: false })
  @ApiQuery({ name: 'force', type: Boolean, required: false, description: 'Force regenerate even if report exists' })
  generateTeamReport(
    @Param('teamName') teamName: string,
    @Query('period') period: ReportPeriod = 'weekly',
    @Query('force') force?: string,
  ) {
    const forceRegenerate = force === 'true';
    return this.aiReportService.generateTeamReport(teamName, period, forceRegenerate);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get AI reports for current user' })
  getMyReports(@CurrentUser('uid') userId: string) {
    return this.aiReportService.getReportsForMember(userId);
  }

  @Get('team/:teamName')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Get AI reports for a team' })
  getTeamReports(@Param('teamName') teamName: string) {
    return this.aiReportService.getReportsForTeam(teamName);
  }

  @Get('member/:memberId')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Get AI reports for a specific team member (Manager only)' })
  getMemberReports(@Param('memberId') memberId: string) {
    return this.aiReportService.getReportsForMember(memberId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific AI report by ID' })
  getReport(@Param('id') id: string) {
    return this.aiReportService.getReportById(id);
  }
}

