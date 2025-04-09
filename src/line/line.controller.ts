import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Post,
    Res,
    StreamableFile,
    UseGuards,
} from '@nestjs/common';
import { LineService } from './line.service';
import { LineSignatureGuard } from 'src/common/line-signature/line-signature.guard';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';

@Controller('line')
export class LineController {
    @Inject()
    private readonly service: LineService;

    @UseGuards(LineSignatureGuard)
    @Post('callback')
    postCallback(@Body() body: { events: any[] }) {
        console.log('Received webhook callback:', body);
        if (!body?.events) {
            console.error('Invalid request body:', body);
            throw new BadRequestException('Invalid request body');
        }

        if (!Array.isArray(body.events)) {
            console.error('Invalid events format:', body.events);
            throw new BadRequestException('Invalid events format');
        }

        body.events.forEach((event) => {
            this.service.handleWebhookEvent(event);
        });

        return 'success';
    }

    @Get('media/:filename')
    async getMedia(@Param('filename') filenam: string) {
        const filePath = path.join(process.env.WORKER ?? '', 'downloads', filenam);
        if (!fs.existsSync(filePath)) {
            throw new BadRequestException('File not found');
        }

        const fileStream = fs.createReadStream(filePath);
        return new StreamableFile(fileStream);
    }
}
