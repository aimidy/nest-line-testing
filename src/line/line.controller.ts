import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { LineService } from './line.service';
import { LineSignatureGuard } from 'src/common/line-signature/line-signature.guard';

@Controller('line')
export class LineController {
  @Inject()
  private readonly service: LineService;

  @Get('callback')
  getCallback(@Body() body: any) {
    console.log(body);
    return 'success';
  }

  @UseGuards(LineSignatureGuard)
  @Post('callback')
  postCallback(@Body() body: { events: any[] }) {
    console.log(body);
    if (!body?.events) {
      console.error('Invalid request body:', body);
      return 'error';
    }

    body.events.forEach((event) => {
      this.service.handleWebhookEvent(event);
    });

    return 'success';
  }
}
