import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TeamMemberService } from './team-member.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';

@ApiTags('team-members')
@Controller('team-members')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TeamMemberController {
  constructor(private readonly teamMemberService: TeamMemberService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new team member (Admin only)' })
  create(@Body() createTeamMemberDto: CreateTeamMemberDto) {
    return this.teamMemberService.create(createTeamMemberDto);
  }

  @Get()
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Get all team members (Manager/Admin only)' })
  @ApiQuery({ name: 'team', required: false, description: 'Filter by team name' })
  @ApiQuery({ name: 'isManager', required: false, type: Boolean, description: 'Filter by manager status' })
  findAll(
    @Query('team') team?: string,
    @Query('isManager') isManager?: boolean,
  ) {
    return this.teamMemberService.findAll({ team, isManager });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a team member by ID' })
  findOne(@Param('id') id: string) {
    return this.teamMemberService.findById(id);
  }

  @Get('team/:teamName')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Get all team members in a specific team' })
  findByTeam(@Param('teamName') teamName: string) {
    return this.teamMemberService.findByTeam(teamName);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a team member (Admin only)' })
  update(@Param('id') id: string, @Body() updateTeamMemberDto: UpdateTeamMemberDto) {
    return this.teamMemberService.update(id, updateTeamMemberDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a team member (Admin only)' })
  remove(@Param('id') id: string) {
    return this.teamMemberService.remove(id);
  }
}

