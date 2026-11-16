// Common error codes (CTR-ERR-001 table, plus ID_TIMESTAMP_SKEW from CTR-ID-001 ID-1). Codes are stable forever.
export interface ErrorSpec {
  readonly status: number;
  readonly retryable: boolean;
}

export const COMMON_ERRORS = {
  VALIDATION_FAILED: { status: 422, retryable: false },
  UNAUTHENTICATED: { status: 401, retryable: false },
  FORBIDDEN: { status: 403, retryable: false },
  NOT_FOUND: { status: 404, retryable: false },
  CONFLICT_REVISION: { status: 409, retryable: false },
  CONFLICT_STATE: { status: 409, retryable: false },
  IDEMPOTENCY_KEY_REUSED: { status: 422, retryable: false },
  PRECONDITION_FAILED: { status: 412, retryable: false },
  EXPIRED: { status: 410, retryable: false },
  RATE_LIMITED: { status: 429, retryable: true },
  FEATURE_DISABLED: { status: 404, retryable: false },
  PAYLOAD_TOO_LARGE: { status: 413, retryable: false },
  UNSUPPORTED_SCHEMA_VERSION: { status: 400, retryable: false },
  BLOCKED_PARTY: { status: 403, retryable: false },
  DEPENDENCY_UNAVAILABLE: { status: 503, retryable: true },
  INTERNAL: { status: 500, retryable: true },
  ID_TIMESTAMP_SKEW: { status: 422, retryable: false },
} as const satisfies Record<string, ErrorSpec>;

export type CommonCode = keyof typeof COMMON_ERRORS;

/** Kernel-owned module codes (PLATFORM_*), declared in the F15 module specs. */
export const PLATFORM_ERRORS = {
  PLATFORM_BUS_UNSUPPORTED_MEDIA_TYPE: { status: 415, retryable: false },
  PLATFORM_BUS_METHOD_NOT_ALLOWED: { status: 405, retryable: false },
  PLATFORM_STORE_MIGRATION_DRIFT: { status: 500, retryable: false },
} as const satisfies Record<string, ErrorSpec>;

export type PlatformCode = keyof typeof PLATFORM_ERRORS;
