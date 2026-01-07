import { IsString, IsOptional, IsIn, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Designation } from '../../team-member/entities/team-member.entity';

/**
 * DTO for users to update their own profile.
 * Limited to fields that users are allowed to change themselves.
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Profile picture URL' })
  @IsOptional()
  @IsString()
  profilePic?: string;

  @ApiPropertyOptional({
    enum: ['Engineer', 'Sr. Engineer', 'Tech Lead', 'QA', 'Manager', 'Other'],
    description: 'Role/designation',
  })
  @IsOptional()
  @IsIn(['Engineer', 'Sr. Engineer', 'Tech Lead', 'QA', 'Manager', 'Other'])
  designation?: Designation;

  @ApiPropertyOptional({ description: 'Date when user joined the team (ISO date string)' })
  @IsOptional()
  @IsDateString()
  joinedDate?: string;
}

