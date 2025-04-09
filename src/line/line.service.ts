import * as line from '@line/bot-sdk';
import { TextMessage } from '@line/bot-sdk/dist/messaging-api/api';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

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
        const message = event.message;

        console.log('Received message:', message);

        switch (message.type) {
            case 'text':
                this.handleTextMessage(event);
                break;
            case 'image':
                this.handleMediaMessage(event);
                break;
            case 'video':
                console.log('Video message:', message.id);
                break;
            case 'audio':
                console.log('Audio message:', message.id);
                break;
            case 'location':
                console.log('Location message:', message.title, message.address);
                break;
            case 'sticker':
                console.log('Sticker message:', message.packageId, message.stickerId);
                break;
            default:
                console.warn('Unhandled message type:', message.type);
        }
    }

    async handleTextMessage(event: line.MessageEvent) {
        const replyToken = event.replyToken;
        const message = event.message;

        console.log('Received text message:', message);

        this.replyMessage(replyToken, [
            {
                type: 'text',
                text: `You said: ${message}`,
            },
        ]);
    }

    async handleMediaMessage(event: line.MessageEvent) {
        const type = event.message.type;
        const messageId = event.message.id;

        const ext = {
            image: 'jpg',
            video: 'mp4',
            audio: 'm4a',
        }[type];

        if (!ext) {
            console.warn('Unsupported media type:', type);
            return;
        }
        const fileName = `${messageId}.${ext}`;
        const dir = path.join(process.env.WORKER ?? '', 'downloads');
        const filePath = path.join(dir, fileName);

        fs.mkdirSync(dir, { recursive: true });

        try {
            const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
            const res = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${this.channelAccessToken}`,
                },
                responseType: 'stream',
            });

            const writer = fs.createWriteStream(filePath);
            res.data.pipe(writer);

            await new Promise<void>((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log(`檔案已儲存：${filePath}`);
            this.replyMessage(event.replyToken, [
                {
                    type: 'text',
                    text: `下載成功\n檔案名稱：${fileName}\n下載路徑：/line/media/${fileName} `,
                },
            ]);
        } catch (error) {
            console.error('下載失敗:', error);
        }
    }

    async replyMessage(replyToken: string, messages: line.Message[]) {
        await axios
            .post(
                'https://api.line.me/v2/bot/message/reply',
                {
                    replyToken,
                    messages,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.channelAccessToken}`,
                    },
                },
            )
            .then((res) => {
                console.log('Reply message response:', res.data);
            })
            .catch((error) => {
                console.error('Error replying message:', error);
                return null;
            });
    }
}
