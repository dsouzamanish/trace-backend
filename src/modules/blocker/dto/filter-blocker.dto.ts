import { IsOptional, IsIn, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { BlockerCategory, BlockerSeverity, BlockerStatus } from '../entities/blocker.entity';

export class FilterBlockerDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by team member UID' })
  @IsOptional()
  @IsString()
  teamMemberUid?: string;

  @ApiPropertyOptional({
    enum: ['Process', 'Technical', 'Dependency', 'Infrastructure', 'Communication', 'Resource', 'Knowledge', 'Access', 'External', 'Review', 'Customer Escalation', 'Other'],
  })
  @IsOptional()
  @IsIn(['Process', 'Technical', 'Dependency', 'Infrastructure', 'Communication', 'Resource', 'Knowledge', 'Access', 'External', 'Review', 'Customer Escalation', 'Other'])
  category?: BlockerCategory;

  @ApiPropertyOptional({ enum: ['Low', 'Medium', 'High'] })
  @IsOptional()
  @IsIn(['Low', 'Medium', 'High'])
  severity?: BlockerSeverity;

  @ApiPropertyOptional({ enum: ['Open', 'Resolved', 'Ignored'] })
  @IsOptional()
  @IsIn(['Open', 'Resolved', 'Ignored'])
  status?: BlockerStatus;

  @ApiPropertyOptional({ description: 'Filter by team name' })
  @IsOptional()
  @IsString()
  team?: string;

  @ApiPropertyOptional({ description: 'Filter blockers from this date' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter blockers until this date' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

