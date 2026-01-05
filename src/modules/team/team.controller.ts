import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { TeamService } from './team.service';
import { CreateTeamDto, UpdateTeamDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';

@ApiTags('teams')
@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Create a new team (Manager only)' })
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamService.create(createTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all teams' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Filter to active teams only',
  })
  findAll(@Query('activeOnly') activeOnly?: string) {
    if (activeOnly === 'true') {
      return this.teamService.findActiveTeams();
    }
    return this.teamService.findAll();
  }

  @Get(':uid')
  @ApiOperation({ summary: 'Get team by UID' })
  @ApiParam({ name: 'uid', description: 'Team UID' })
  findOne(@Param('uid') uid: string) {
    return this.teamService.findById(uid);
  }

  @Get('by-team-id/:teamId')
  @ApiOperation({ summary: 'Get team by team_id' })
  @ApiParam({ name: 'teamId', description: 'Team ID (e.g., engineering)' })
  findByTeamId(@Param('teamId') teamId: string) {
    return this.teamService.findByTeamId(teamId);
  }

  @Get('member/:memberUid')
  @ApiOperation({ summary: 'Get teams for a specific member' })
  @ApiParam({ name: 'memberUid', description: 'Team member UID' })
  findByMember(@Param('memberUid') memberUid: string) {
    return this.teamService.findTeamsByMember(memberUid);
  }

  @Put(':uid')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Update a team (Manager only)' })
  @ApiParam({ name: 'uid', description: 'Team UID' })
  update(@Param('uid') uid: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamService.update(uid, updateTeamDto);
  }

  @Post(':uid/members/:memberUid')
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a member to a team (Manager only)' })
  @ApiParam({ name: 'uid', description: 'Team UID' })
  @ApiParam({ name: 'memberUid', description: 'Team member UID to add' })
  addMember(
    @Param('uid') uid: string,
    @Param('memberUid') memberUid: string,
  ) {
    return this.teamService.addMember(uid, memberUid);
  }

  @Delete(':uid/members/:memberUid')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Remove a member from a team (Manager only)' })
  @ApiParam({ name: 'uid', description: 'Team UID' })
  @ApiParam({ name: 'memberUid', description: 'Team member UID to remove' })
  removeMember(
    @Param('uid') uid: string,
    @Param('memberUid') memberUid: string,
  ) {
    return this.teamService.removeMember(uid, memberUid);
  }

  @Delete(':uid')
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a team (Manager only)' })
  @ApiParam({ name: 'uid', description: 'Team UID' })
  delete(@Param('uid') uid: string) {
    return this.teamService.delete(uid);
  }
}


