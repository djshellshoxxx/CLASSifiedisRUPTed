import { describe, expect, it } from 'vitest';
import { appError, defineErrors, isAppError } from './app-error.ts';
import { COMMON_ERRORS } from './codes.ts';
import { toProblemJson } from './problem.ts';

describe('typed errors (CTR-ERR-001)', () => {
  it('TEST-PS-117-09.T18 problem+json carries only contract fields; the common code table matches CTR-ERR-001', () => {
    const e = appError('VALIDATION_FAILED', { fields: [{ path: 'price.amount', code: 'TOO_SMALL' }] });
    expect(toProblemJson(e, 'corr-1')).toEqual({
      type: 'urn:classrup:error:VALIDATION_FAILED',
      title: 'VALIDATION_FAILED',
      status: 422,
      code: 'VALIDATION_FAILED',
      retryable: false,
      messageKey: 'error.validation_failed',
      params: {},
      fields: [{ path: 'price.amount', code: 'TOO_SMALL' }],
      correlationId: 'corr-1',
      retryAfterMs: null,
    });
    const internal = toProblemJson(appError('INTERNAL'), 'c');
    expect(Object.keys(internal)).not.toContain('stack');
    expect(JSON.stringify(internal)).not.toMatch(/SELECT|Error:|at /);
    expect(toProblemJson(appError('RATE_LIMITED', { retryAfterMs: 1500 })).retryAfterMs).toBe(1500);
    const table = Object.fromEntries(Object.entries(COMMON_ERRORS).map(([c, v]) => [c, `${v.status}/${v.retryable ? 'yes' : 'no'}`]));
    expect(table).toEqual({
      VALIDATION_FAILED: '422/no', UNAUTHENTICATED: '401/no', FORBIDDEN: '403/no', NOT_FOUND: '404/no', CONFLICT_REVISION: '409/no', CONFLICT_STATE: '409/no',
      IDEMPOTENCY_KEY_REUSED: '422/no', PRECONDITION_FAILED: '412/no', EXPIRED: '410/no', RATE_LIMITED: '429/yes', FEATURE_DISABLED: '404/no', PAYLOAD_TOO_LARGE: '413/no',
      UNSUPPORTED_SCHEMA_VERSION: '400/no', BLOCKED_PARTY: '403/no', DEPENDENCY_UNAVAILABLE: '503/yes', INTERNAL: '500/yes', ID_TIMESTAMP_SKEW: '422/no',
    });
    const mod = defineErrors({ BAZAAR_OFFER_SELF: { status: 422, retryable: false } });
    expect(mod.make('BAZAAR_OFFER_SELF', { params: { offerId: 'o' } })).toEqual({ code: 'BAZAAR_OFFER_SELF', status: 422, retryable: false, messageKey: 'error.bazaar_offer_self', params: { offerId: 'o' } });
    expect(mod.has('BAZAAR_OFFER_SELF') && !mod.has('NOPE')).toBe(true);
    expect(() => defineErrors({ NOT_FOUND: { status: 404, retryable: false } })).toThrow('shadows');
    expect(() => defineErrors({ bazaar_bad: { status: 422, retryable: false } })).toThrow('invalid');
    expect(() => defineErrors({ BAZAAR_OK: { status: 200, retryable: false } })).toThrow('status');
    expect(isAppError(e) && !isAppError(new Error('x'))).toBe(true);
  });
});
