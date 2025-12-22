import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  Res,
  HttpStatus,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SlackService, SlackCommandPayload, SlackInteractionPayload } from './slack.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('slack')
@Controller('slack')
export class SlackController {
  private readonly logger = new Logger(SlackController.name);

  constructor(private slackService: SlackService) {}

  /**
   * Handle /blocker slash command
   * Slack sends form-urlencoded data
   */
  @Public()
  @Post('commands/blocker')
  @ApiOperation({ summary: 'Handle /blocker slash command from Slack' })
  async handleBlockerCommand(
    @Body() body: SlackCommandPayload,
    @Headers('x-slack-signature') signature: string,
    @Headers('x-slack-request-timestamp') timestamp: string,
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    this.logger.log(`Received /blocker command from user: ${body.user_name}`);

    // Verify Slack signature (in production)
    const rawBody = req.rawBody?.toString() || '';
    if (signature && timestamp) {
      const isValid = this.slackService.verifySlackSignature(
        signature,
        timestamp,
        rawBody,
      );

      if (!isValid) {
        this.logger.warn('Invalid Slack signature');
        return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Invalid signature' });
      }
    }

    try {
      // Open the modal
      await this.slackService.openModal(body.trigger_id);

      // Acknowledge the command immediately (Slack requires response within 3 seconds)
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      this.logger.error('Error handling blocker command:', error);

      // Send error response to Slack
      return res.status(HttpStatus.OK).json({
        response_type: 'ephemeral',
        text: '❌ Failed to open blocker form. Please try again.',
      });
    }
  }

  /**
   * Handle Slack interactive components (modal submissions)
   * Slack sends JSON payload as form-urlencoded string in 'payload' field
   */
  @Public()
  @Post('interactions')
  @ApiExcludeEndpoint()
  async handleInteraction(
    @Body('payload') payloadString: string,
    @Headers('x-slack-signature') signature: string,
    @Headers('x-slack-request-timestamp') timestamp: string,
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    // Verify Slack signature
    const rawBody = req.rawBody?.toString() || '';
    if (signature && timestamp) {
      const isValid = this.slackService.verifySlackSignature(
        signature,
        timestamp,
        rawBody,
      );

      if (!isValid) {
        this.logger.warn('Invalid Slack signature for interaction');
        return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Invalid signature' });
      }
    }

    try {
      const payload: SlackInteractionPayload = JSON.parse(payloadString);

      this.logger.log(`Received interaction type: ${payload.type}`);

      // Handle modal submission
      if (payload.type === 'view_submission' && payload.view?.callback_id === 'blocker_submission') {
        const result = await this.slackService.handleBlockerSubmission(payload);

        if (result.success) {
          // Return empty response to close the modal
          // Then send a follow-up message
          res.status(HttpStatus.OK).send();

          // Send success message (non-blocking)
          if (payload.response_url) {
            this.slackService.sendResponseMessage(
              payload.response_url,
              result.message,
            );
          }
          return;
        } else {
          // Return errors to keep the modal open
          return res.status(HttpStatus.OK).json({
            response_action: 'errors',
            errors: {
              description_block: result.message,
            },
          });
        }
      }

      // Default response for unhandled interactions
      return res.status(HttpStatus.OK).send();
    } catch (error) {
      this.logger.error('Error handling interaction:', error);
      return res.status(HttpStatus.OK).json({
        response_action: 'errors',
        errors: {
          description_block: 'An error occurred. Please try again.',
        },
      });
    }
  }

  /**
   * Slack Events API verification endpoint
   * Handles URL verification challenge
   */
  @Public()
  @Post('events')
  @ApiExcludeEndpoint()
  async handleEvents(
    @Body() body: { type: string; challenge?: string; event?: unknown },
    @Res() res: Response,
  ) {
    // Handle URL verification challenge
    if (body.type === 'url_verification' && body.challenge) {
      this.logger.log('Handling Slack URL verification challenge');
      return res.status(HttpStatus.OK).json({ challenge: body.challenge });
    }

    // Handle other events here if needed
    this.logger.log(`Received event type: ${body.type}`);

    return res.status(HttpStatus.OK).send();
  }
}

