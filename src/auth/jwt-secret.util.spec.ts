import { resolveJwtSecret } from './jwt-secret.util';

describe('resolveJwtSecret', () => {
  const origSecret = process.env.JWT_SECRET;
  const origEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (origSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = origSecret;

    if (origEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = origEnv;
  });

  it('returns configured JWT_SECRET when set', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-very-strong-production-secret';
    expect(resolveJwtSecret()).toBe('a-very-strong-production-secret');
  });

  it('throws in production when JWT_SECRET is missing or left as placeholder', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    expect(() => resolveJwtSecret()).toThrow(/JWT_SECRET/);

    process.env.JWT_SECRET = 'replace-with-a-strong-random-secret';
    expect(() => resolveJwtSecret()).toThrow(/JWT_SECRET/);
  });

  it('returns dev fallback only outside production', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.JWT_SECRET;
    expect(resolveJwtSecret()).toBe('dev-only-jwt-secret-plato400');
  });
});

