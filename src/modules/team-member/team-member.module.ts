import { Module, forwardRef } from '@nestjs/common';
import { TeamMemberService } from './team-member.service';
import { TeamMemberController } from './team-member.controller';
import { TeamModule } from '../team/team.module';
import { ContentstackModule } from '../contentstack/contentstack.module';

@Module({
  imports: [ContentstackModule, forwardRef(() => TeamModule)],
  controllers: [TeamMemberController],
  providers: [TeamMemberService],
  exports: [TeamMemberService],
})
export class TeamMemberModule {}

