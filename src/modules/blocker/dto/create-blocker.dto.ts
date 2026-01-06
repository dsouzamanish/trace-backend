import { IsString, IsNotEmpty, IsIn, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BlockerCategory, BlockerSeverity } from '../entities/blocker.entity';

export class CreateBlockerDto {
  @ApiProperty({ description: 'UID of the team member reporting the blocker' })
  @IsString()
  @IsNotEmpty()
  teamMemberUid: string;

  @ApiProperty({ description: 'Description of the blocker' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    enum: ['Process', 'Technical', 'Dependency', 'Infrastructure', 'Communication', 'Resource', 'Knowledge', 'Access', 'External', 'Review', 'Other'],
    description: 'Category of the blocker',
  })
  @IsIn(['Process', 'Technical', 'Dependency', 'Infrastructure', 'Communication', 'Resource', 'Knowledge', 'Access', 'External', 'Review', 'Other'])
  category: BlockerCategory;

  @ApiProperty({
    enum: ['Low', 'Medium', 'High'],
    description: 'Severity level of the blocker',
  })
  @IsIn(['Low', 'Medium', 'High'])
  severity: BlockerSeverity;

  @ApiPropertyOptional({ description: 'Timestamp when the blocker was reported' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Source of the report',
    default: 'Web',
  })
  @IsOptional()
  @IsString()
  reportedVia?: string;

  @ApiPropertyOptional({ description: 'Slack message ID for cross-reference' })
  @IsOptional()
  @IsString()
  slackMessageId?: string;
}

