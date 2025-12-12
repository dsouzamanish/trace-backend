import { IsString, IsEmail, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Designation, MemberStatus } from '../entities/team-member.entity';

export class CreateTeamMemberDto {
  @ApiProperty({ description: 'First name of the team member' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name of the team member' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Email address (used for login/Slack mapping)' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Slack user ID' })
  @IsOptional()
  @IsString()
  slackId?: string;

  @ApiPropertyOptional({ description: 'Profile picture URL' })
  @IsOptional()
  @IsString()
  profilePic?: string;

  @ApiPropertyOptional({
    enum: ['Engineer', 'Sr. Engineer', 'Tech Lead', 'QA', 'Manager', 'Other'],
    description: 'Role/designation of the team member',
  })
  @IsOptional()
  @IsIn(['Engineer', 'Sr. Engineer', 'Tech Lead', 'QA', 'Manager', 'Other'])
  designation?: Designation;

  @ApiPropertyOptional({ description: 'Team name' })
  @IsOptional()
  @IsString()
  team?: string;

  @ApiPropertyOptional({ description: 'Whether the user has manager privileges' })
  @IsOptional()
  @IsBoolean()
  isManager?: boolean;

  @ApiPropertyOptional({ enum: ['Active', 'Inactive'], default: 'Active' })
  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: MemberStatus;
}

