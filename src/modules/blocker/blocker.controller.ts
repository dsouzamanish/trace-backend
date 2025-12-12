import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BlockerService } from './blocker.service';
import { CreateBlockerDto } from './dto/create-blocker.dto';
import { UpdateBlockerDto } from './dto/update-blocker.dto';
import { FilterBlockerDto } from './dto/filter-blocker.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('blockers')
@Controller('blockers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BlockerController {
  constructor(private readonly blockerService: BlockerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new blocker' })
  create(@Body() createBlockerDto: CreateBlockerDto) {
    return this.blockerService.create(createBlockerDto);
  }

  @Get()
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Get all blockers with filters (Manager/Admin only)' })
  findAll(@Query() filterDto: FilterBlockerDto) {
    return this.blockerService.findAll(filterDto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user blockers' })
  findMyBlockers(
    @CurrentUser('uid') userId: string,
    @Query() filterDto: FilterBlockerDto,
  ) {
    return this.blockerService.findByTeamMember(userId, filterDto);
  }

  @Get('my/stats')
  @ApiOperation({ summary: 'Get statistics for current user blockers' })
  getMyStats(@CurrentUser('uid') userId: string) {
    return this.blockerService.getStatsForUser(userId);
  }

  @Get('team/:teamName')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Get blockers for a specific team' })
  findByTeam(
    @Param('teamName') teamName: string,
    @Query() filterDto: FilterBlockerDto,
  ) {
    return this.blockerService.findByTeam(teamName, filterDto);
  }

  @Get('team/:teamName/stats')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Get statistics for a team' })
  getTeamStats(@Param('teamName') teamName: string) {
    return this.blockerService.getStatsForTeam(teamName);
  }

  @Get('member/:memberId')
  @Roles(Role.MANAGER)
  @ApiOperation({ summary: 'Get blockers for a specific team member' })
  findByMember(
    @Param('memberId') memberId: string,
    @Query() filterDto: FilterBlockerDto,
  ) {
    return this.blockerService.findByTeamMember(memberId, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific blocker by ID' })
  findOne(@Param('id') id: string) {
    return this.blockerService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a blocker' })
  update(
    @Param('id') id: string,
    @Body() updateBlockerDto: UpdateBlockerDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.blockerService.update(id, updateBlockerDto, user);
  }
}

