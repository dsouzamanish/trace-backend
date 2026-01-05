import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { TeamStatus } from '../entities/team.entity';

export class CreateTeamDto {
  @ApiProperty({ description: 'Team name', example: 'Engineering Team' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unique team identifier', example: 'engineering' })
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @ApiPropertyOptional({ description: 'Team description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Manager UID (team member reference)' })
  @IsString()
  @IsNotEmpty()
  managerUid: string;

  @ApiPropertyOptional({ description: 'Array of member UIDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  memberUids?: string[];

  @ApiPropertyOptional({
    description: 'Team status',
    enum: ['Active', 'Inactive', 'Archived'],
    default: 'Active',
  })
  @IsEnum(['Active', 'Inactive', 'Archived'])
  @IsOptional()
  status?: TeamStatus;
}


