import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TeamMemberService } from '../team-member/team-member.service';
import { TeamService } from '../team/team.service';
import { TeamMember } from '../team-member/entities/team-member.entity';

export interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  isManager: boolean;
  isAdmin?: boolean;
  team?: string;
  managedTeams?: string[]; // UIDs of teams managed by this user
}

export interface AuthResponse {
  accessToken: string;
  user: {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePic?: string;
    designation?: string;
    team?: string;
    isManager: boolean;
    managedTeams?: string[]; // UIDs of teams managed by this user
  };
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private teamMemberService: TeamMemberService,
    private teamService: TeamService,
  ) {}

  async validateGoogleUser(googleUser: GoogleUser): Promise<AuthResponse> {
    console.log('googleUser-----', googleUser);
    
    // Find existing team member by email
    let teamMember = await this.teamMemberService.findByEmail(googleUser.email);

    if (!teamMember) {
      // Create new team member if not exists
      teamMember = await this.teamMemberService.create({
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        email: googleUser.email,
        profilePic: googleUser.picture,
        designation: 'Other',
        isManager: false,
        status: 'Active',
      });
    }

    // Generate auth response (checks Team entries for manager status)
    return await this.generateAuthResponse(teamMember);
  }

  async validateUserById(userId: string): Promise<TeamMember | null> {
    return this.teamMemberService.findById(userId);
  }

  /**
   * Generate auth response with manager status derived from Team entries
   * A user is considered a manager if they are set as the manager in any Team entry
   */
  async generateAuthResponse(teamMember: TeamMember): Promise<AuthResponse> {
    // Check if user is a manager of any team by looking at Team entries
    const managedTeams = await this.teamService.findTeamsManagedBy(teamMember.uid);
    const isManager = managedTeams.length > 0;
    const managedTeamUids = managedTeams.map((t) => t.uid);

    const payload: JwtPayload = {
      sub: teamMember.uid,
      email: teamMember.email,
      firstName: teamMember.firstName,
      lastName: teamMember.lastName,
      isManager,
      team: teamMember.team,
      managedTeams: managedTeamUids,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        uid: teamMember.uid,
        email: teamMember.email,
        firstName: teamMember.firstName,
        lastName: teamMember.lastName,
        profilePic: teamMember.profilePic,
        designation: teamMember.designation,
        team: teamMember.team,
        isManager,
        managedTeams: managedTeamUids,
      },
    };
  }

  async refreshToken(userId: string): Promise<AuthResponse> {
    const teamMember = await this.teamMemberService.findById(userId);
    
    if (!teamMember) {
      throw new UnauthorizedException('User not found');
    }

    // Generate auth response (re-checks Team entries for manager status)
    return await this.generateAuthResponse(teamMember);
  }
}

