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
  @ApiOperation({ summary: 'Generate AI report for current user' })
  @ApiQuery({ name: 'period', enum: ['weekly', 'monthly'], required: false })
  generateMyReport(
    @CurrentUser('uid') userId: string,
    @Query('period') period: ReportPeriod = 'weekly',
  ) {
    return this.aiReportService.generateIndividualReport(userId, period);
  }

  @Post('generate/member/:memberId')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Generate AI report for a team member (Manager only)' })
  @ApiQuery({ name: 'period', enum: ['weekly', 'monthly'], required: false })
  generateMemberReport(
    @Param('memberId') memberId: string,
    @Query('period') period: ReportPeriod = 'weekly',
  ) {
    return this.aiReportService.generateIndividualReport(memberId, period);
  }

  @Post('generate/team/:teamName')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Generate AI report for a team (Manager only)' })
  @ApiQuery({ name: 'period', enum: ['weekly', 'monthly'], required: false })
  generateTeamReport(
    @Param('teamName') teamName: string,
    @Query('period') period: ReportPeriod = 'weekly',
  ) {
    return this.aiReportService.generateTeamReport(teamName, period);
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

