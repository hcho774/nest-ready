import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(
  HeaderAPIKeyStrategy,
  'apiKey',
) {
  private readonly logger = new Logger(ApiKeyStrategy.name);
  constructor(private readonly configService: ConfigService) {
    super({ header: 'apiKey', prefix: '' }, false);
  }

  validate(apiKey: string): { authenticated: boolean } {
    const validKey = this.configService.get<string>('API_KEY');
    if (apiKey === validKey) {
      // TODO: When ApiKey table is ready, replace with DB lookup:
      this.logger.debug('API key validated successfully');
      return { authenticated: true };
    }
    throw new UnauthorizedException('Invalid or missing API key');
  }
}
