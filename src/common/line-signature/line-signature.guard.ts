import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as crypto from 'crypto';
import { LineService } from 'src/line/line.service';

@Injectable()
export class LineSignatureGuard implements CanActivate {
  @Inject()
  private readonly service: LineService;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const signature = request.headers['x-line-signature'];

    if (!signature) {
      throw new UnauthorizedException('Missing signature header');
    }

    const rawBody = request.rawBody?.toString() || JSON.stringify(request.body);

    const hash = crypto
      .createHmac('SHA256', this.service.channelSecret)
      .update(rawBody)
      .digest('base64');

    const isValid = hash === signature;

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }
    return true;
  }
}
