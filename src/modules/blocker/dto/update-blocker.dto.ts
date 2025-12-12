import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BlockerCategory, BlockerSeverity, BlockerStatus } from '../entities/blocker.entity';

export class UpdateBlockerDto {
  @ApiPropertyOptional({ description: 'Updated description of the blocker' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: ['Process', 'Technical', 'Dependency', 'Infrastructure', 'Other'],
    description: 'Updated category',
  })
  @IsOptional()
  @IsIn(['Process', 'Technical', 'Dependency', 'Infrastructure', 'Other'])
  category?: BlockerCategory;

  @ApiPropertyOptional({
    enum: ['Low', 'Medium', 'High'],
    description: 'Updated severity level',
  })
  @IsOptional()
  @IsIn(['Low', 'Medium', 'High'])
  severity?: BlockerSeverity;

  @ApiPropertyOptional({
    enum: ['Open', 'Resolved', 'Ignored'],
    description: 'Updated status',
  })
  @IsOptional()
  @IsIn(['Open', 'Resolved', 'Ignored'])
  status?: BlockerStatus;

  @ApiPropertyOptional({ description: 'Manager notes or resolution comments' })
  @IsOptional()
  @IsString()
  managerNotes?: string;
}

