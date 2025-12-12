import { Module } from '@nestjs/common';
import { TeamMemberService } from './team-member.service';
import { TeamMemberController } from './team-member.controller';

@Module({
  controllers: [TeamMemberController],
  providers: [TeamMemberService],
  exports: [TeamMemberService],
})
export class TeamMemberModule {}

