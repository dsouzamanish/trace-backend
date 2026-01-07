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
  team?: string;           // Deprecated: use teamUid instead
  teamUid?: string;        // Team entry UID
  teamName?: string;       // Team name
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
    team?: string;           // Deprecated: use teamUid instead
    teamUid?: string;        // Team entry UID
    teamName?: string;       // Team name
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
   * 
   * Priority for determining user's primary team:
   * 1. If user is a manager → use the first team they manage
   * 2. If user has team_ref set → use that team
   * 3. Otherwise → use the first team they belong to as a member
   */
  async generateAuthResponse(teamMember: TeamMember): Promise<AuthResponse> {
    // Check if user is a manager of any team by looking at Team entries (via manager field)
    const managedTeams = await this.teamService.findTeamsManagedBy(teamMember.uid);
    const isManager = managedTeams.length > 0;
    const managedTeamUids = managedTeams.map((t) => t.uid);

    // Determine primary team based on priority:
    // 1. For managers: use the first team they manage
    // 2. For non-managers: use team_ref from TeamMember, or first team they belong to
    let teamUid: string | undefined;
    let teamName: string | undefined;

    if (isManager && managedTeams.length > 0) {
      // Manager's primary team is the team they manage
      const primaryManagedTeam = managedTeams[0];
      teamUid = primaryManagedTeam.uid;
      teamName = primaryManagedTeam.name;
    } else {
      // Non-manager: use team_ref from TeamMember entity
      teamUid = teamMember.teamUid;
      teamName = teamMember.teamName;

      // Fallback: find teams where user is a member
      if (!teamUid) {
        const memberTeams = await this.teamService.findTeamsByMember(teamMember.uid);
        const primaryTeam = memberTeams[0];
        if (primaryTeam) {
          teamUid = primaryTeam.uid;
          teamName = primaryTeam.name;
        }
      }
    }

    // Final fallback to deprecated team field
    if (!teamName) {
      teamName = teamMember.team;
    }

    const payload: JwtPayload = {
      sub: teamMember.uid,
      email: teamMember.email,
      firstName: teamMember.firstName,
      lastName: teamMember.lastName,
      isManager,
      team: teamMember.team,     // Deprecated: kept for backward compatibility
      teamUid,                    // Team entry UID (from managed team or team_ref)
      teamName,                   // Team name
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
        team: teamMember.team,   // Deprecated: kept for backward compatibility
        teamUid,                  // Team entry UID (from managed team or team_ref)
        teamName,                 // Team name
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

