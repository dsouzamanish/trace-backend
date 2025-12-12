import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ContentstackService } from '../contentstack/contentstack.service';
import { BlockerService } from '../blocker/blocker.service';
import { TeamMemberService } from '../team-member/team-member.service';
import {
  AiReport,
  AiReportContentstack,
  ReportType,
  ReportPeriod,
  ActionItem,
} from './entities/ai-report.entity';
import { FilterBlockerDto } from '../blocker/dto/filter-blocker.dto';

const CONTENT_TYPE_UID = 'ai_report';

@Injectable()
export class AiReportService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private contentstackService: ContentstackService,
    private blockerService: BlockerService,
    private teamMemberService: TeamMemberService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Transform Contentstack entry to AiReport entity
   */
  private transformEntry(entry: AiReportContentstack): AiReport {
    return {
      uid: entry.uid,
      reportType: entry.report_type,
      targetMember: entry.target_member?.[0]?.uid,
      targetTeam: entry.target_team,
      reportPeriod: entry.report_period,
      summary: entry.summary,
      actionItems: entry.action_items || [],
      insights: entry.insights || [],
      generatedAt: entry.generated_at,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    };
  }

  /**
   * Generate AI report for an individual user
   */
  async generateIndividualReport(
    teamMemberUid: string,
    period: ReportPeriod = 'weekly',
  ): Promise<AiReport> {
    const teamMember = await this.teamMemberService.findById(teamMemberUid);
    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    // Get blockers for the specified period
    const fromDate = this.getFromDate(period);
    const filterDto = {
      fromDate: fromDate.toISOString(),
      limit: 100,
    } as FilterBlockerDto;

    const { blockers } = await this.blockerService.findByTeamMember(teamMemberUid, filterDto);

    // Generate AI insights
    const aiAnalysis = await this.analyzeBlockers(blockers, 'individual', teamMember.firstName);

    // Save report to Contentstack
    const reportData = {
      title: `${period} Report - ${teamMember.firstName} ${teamMember.lastName}`,
      report_type: 'individual' as ReportType,
      target_member: [{ uid: teamMemberUid, _content_type_uid: 'team_member' }],
      report_period: period,
      summary: aiAnalysis.summary,
      action_items: aiAnalysis.actionItems,
      insights: aiAnalysis.insights,
      generated_at: new Date().toISOString(),
    };

    const entry = await this.contentstackService.createEntry<AiReportContentstack>(
      CONTENT_TYPE_UID,
      reportData,
    );

    return this.transformEntry(entry);
  }

  /**
   * Generate AI report for a team
   */
  async generateTeamReport(team: string, period: ReportPeriod = 'weekly'): Promise<AiReport> {
    // Get blockers for the team
    const fromDate = this.getFromDate(period);
    const filterDto = {
      fromDate: fromDate.toISOString(),
      limit: 500,
    } as FilterBlockerDto;

    const { blockers } = await this.blockerService.findByTeam(team, filterDto);

    // Generate AI insights
    const aiAnalysis = await this.analyzeBlockers(blockers, 'team', team);

    // Save report to Contentstack
    const reportData = {
      title: `${period} Team Report - ${team}`,
      report_type: 'team' as ReportType,
      target_team: team,
      report_period: period,
      summary: aiAnalysis.summary,
      action_items: aiAnalysis.actionItems,
      insights: aiAnalysis.insights,
      generated_at: new Date().toISOString(),
    };

    const entry = await this.contentstackService.createEntry<AiReportContentstack>(
      CONTENT_TYPE_UID,
      reportData,
    );

    return this.transformEntry(entry);
  }

  /**
   * Get reports for a team member
   */
  async getReportsForMember(teamMemberUid: string): Promise<AiReport[]> {
    const entries = await this.contentstackService.getEntries<AiReportContentstack>(
      CONTENT_TYPE_UID,
      {
        where: { report_type: 'individual' },
        limit: 10,
        includeReference: ['target_member'],
      },
    );

    // Filter by member (since Contentstack query on reference is complex)
    const filtered = entries.filter(
      (e) => e.target_member?.[0]?.uid === teamMemberUid,
    );

    return filtered.map((entry) => this.transformEntry(entry));
  }

  /**
   * Get reports for a team
   */
  async getReportsForTeam(team: string): Promise<AiReport[]> {
    const entries = await this.contentstackService.getEntries<AiReportContentstack>(
      CONTENT_TYPE_UID,
      {
        where: { report_type: 'team', target_team: team },
        limit: 10,
      },
    );

    return entries.map((entry) => this.transformEntry(entry));
  }

  /**
   * Get a specific report by ID
   */
  async getReportById(uid: string): Promise<AiReport | null> {
    const entry = await this.contentstackService.getEntryByUid<AiReportContentstack>(
      CONTENT_TYPE_UID,
      uid,
      ['target_member'],
    );

    return entry ? this.transformEntry(entry) : null;
  }

  /**
   * Analyze blockers using OpenAI
   */
  private async analyzeBlockers(
    blockers: Array<{ description: string; category: string; severity: string; status: string }>,
    reportType: ReportType,
    targetName: string,
  ): Promise<{ summary: string; actionItems: ActionItem[]; insights: string[] }> {
    if (blockers.length === 0) {
      return {
        summary: `No blockers were reported for ${targetName} during this period. Great job maintaining productivity!`,
        actionItems: [],
        insights: ['No blockers to analyze for this period.'],
      };
    }

    const blockerSummary = blockers
      .map(
        (b, i) =>
          `${i + 1}. [${b.category}] [${b.severity}] ${b.description} (Status: ${b.status})`,
      )
      .join('\n');

    const prompt = `You are a productivity analyst. Analyze the following blockers reported by ${
      reportType === 'individual' ? 'an individual team member' : 'a team'
    } named "${targetName}" and provide:

1. A brief summary (2-3 sentences) of the main productivity challenges
2. Up to 5 actionable recommendations to improve productivity
3. Key insights about patterns in the blockers

Blockers:
${blockerSummary}

Respond in JSON format:
{
  "summary": "string",
  "actionItems": [
    { "title": "string", "description": "string", "priority": "high|medium|low" }
  ],
  "insights": ["string"]
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');

      return {
        summary: response.summary || 'Unable to generate summary.',
        actionItems: response.actionItems || [],
        insights: response.insights || [],
      };
    } catch (error) {
      console.error('OpenAI API error:', error);

      // Return a fallback analysis
      return this.generateFallbackAnalysis(blockers, targetName);
    }
  }

  /**
   * Generate fallback analysis when AI is unavailable
   */
  private generateFallbackAnalysis(
    blockers: Array<{ description: string; category: string; severity: string; status: string }>,
    targetName: string,
  ): { summary: string; actionItems: ActionItem[]; insights: string[] } {
    const categoryCount: Record<string, number> = {};
    const severityCount: Record<string, number> = { High: 0, Medium: 0, Low: 0 };
    let openCount = 0;

    blockers.forEach((b) => {
      categoryCount[b.category] = (categoryCount[b.category] || 0) + 1;
      severityCount[b.severity]++;
      if (b.status === 'Open') openCount++;
    });

    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];

    return {
      summary: `${targetName} reported ${blockers.length} blockers during this period. The most common category was ${topCategory?.[0] || 'Other'} with ${topCategory?.[1] || 0} occurrences. Currently, ${openCount} blockers remain open.`,
      actionItems: [
        {
          title: 'Address High Severity Blockers',
          description: `There are ${severityCount.High} high severity blockers that need immediate attention.`,
          priority: 'high',
        },
        {
          title: `Review ${topCategory?.[0] || 'Common'} Issues`,
          description: `Focus on resolving ${topCategory?.[0] || 'recurring'} blockers to improve productivity.`,
          priority: 'medium',
        },
      ],
      insights: [
        `Total blockers: ${blockers.length}`,
        `High severity: ${severityCount.High}, Medium: ${severityCount.Medium}, Low: ${severityCount.Low}`,
        `Open blockers: ${openCount}`,
      ],
    };
  }

  /**
   * Calculate the from date based on report period
   */
  private getFromDate(period: ReportPeriod): Date {
    const now = new Date();
    if (period === 'weekly') {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}

