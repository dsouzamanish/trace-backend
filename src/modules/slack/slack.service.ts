import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { TeamMemberService } from '../team-member/team-member.service';
import { BlockerService } from '../blocker/blocker.service';

export interface SlackUser {
  id: string;
  name: string;
  email?: string;
  real_name?: string;
  profile?: {
    email?: string;
    real_name?: string;
    first_name?: string;
    last_name?: string;
    image_72?: string;
  };
}

export interface SlackCommandPayload {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
  api_app_id: string;
}

export interface SlackInteractionPayload {
  type: string;
  user: {
    id: string;
    username: string;
    name: string;
    team_id: string;
  };
  trigger_id: string;
  view?: {
    id: string;
    callback_id: string;
    state: {
      values: Record<string, Record<string, { value?: string; selected_option?: { value: string } }>>;
    };
  };
  response_url?: string;
}

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private readonly signingSecret: string;
  private readonly botToken: string;

  constructor(
    private configService: ConfigService,
    private teamMemberService: TeamMemberService,
    private blockerService: BlockerService,
  ) {
    this.signingSecret = this.configService.get<string>('SLACK_SIGNING_SECRET') || '';
    this.botToken = this.configService.get<string>('SLACK_BOT_TOKEN') || '';
  }

  /**
   * Verify Slack request signature
   */
  verifySlackSignature(
    signature: string,
    timestamp: string,
    body: string,
  ): boolean {
    if (!this.signingSecret) {
      this.logger.warn('SLACK_SIGNING_SECRET not configured, skipping verification');
      return true; // Allow in development
    }

    const time = Math.floor(Date.now() / 1000);
    if (Math.abs(time - parseInt(timestamp)) > 300) {
      // Request is older than 5 minutes
      return false;
    }

    const sigBasestring = `v0:${timestamp}:${body}`;
    const mySignature = `v0=${crypto
      .createHmac('sha256', this.signingSecret)
      .update(sigBasestring)
      .digest('hex')}`;

    return crypto.timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(signature),
    );
  }

  /**
   * Get the blocker modal view definition
   */
  getBlockerModalView(triggerId: string): object {
    return {
      trigger_id: triggerId,
      view: {
        type: 'modal',
        callback_id: 'blocker_submission',
        title: {
          type: 'plain_text',
          text: 'Log a Blocker',
          emoji: true,
        },
        submit: {
          type: 'plain_text',
          text: 'Submit',
          emoji: true,
        },
        close: {
          type: 'plain_text',
          text: 'Cancel',
          emoji: true,
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '📝 *Log a blocker that is impacting your productivity*',
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'input',
            block_id: 'description_block',
            element: {
              type: 'plain_text_input',
              action_id: 'description_input',
              multiline: true,
              placeholder: {
                type: 'plain_text',
                text: 'Describe your blocker in detail...',
              },
            },
            label: {
              type: 'plain_text',
              text: 'Description',
              emoji: true,
            },
          },
          {
            type: 'input',
            block_id: 'category_block',
            element: {
              type: 'static_select',
              action_id: 'category_select',
              placeholder: {
                type: 'plain_text',
                text: 'Select a category',
              },
              options: [
                {
                  text: { type: 'plain_text', text: '⚙️ Process', emoji: true },
                  value: 'Process',
                },
                {
                  text: { type: 'plain_text', text: '💻 Technical', emoji: true },
                  value: 'Technical',
                },
                {
                  text: { type: 'plain_text', text: '🔗 Dependency', emoji: true },
                  value: 'Dependency',
                },
                {
                  text: { type: 'plain_text', text: '🏗️ Infrastructure', emoji: true },
                  value: 'Infrastructure',
                },
                {
                  text: { type: 'plain_text', text: '📦 Other', emoji: true },
                  value: 'Other',
                },
              ],
            },
            label: {
              type: 'plain_text',
              text: 'Category',
              emoji: true,
            },
          },
          {
            type: 'input',
            block_id: 'severity_block',
            element: {
              type: 'static_select',
              action_id: 'severity_select',
              placeholder: {
                type: 'plain_text',
                text: 'Select severity',
              },
              options: [
                {
                  text: { type: 'plain_text', text: '🟢 Low', emoji: true },
                  value: 'Low',
                },
                {
                  text: { type: 'plain_text', text: '🟡 Medium', emoji: true },
                  value: 'Medium',
                },
                {
                  text: { type: 'plain_text', text: '🔴 High', emoji: true },
                  value: 'High',
                },
              ],
            },
            label: {
              type: 'plain_text',
              text: 'Severity',
              emoji: true,
            },
          },
        ],
      },
    };
  }

  /**
   * Open modal in Slack
   */
  async openModal(triggerId: string): Promise<void> {
    const modalView = this.getBlockerModalView(triggerId);

    const response = await fetch('https://slack.com/api/views.open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.botToken}`,
      },
      body: JSON.stringify(modalView),
    });

    const result = await response.json();

    if (!result.ok) {
      this.logger.error('Failed to open modal:', result.error);
      throw new Error(`Failed to open modal: ${result.error}`);
    }

    this.logger.log('Modal opened successfully');
  }

  /**
   * Get Slack user info
   */
  async getSlackUserInfo(userId: string): Promise<SlackUser | null> {
    try {
      const response = await fetch(
        `https://slack.com/api/users.info?user=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${this.botToken}`,
          },
        },
      );

      const result = await response.json();

      if (!result.ok) {
        this.logger.error('Failed to get user info:', result.error);
        return null;
      }

      return result.user as SlackUser;
    } catch (error) {
      this.logger.error('Error fetching Slack user:', error);
      return null;
    }
  }

  /**
   * Find or create team member from Slack user
   */
  async findOrCreateTeamMember(slackUserId: string): Promise<string> {
    // First, try to find by Slack ID
    let teamMember = await this.teamMemberService.findBySlackId(slackUserId);

    if (teamMember) {
      return teamMember.uid;
    }

    // Get Slack user info
    const slackUser = await this.getSlackUserInfo(slackUserId);

    if (slackUser?.profile?.email) {
      // Try to find by email
      teamMember = await this.teamMemberService.findByEmail(slackUser.profile.email);

      if (teamMember) {
        // Update with Slack ID
        await this.teamMemberService.update(teamMember.uid, {
          slackId: slackUserId,
        });
        return teamMember.uid;
      }

      // Create new team member
      const firstName = slackUser.profile.first_name || slackUser.name?.split(' ')[0] || 'Unknown';
      const lastName = slackUser.profile.last_name || slackUser.name?.split(' ').slice(1).join(' ') || 'User';

      const newMember = await this.teamMemberService.create({
        firstName,
        lastName,
        email: slackUser.profile.email,
        slackId: slackUserId,
        profilePic: slackUser.profile.image_72,
        designation: 'Other',
        isManager: false,
        status: 'Active',
      });

      return newMember.uid;
    }

    throw new Error('Could not find or create team member - Slack user email not available');
  }

  /**
   * Send a DM to a user and return the message timestamp (ID)
   */
  async sendDirectMessage(
    userId: string,
    text: string,
    blocks?: object[],
  ): Promise<{ ok: boolean; ts?: string; channel?: string }> {
    try {
      // Open a DM channel with the user
      const openResponse = await fetch('https://slack.com/api/conversations.open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.botToken}`,
        },
        body: JSON.stringify({ users: userId }),
      });

      const openResult = await openResponse.json();

      if (!openResult.ok) {
        this.logger.error('Failed to open DM channel:', openResult.error);
        return { ok: false };
      }

      const channelId = openResult.channel?.id;

      // Send the message
      const messagePayload: Record<string, unknown> = {
        channel: channelId,
        text,
      };

      if (blocks) {
        messagePayload.blocks = blocks;
      }

      const messageResponse = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.botToken}`,
        },
        body: JSON.stringify(messagePayload),
      });

      const messageResult = await messageResponse.json();

      if (!messageResult.ok) {
        this.logger.error('Failed to send DM:', messageResult.error);
        return { ok: false };
      }

      return {
        ok: true,
        ts: messageResult.ts,
        channel: channelId,
      };
    } catch (error) {
      this.logger.error('Error sending DM:', error);
      return { ok: false };
    }
  }

  /**
   * Handle modal submission and create blocker
   */
  async handleBlockerSubmission(
    payload: SlackInteractionPayload,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const values = payload.view?.state?.values;

      if (!values) {
        throw new Error('No form values found');
      }

      const description = values.description_block?.description_input?.value;
      const category = values.category_block?.category_select?.selected_option?.value;
      const severity = values.severity_block?.severity_select?.selected_option?.value;

      if (!description || !category || !severity) {
        throw new Error('Missing required fields');
      }

      // Find or create team member
      const teamMemberUid = await this.findOrCreateTeamMember(payload.user.id);

      // Send confirmation message to user and get message ID
      const confirmationBlocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '✅ *Blocker logged successfully!*',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Category:*\n${category}`,
            },
            {
              type: 'mrkdwn',
              text: `*Severity:*\n${severity}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Description:*\n${description}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `📅 Logged at ${new Date().toLocaleString()} | View in <${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/blockers|Momentum>`,
            },
          ],
        },
      ];

      const dmResult = await this.sendDirectMessage(
        payload.user.id,
        `Blocker logged: ${description.substring(0, 50)}...`,
        confirmationBlocks,
      );

      // Create blocker with Slack message ID
      const slackMessageId = dmResult.ts
        ? `${dmResult.channel}:${dmResult.ts}`
        : undefined;

      await this.blockerService.create({
        teamMemberUid,
        description,
        category: category as 'Process' | 'Technical' | 'Dependency' | 'Infrastructure' | 'Other',
        severity: severity as 'Low' | 'Medium' | 'High',
        reportedVia: 'Slack',
        slackMessageId,
      });

      this.logger.log(
        `Blocker created successfully for user ${payload.user.username}` +
          (slackMessageId ? ` with Slack message ID: ${slackMessageId}` : ''),
      );

      return {
        success: true,
        message: 'Blocker logged successfully! 🎉',
      };
    } catch (error) {
      this.logger.error('Error handling blocker submission:', error);
      return {
        success: false,
        message: `Failed to log blocker: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Send a message to response URL
   */
  async sendResponseMessage(
    responseUrl: string,
    message: string,
    isError = false,
  ): Promise<void> {
    try {
      await fetch(responseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response_type: 'ephemeral',
          text: isError ? `❌ ${message}` : `✅ ${message}`,
        }),
      });
    } catch (error) {
      this.logger.error('Error sending response message:', error);
    }
  }
}

