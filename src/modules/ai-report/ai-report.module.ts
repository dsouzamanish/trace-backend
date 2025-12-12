import { Module } from '@nestjs/common';
import { AiReportService } from './ai-report.service';
import { AiReportController } from './ai-report.controller';
import { BlockerModule } from '../blocker/blocker.module';
import { TeamMemberModule } from '../team-member/team-member.module';

@Module({
  imports: [BlockerModule, TeamMemberModule],
  controllers: [AiReportController],
  providers: [AiReportService],
  exports: [AiReportService],
})
export class AiReportModule {}

