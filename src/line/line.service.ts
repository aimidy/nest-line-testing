import * as line from '@line/bot-sdk';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LineService {
  readonly channelSecret: string;
  private readonly channelAccessToken: string;

  constructor() {
    const token = process.env.CHANNEL_ACCESS_TOKEN;
    if (!token) {
      throw new Error('CHANNEL_ACCESS_TOKEN is not set');
    }
    this.channelAccessToken = token;

    const channelSecret = process.env.CHANNEL_SECRET;
    if (!channelSecret) {
      throw new Error('CHANNEL_SECRET is not set');
    }
    this.channelSecret = channelSecret;
  }

  async handleWebhookEvent(event: line.WebhookEvent) {
    console.log('Received event:', event.type);

    console.log(event.type);
    switch (event.type) {
      case 'message':
        await this.handleMessageEvent(event);
        break;
      //   case 'follow':
      //     await this.handleFollowEvent(event);
      //     break;
      //   case 'unfollow':
      //     await this.handleUnfollowEvent(event);
      //     break;
      default:
        console.warn('Unhandled event type:', event.type);
    }
  }

  async handleMessageEvent(event: line.MessageEvent) {
    console.log(12346);
    const replyToken = event.replyToken;
    const message = event.message;

    console.log('Received message:', message);

    if (message.type === 'text') {
      const replyMessage = {
        type: 'text',
        text: `You said: ${message.text}`,
      };

      const result = await axios.post(
        'https://api.line.me/v2/bot/message/reply',
        {
          replyToken: replyToken,
          messages: [replyMessage],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.channelAccessToken}`,
          },
        },
      );
      console.log('Reply result:', result.data);
    } else {
      console.warn('Unhandled message type:', message.type);
    }
  }
}
