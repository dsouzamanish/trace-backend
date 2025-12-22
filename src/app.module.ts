import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContentstackModule } from './modules/contentstack/contentstack.module';
import { AuthModule } from './modules/auth/auth.module';
import { TeamMemberModule } from './modules/team-member/team-member.module';
import { BlockerModule } from './modules/blocker/blocker.module';
import { AiReportModule } from './modules/ai-report/ai-report.module';
import { MigrationModule } from './modules/migration/migration.module';
import { SlackModule } from './modules/slack/slack.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ContentstackModule,
    AuthModule,
    TeamMemberModule,
    BlockerModule,
    AiReportModule,
    MigrationModule,
    SlackModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

