import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Logger } from '@nestjs/common';

/**
 * Validates that all environment variables defined in `.env.example`
 * are present in `process.env`. Call this before app bootstrap.
 *
 * @throws Error if any required env vars are missing
 */
export function validateEnv(): void {
  const logger = new Logger('EnvCheck');
  const examplePath = resolve(process.cwd(), '.env.example');

  if (!existsSync(examplePath)) {
    logger.warn('.env.example not found — skipping env validation');
    return;
  }

  const content = readFileSync(examplePath, 'utf-8');
  const requiredKeys = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('=')[0].trim())
    .filter(Boolean);

  const missing = requiredKeys.filter((key) => !(key in process.env));

  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(', ')}\n` +
        `Check your .env file against .env.example`,
    );
  }

  logger.log(`✅ All ${requiredKeys.length} env vars validated`);
}
