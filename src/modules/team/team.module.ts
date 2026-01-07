import { Module, forwardRef } from '@nestjs/common';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { ContentstackModule } from '../contentstack/contentstack.module';
import { TeamMemberModule } from '../team-member/team-member.module';

@Module({
  imports: [ContentstackModule, forwardRef(() => TeamMemberModule)],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}


