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
    // Parse action_items and insights from JSON strings if stored as text
    let actionItems: ActionItem[] = [];
    let insights: string[] = [];

    try {
      if (typeof entry.action_items === 'string') {
        actionItems = JSON.parse(entry.action_items);
      } else if (Array.isArray(entry.action_items)) {
        actionItems = entry.action_items;
      }
    } catch {
      actionItems = [];
    }

    try {
      if (typeof entry.insights === 'string') {
        insights = JSON.parse(entry.insights);
      } else if (Array.isArray(entry.insights)) {
        insights = entry.insights;
      }
    } catch {
      insights = [];
    }

    return {
      uid: entry.uid,
      reportType: entry.report_type,
      targetMember: entry.target_member?.[0]?.uid,
      targetTeam: entry.target_team,
      reportPeriod: entry.report_period,
      summary: entry.summary,
      actionItems,
      insights,
      generatedAt: entry.generated_at,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    };
  }

  /**
   * Check if a report already exists for the given period
   * Returns the existing report if found within the current period window
   */
  private async findExistingReport(
    reportType: ReportType,
    targetId: string, // member UID or team name
    period: ReportPeriod,
  ): Promise<AiReport | null> {
    const fromDate = this.getFromDate(period);

    if (reportType === 'individual') {
      // Get recent reports for this member
      const reports = await this.getReportsForMember(targetId);
      
      // Find a report generated within the current period window
      const existingReport = reports.find((report) => {
        if (report.reportPeriod !== period) return false;
        const reportDate = new Date(report.generatedAt);
        return reportDate >= fromDate;
      });

      return existingReport || null;
    } else {
      // Get recent reports for this team
      const reports = await this.getReportsForTeam(targetId);
      
      // Find a report generated within the current period window
      const existingReport = reports.find((report) => {
        if (report.reportPeriod !== period) return false;
        const reportDate = new Date(report.generatedAt);
        return reportDate >= fromDate;
      });

      return existingReport || null;
    }
  }

  /**
   * Generate AI report for an individual user
   * Returns existing report if one was already generated for the same period
   */
  async generateIndividualReport(
    teamMemberUid: string,
    period: ReportPeriod = 'weekly',
    forceRegenerate: boolean = false,
  ): Promise<AiReport & { isExisting?: boolean }> {
    const teamMember = await this.teamMemberService.findById(teamMemberUid);
    if (!teamMember) {
      throw new NotFoundException('Team member not found');
    }

    // Check for existing report unless force regenerate is requested
    if (!forceRegenerate) {
      const existingReport = await this.findExistingReport('individual', teamMemberUid, period);
      if (existingReport) {
        console.log(`Returning existing ${period} report for ${teamMember.firstName} ${teamMember.lastName}`);
        return { ...existingReport, isExisting: true };
      }
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

    // Save report to Contentstack (stringify arrays for text fields)
    const reportData = {
      title: `${period} Report - ${teamMember.firstName} ${teamMember.lastName}`,
      report_type: 'individual' as ReportType,
      target_member: [{ uid: teamMemberUid, _content_type_uid: 'team_member' }],
      report_period: period,
      summary: aiAnalysis.summary,
      action_items: JSON.stringify(aiAnalysis.actionItems),
      insights: JSON.stringify(aiAnalysis.insights),
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
   * Returns existing report if one was already generated for the same period
   */
  async generateTeamReport(
    team: string,
    period: ReportPeriod = 'weekly',
    forceRegenerate: boolean = false,
  ): Promise<AiReport & { isExisting?: boolean }> {
    // Check for existing report unless force regenerate is requested
    if (!forceRegenerate) {
      const existingReport = await this.findExistingReport('team', team, period);
      if (existingReport) {
        console.log(`Returning existing ${period} report for team ${team}`);
        return { ...existingReport, isExisting: true };
      }
    }

    // Get blockers for the team
    const fromDate = this.getFromDate(period);
    const filterDto = {
      fromDate: fromDate.toISOString(),
      limit: 500,
    } as FilterBlockerDto;

    const { blockers } = await this.blockerService.findByTeam(team, filterDto);

    // Generate AI insights
    const aiAnalysis = await this.analyzeBlockers(blockers, 'team', team);

    // Save report to Contentstack (stringify arrays for text fields)
    const reportData = {
      title: `${period} Team Report - ${team}`,
      report_type: 'team' as ReportType,
      target_team: team,
      report_period: period,
      summary: aiAnalysis.summary,
      action_items: JSON.stringify(aiAnalysis.actionItems),
      insights: JSON.stringify(aiAnalysis.insights),
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
   * Group blockers by severity for better analysis
   */
  private groupBlockersBySeverity(
    blockers: Array<{ description: string; category: string; severity: string; status: string }>,
  ): {
    high: typeof blockers;
    medium: typeof blockers;
    low: typeof blockers;
  } {
    return {
      high: blockers.filter((b) => b.severity === 'High'),
      medium: blockers.filter((b) => b.severity === 'Medium'),
      low: blockers.filter((b) => b.severity === 'Low'),
    };
  }

  /**
   * Format blockers for the AI prompt
   */
  private formatBlockersForPrompt(
    blockers: Array<{ description: string; category: string; severity: string; status: string }>,
  ): string {
    if (blockers.length === 0) return 'None';
    return blockers
      .map((b, i) => `  ${i + 1}. [${b.category}] ${b.description} (Status: ${b.status})`)
      .join('\n');
  }

  /**
   * Analyze blockers using OpenAI with enhanced severity-specific recommendations
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

    // Group blockers by severity for more targeted analysis
    const grouped = this.groupBlockersBySeverity(blockers);
    const openBlockers = blockers.filter((b) => b.status === 'Open');

    // Get unique categories
    const categories = [...new Set(blockers.map((b) => b.category))];

    const prompt = `You are an expert productivity analyst and engineering manager. Analyze the blockers reported by ${
      reportType === 'individual' ? 'an individual team member' : 'a team'
    } named "${targetName}" and provide actionable, specific recommendations.

## BLOCKERS BY SEVERITY

### 🔴 HIGH SEVERITY (${grouped.high.length} blockers) - Immediate attention required
${this.formatBlockersForPrompt(grouped.high)}

### 🟡 MEDIUM SEVERITY (${grouped.medium.length} blockers) - Should be addressed this sprint
${this.formatBlockersForPrompt(grouped.medium)}

### 🟢 LOW SEVERITY (${grouped.low.length} blockers) - Can be scheduled for later
${this.formatBlockersForPrompt(grouped.low)}

## STATISTICS
- Total Blockers: ${blockers.length}
- Open Blockers: ${openBlockers.length}
- Categories Affected: ${categories.join(', ')}

## YOUR TASK

Provide a comprehensive analysis with SPECIFIC, ACTIONABLE recommendations for EACH severity level. Each action item should:
1. Reference the specific blocker(s) it addresses
2. Provide a concrete solution or approach
3. Include an estimated effort level (quick-win: <1 day, short-term: 1-5 days, long-term: >5 days)

Respond in JSON format:
{
  "summary": "A 2-3 sentence executive summary of the main productivity challenges and overall health",
  "actionItems": [
    {
      "title": "Brief action title",
      "description": "Detailed description of what to do",
      "priority": "high|medium|low",
      "severity": "High|Medium|Low",
      "category": "category name this addresses",
      "suggestedSolution": "Specific step-by-step solution or approach to resolve this",
      "estimatedEffort": "quick-win|short-term|long-term",
      "relatedBlockers": ["brief description of related blocker 1", "brief description of related blocker 2"]
    }
  ],
  "insights": [
    "Pattern or trend observation 1",
    "Pattern or trend observation 2",
    "Recommendation for process improvement"
  ]
}

GUIDELINES:
- Generate 2-3 action items for HIGH severity blockers (if any exist)
- Generate 1-2 action items for MEDIUM severity blockers (if any exist)
- Generate 1 action item for LOW severity blockers (if any exist)
- Make suggestions specific to the blocker descriptions, not generic advice
- Include concrete solutions like "Set up daily standup", "Create shared documentation", "Implement code review checklist"
- For technical blockers, suggest specific tools, processes, or architectural changes
- For dependency blockers, suggest communication strategies or escalation paths
- For resource blockers, suggest prioritization frameworks or resource allocation strategies`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert productivity analyst who provides specific, actionable recommendations. Always be concrete and avoid generic advice. Reference specific blockers in your recommendations.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000,
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
    const grouped = this.groupBlockersBySeverity(blockers);

    const actionItems: ActionItem[] = [];

    // Generate severity-specific action items
    if (severityCount.High > 0) {
      const highBlockers = grouped.high.slice(0, 2);
      actionItems.push({
        title: '🔴 Immediate: Address High Severity Blockers',
        description: `There are ${severityCount.High} high severity blockers requiring immediate attention. These are blocking critical work.`,
        priority: 'high',
        severity: 'High',
        category: highBlockers[0]?.category,
        suggestedSolution: `1. Schedule emergency meeting to discuss blockers\n2. Identify owners for each blocker\n3. Set 24-hour resolution target\n4. Escalate to management if external dependencies`,
        estimatedEffort: 'quick-win',
        relatedBlockers: highBlockers.map((b) => b.description.substring(0, 50)),
      });
    }

    if (severityCount.Medium > 0) {
      const mediumBlockers = grouped.medium.slice(0, 2);
      actionItems.push({
        title: '🟡 This Sprint: Resolve Medium Priority Issues',
        description: `${severityCount.Medium} medium severity blockers should be addressed within this sprint to prevent escalation.`,
        priority: 'medium',
        severity: 'Medium',
        category: mediumBlockers[0]?.category,
        suggestedSolution: `1. Add blockers to sprint backlog\n2. Assign clear ownership\n3. Set realistic deadlines\n4. Create follow-up tasks if needed`,
        estimatedEffort: 'short-term',
        relatedBlockers: mediumBlockers.map((b) => b.description.substring(0, 50)),
      });
    }

    if (severityCount.Low > 0) {
      const lowBlockers = grouped.low.slice(0, 2);
      actionItems.push({
        title: '🟢 Backlog: Schedule Low Priority Items',
        description: `${severityCount.Low} low severity blockers can be scheduled for future sprints.`,
        priority: 'low',
        severity: 'Low',
        category: lowBlockers[0]?.category,
        suggestedSolution: `1. Add to backlog with proper labels\n2. Review during sprint planning\n3. Consider batching similar issues\n4. Document workarounds if available`,
        estimatedEffort: 'long-term',
        relatedBlockers: lowBlockers.map((b) => b.description.substring(0, 50)),
      });
    }

    // Add category-specific recommendation if there's a dominant category
    if (topCategory && topCategory[1] >= 2) {
      actionItems.push({
        title: `📊 Pattern: Address Recurring ${topCategory[0]} Issues`,
        description: `${topCategory[0]} blockers appear ${topCategory[1]} times. Consider a systematic approach to prevent recurrence.`,
        priority: 'medium',
        category: topCategory[0],
        suggestedSolution: this.getCategorySuggestion(topCategory[0]),
        estimatedEffort: 'short-term',
      });
    }

    return {
      summary: `${targetName} reported ${blockers.length} blockers during this period. ${severityCount.High > 0 ? `⚠️ ${severityCount.High} require immediate attention. ` : ''}The most common category was ${topCategory?.[0] || 'Other'} with ${topCategory?.[1] || 0} occurrences. Currently, ${openCount} blockers remain open.`,
      actionItems,
      insights: [
        `📈 Total blockers: ${blockers.length}`,
        `🔴 High severity: ${severityCount.High}, 🟡 Medium: ${severityCount.Medium}, 🟢 Low: ${severityCount.Low}`,
        `⏳ Open blockers: ${openCount} (${Math.round((openCount / blockers.length) * 100)}% unresolved)`,
        topCategory
          ? `🔄 Most frequent category: ${topCategory[0]} (${Math.round((topCategory[1] / blockers.length) * 100)}% of all blockers)`
          : '',
      ].filter(Boolean),
    };
  }

  /**
   * Get category-specific solution suggestions
   */
  private getCategorySuggestion(category: string): string {
    const suggestions: Record<string, string> = {
      Technical:
        '1. Review technical architecture\n2. Consider pair programming sessions\n3. Set up knowledge sharing sessions\n4. Create technical documentation',
      Dependency:
        '1. Map all external dependencies\n2. Set up regular sync meetings with dependent teams\n3. Create escalation procedures\n4. Consider building abstractions to reduce coupling',
      Resource:
        '1. Review resource allocation with management\n2. Prioritize tasks by impact\n3. Consider temporary resource augmentation\n4. Identify tasks that can be deferred',
      Process:
        '1. Document current processes\n2. Identify bottlenecks\n3. Streamline approval workflows\n4. Implement automation where possible',
      Communication:
        '1. Set up regular sync meetings\n2. Create shared communication channels\n3. Document decisions and rationale\n4. Establish clear escalation paths',
      Other:
        '1. Categorize blockers more specifically\n2. Identify root causes\n3. Create action plans for each\n4. Set up regular review meetings',
    };
    return suggestions[category] || suggestions['Other'];
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

