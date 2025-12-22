import { Module } from '@nestjs/common';
import { SlackController } from './slack.controller';
import { SlackService } from './slack.service';
import { TeamMemberModule } from '../team-member/team-member.module';
import { BlockerModule } from '../blocker/blocker.module';

@Module({
  imports: [TeamMemberModule, BlockerModule],
  controllers: [SlackController],
  providers: [SlackService],
  exports: [SlackService],
})
export class SlackModule {}

