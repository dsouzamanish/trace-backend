import { Module } from '@nestjs/common';
import { BlockerService } from './blocker.service';
import { BlockerController } from './blocker.controller';
import { TeamMemberModule } from '../team-member/team-member.module';

@Module({
  imports: [TeamMemberModule],
  controllers: [BlockerController],
  providers: [BlockerService],
  exports: [BlockerService],
})
export class BlockerModule {}

