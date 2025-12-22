import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TeamMemberService } from '../team-member/team-member.service';
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
  };
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private teamMemberService: TeamMemberService,
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

    return this.generateAuthResponse(teamMember);
  }

  async validateUserById(userId: string): Promise<TeamMember | null> {
    return this.teamMemberService.findById(userId);
  }

  generateAuthResponse(teamMember: TeamMember): AuthResponse {
    const payload: JwtPayload = {
      sub: teamMember.uid,
      email: teamMember.email,
      firstName: teamMember.firstName,
      lastName: teamMember.lastName,
      isManager: teamMember.isManager || false,
      team: teamMember.team,
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
        isManager: teamMember.isManager || false,
      },
    };
  }

  async refreshToken(userId: string): Promise<AuthResponse> {
    const teamMember = await this.teamMemberService.findById(userId);
    
    if (!teamMember) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateAuthResponse(teamMember);
  }
}

