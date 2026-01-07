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
  Header,
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
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  findAll(
    @Query('team') team?: string,
    @Query('isManager') isManager?: boolean,
  ) {
    return this.teamMemberService.findAll({ team, isManager });
  }

  @Get('by-team-uid/:teamUid')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Get all team members by team UID (recommended - uses Team reference)' })
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  findByTeamUid(@Param('teamUid') teamUid: string) {
    return this.teamMemberService.findByTeamUid(teamUid);
  }

  @Get('team/:teamName')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Get all team members by team name (uses Team reference)' })
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  findByTeam(@Param('teamName') teamName: string) {
    return this.teamMemberService.findByTeam(teamName);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a team member by ID' })
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  findOne(@Param('id') id: string) {
    return this.teamMemberService.findById(id);
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

