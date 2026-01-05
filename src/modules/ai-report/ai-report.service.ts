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
   * Format blockers for the AI prompt with unique IDs for reference
   */
  private formatBlockersForPrompt(
    blockers: Array<{ description: string; category: string; severity: string; status: string }>,
    startId: number = 1,
  ): string {
    if (blockers.length === 0) return 'None';
    return blockers
      .map((b, i) => `  B${startId + i}. [${b.category}] "${b.description}" (Status: ${b.status})`)
      .join('\n');
  }

  /**
   * Format all blockers with sequential IDs for the AI prompt
   */
  private formatAllBlockersWithIds(
    blockers: Array<{ description: string; category: string; severity: string; status: string }>,
  ): string {
    return blockers
      .map((b, i) => `B${i + 1}. [${b.severity}][${b.category}] "${b.description}" (Status: ${b.status})`)
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
    } named "${targetName}" and provide SPECIFIC, ACTIONABLE recommendations for EACH blocker.

## ALL BLOCKERS (Total: ${blockers.length}, Open: ${openBlockers.length})

${this.formatAllBlockersWithIds(blockers)}

## STATISTICS
- High Severity: ${grouped.high.length}
- Medium Severity: ${grouped.medium.length}
- Low Severity: ${grouped.low.length}
- Categories: ${categories.join(', ')}

## YOUR TASK

For EACH blocker listed above, provide a specific action item with:
1. The exact blocker ID (B1, B2, etc.) it addresses
2. A concrete, actionable solution (NOT generic advice)
3. Which team/person to involve (e.g., "DevOps team", "Backend lead", "QA team", "Product Manager")
4. Specific next steps

## EXAMPLES OF GOOD vs BAD ACTION ITEMS

❌ BAD (too generic):
- "Review configuration settings"
- "Improve communication"
- "Fix the technical issue"

✅ GOOD (specific and actionable):
- "For B3 (Config mismatch on dev18): Work with DevOps team to implement centralized config management using Consul or AWS Parameter Store. Schedule a 30-min sync with DevOps lead to review current config deployment process."
- "For B5 (API timeout): Collaborate with Backend team to add connection pooling and implement retry logic with exponential backoff. Create a Jira ticket for Backend team with reproduction steps."
- "For B7 (Missing test data): Coordinate with QA team to set up a shared test data repository. Request QA lead to provision staging environment with sample datasets."

Respond in JSON format:
{
  "summary": "A 2-3 sentence executive summary highlighting the most critical blockers and overall productivity health",
  "actionItems": [
    {
      "title": "Action title referencing the blocker",
      "description": "Detailed description starting with 'For B[X] (blocker summary):' followed by the specific action",
      "priority": "high|medium|low",
      "severity": "High|Medium|Low",
      "category": "Technical|Process|Dependency|Infrastructure|Other",
      "blockerRef": "B1",
      "blockerDescription": "The exact blocker description this addresses",
      "teamToInvolve": "Specific team or role (e.g., DevOps, Backend, QA, Product, Manager)",
      "suggestedSolution": "Step-by-step solution:\n1. First step\n2. Second step\n3. Third step",
      "immediateNextStep": "The ONE thing to do first (e.g., 'Schedule 15-min call with DevOps lead')",
      "estimatedEffort": "quick-win|short-term|long-term"
    }
  ],
  "insights": [
    "Pattern observation with specific recommendation",
    "Cross-team dependency insight",
    "Process improvement suggestion"
  ]
}

## GUIDELINES

1. **Generate ONE action item per blocker** - Every blocker should have a corresponding action item
2. **Be specific to the blocker description** - Read the blocker text carefully and tailor the recommendation
3. **Include team ownership** - Always specify which team/person should be involved:
   - Infrastructure/Config issues → DevOps team
   - Code/API issues → Backend/Frontend team
   - Testing issues → QA team
   - Requirements/Specs → Product Manager
   - External dependencies → relevant external team + escalation path
   - Process issues → Team Lead or Engineering Manager
4. **Provide concrete next steps** - Include specific meetings to schedule, tickets to create, or documents to review
5. **Reference tools and processes** - Suggest specific tools (Jira, Confluence, Slack channels) when relevant`;

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
   * Creates specific action items for each blocker
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

    // Generate specific action item for each blocker
    const actionItems: ActionItem[] = blockers.map((blocker, index) => {
      const blockerRef = `B${index + 1}`;
      const { team, solution, nextStep } = this.getBlockerSpecificRecommendation(blocker);
      
      return {
        title: `${this.getSeverityEmoji(blocker.severity)} ${blockerRef}: ${this.truncate(blocker.description, 50)}`,
        description: `For ${blockerRef} (${blocker.description}): ${solution.split('\n')[0]}`,
        priority: blocker.severity === 'High' ? 'high' : blocker.severity === 'Medium' ? 'medium' : 'low',
        severity: blocker.severity as 'High' | 'Medium' | 'Low',
        category: blocker.category,
        blockerRef,
        blockerDescription: blocker.description,
        teamToInvolve: team,
        suggestedSolution: solution,
        immediateNextStep: nextStep,
        estimatedEffort: blocker.severity === 'High' ? 'quick-win' : blocker.severity === 'Medium' ? 'short-term' : 'long-term',
      };
    });

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
   * Get severity emoji
   */
  private getSeverityEmoji(severity: string): string {
    return severity === 'High' ? '🔴' : severity === 'Medium' ? '🟡' : '🟢';
  }

  /**
   * Truncate string to specified length
   */
  private truncate(str: string, length: number): string {
    return str.length > length ? str.substring(0, length) + '...' : str;
  }

  /**
   * Get blocker-specific recommendation based on category and description
   */
  private getBlockerSpecificRecommendation(blocker: { description: string; category: string; severity: string }): {
    team: string;
    solution: string;
    nextStep: string;
  } {
    const description = blocker.description.toLowerCase();
    
    // Infrastructure/DevOps related
    if (blocker.category === 'Infrastructure' || 
        description.includes('config') || 
        description.includes('deployment') || 
        description.includes('server') ||
        description.includes('environment') ||
        description.includes('ci/cd') ||
        description.includes('pipeline')) {
      return {
        team: 'DevOps Team',
        solution: `1. Schedule sync with DevOps team to review the issue\n2. Document current configuration and desired state\n3. Implement configuration management solution (e.g., Consul, AWS Parameter Store)\n4. Set up monitoring and alerts for configuration drift`,
        nextStep: 'Schedule 15-min call with DevOps lead to discuss configuration management',
      };
    }

    // Technical/Code related
    if (blocker.category === 'Technical' || 
        description.includes('api') || 
        description.includes('code') || 
        description.includes('bug') ||
        description.includes('performance') ||
        description.includes('memory') ||
        description.includes('error')) {
      return {
        team: 'Backend/Frontend Team',
        solution: `1. Create detailed bug report with reproduction steps\n2. Review relevant code with team lead\n3. Implement fix with proper test coverage\n4. Request code review before merging`,
        nextStep: 'Create Jira ticket with reproduction steps and assign to tech lead',
      };
    }

    // Dependency related
    if (blocker.category === 'Dependency' || 
        description.includes('waiting') || 
        description.includes('blocked by') || 
        description.includes('depends on') ||
        description.includes('third-party') ||
        description.includes('external')) {
      return {
        team: 'Product Manager + External Team',
        solution: `1. Identify the exact dependency and owner\n2. Set up sync meeting with dependent team\n3. Establish clear timeline and escalation path\n4. Document workaround if possible`,
        nextStep: 'Send Slack message to dependent team lead requesting status update',
      };
    }

    // Process related
    if (blocker.category === 'Process' || 
        description.includes('approval') || 
        description.includes('review') || 
        description.includes('requirement') ||
        description.includes('unclear') ||
        description.includes('documentation')) {
      return {
        team: 'Team Lead / Engineering Manager',
        solution: `1. Document the process gap or unclear requirement\n2. Schedule clarification meeting with stakeholders\n3. Update documentation and communicate changes\n4. Set up recurring review to prevent recurrence`,
        nextStep: 'Schedule 30-min meeting with Product Manager for clarification',
      };
    }

    // Default recommendation
    return {
      team: 'Team Lead',
      solution: `1. Analyze the root cause of the blocker\n2. Identify the right owner/team to address it\n3. Create action plan with clear timeline\n4. Follow up until resolution`,
      nextStep: 'Discuss with team lead in next standup to identify owner',
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

