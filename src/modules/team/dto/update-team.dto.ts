import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { TeamStatus } from '../entities/team.entity';

export class UpdateTeamDto {
  @ApiPropertyOptional({ description: 'Team name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Team description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Manager UID (team member reference)' })
  @IsString()
  @IsOptional()
  managerUid?: string;

  @ApiPropertyOptional({ description: 'Array of member UIDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  memberUids?: string[];

  @ApiPropertyOptional({
    description: 'Team status',
    enum: ['Active', 'Inactive', 'Archived'],
  })
  @IsEnum(['Active', 'Inactive', 'Archived'])
  @IsOptional()
  status?: TeamStatus;
}


