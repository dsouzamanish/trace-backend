import { Module, forwardRef } from '@nestjs/common';
import { TeamMemberService } from './team-member.service';
import { TeamMemberController } from './team-member.controller';
import { TeamModule } from '../team/team.module';

@Module({
  imports: [forwardRef(() => TeamModule)],
  controllers: [TeamMemberController],
  providers: [TeamMemberService],
  exports: [TeamMemberService],
})
export class TeamMemberModule {}

