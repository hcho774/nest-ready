import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ApiKeyStrategy } from '../strategies/apiKey.strategy';

@Module({
  imports: [PassportModule],
  providers: [ApiKeyStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
