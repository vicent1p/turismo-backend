const PLACEHOLDER_SECRET = 'replace-with-a-strong-random-secret';
const DEV_FALLBACK_SECRET = 'dev-only-jwt-secret-plato400';

/**
 * Resolves the JWT signing/verification secret.
 * In production (`NODE_ENV=production`), refuses to start without a real `JWT_SECRET`.
 */
export function resolveJwtSecret(): string {
  const configured = process.env.JWT_SECRET?.trim();
  if (configured && configured !== PLACEHOLDER_SECRET) {
    return configured;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET environment variable must be configured with a strong secret in production.',
    );
  }

  return DEV_FALLBACK_SECRET;
}

