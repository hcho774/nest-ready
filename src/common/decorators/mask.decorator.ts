import { Transform } from 'class-transformer';

export type MaskType = 'tail' | 'email' | 'phone' | 'full';

interface MaskOptions {
  /** Masking type */
  type?: MaskType;
  /** Number of characters to keep visible (default: 4) */
  visibleChars?: number;
  /** Character used for masking (default: '*') */
  maskChar?: string;
}

function maskValue(value: string, options: MaskOptions = {}): string {
  if (!value || typeof value !== 'string') return value;

  const { type = 'tail', visibleChars = 4, maskChar = '*' } = options;

  switch (type) {
    case 'tail':
      // Show last N chars: "123-45-6789" → "***-**-6789"
      if (value.length <= visibleChars) return value;
      return (
        value.slice(0, -visibleChars).replace(/[a-zA-Z0-9]/g, maskChar) +
        value.slice(-visibleChars)
      );

    case 'email':
      // "john.doe@gmail.com" → "j*****e@gmail.com"
      const [local, domain] = value.split('@');
      if (!domain || local.length <= 2)
        return maskChar.repeat(3) + '@' + domain;
      return (
        local[0] +
        maskChar.repeat(local.length - 2) +
        local[local.length - 1] +
        '@' +
        domain
      );

    case 'phone':
      // "010-1234-5678" → "010-****-5678"
      if (value.length <= visibleChars) return value;
      const keep = Math.floor(visibleChars / 2);
      return (
        value.slice(0, keep) +
        value.slice(keep, -keep).replace(/[0-9]/g, maskChar) +
        value.slice(-keep)
      );

    case 'full':
      // "secret" → "******"
      return maskChar.repeat(value.length);

    default:
      return value;
  }
}

/**
 * Decorator to mask sensitive data in API responses.
 *
 * @example
 * @Mask({ type: 'tail', visibleChars: 4 })
 * document: string; // "123-45-6789" → "***-**-6789"
 *
 * @Mask({ type: 'email' })
 * email: string; // "john@gmail.com" → "j**n@gmail.com"
 *
 * @Mask({ type: 'phone' })
 * phone: string; // "010-1234-5678" → "010-****-5678"
 *
 * @Mask({ type: 'full' })
 * password: string; // "secret" → "******"
 */
export function Mask(options: MaskOptions = {}): PropertyDecorator {
  return Transform(({ value }) => maskValue(value, options));
}
