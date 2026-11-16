// AppError value (CTR-ERR-001) and factories for common and module codes.
import { COMMON_ERRORS, PLATFORM_ERRORS, type CommonCode, type ErrorSpec, type PlatformCode } from './codes.ts';

export interface FieldIssue {
  readonly path: string;
  readonly code: string;
}

export interface AppError {
  readonly code: string;
  readonly status: number;
  readonly retryable: boolean;
  readonly messageKey: string;
  readonly params: Readonly<Record<string, unknown>>;
  readonly fields?: readonly FieldIssue[];
  readonly retryAfterMs?: number;
}

export interface AppErrorExtra {
  readonly params?: Readonly<Record<string, unknown>>;
  readonly fields?: readonly FieldIssue[];
  readonly retryAfterMs?: number;
}

const CODE_RE = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

export function messageKeyFor(code: string): string {
  return `error.${code.toLowerCase()}`;
}

function build(code: string, spec: ErrorSpec, extra: AppErrorExtra | undefined): AppError {
  const base = { code, status: spec.status, retryable: spec.retryable, messageKey: messageKeyFor(code), params: extra?.params ?? {} };
  const withFields = extra?.fields && extra.fields.length > 0 ? { ...base, fields: extra.fields } : base;
  return extra?.retryAfterMs !== undefined ? { ...withFields, retryAfterMs: extra.retryAfterMs } : withFields;
}

/** Builds an AppError for a common (CTR-ERR-001) or kernel PLATFORM_* code. */
export function appError(code: CommonCode | PlatformCode, extra?: AppErrorExtra): AppError {
  const spec: ErrorSpec = code in COMMON_ERRORS ? COMMON_ERRORS[code as CommonCode] : PLATFORM_ERRORS[code as PlatformCode];
  return build(code, spec, extra);
}

export function isAppError(x: unknown): x is AppError {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  return typeof o['code'] === 'string' && typeof o['status'] === 'number' && typeof o['retryable'] === 'boolean' && typeof o['messageKey'] === 'string';
}

export interface ErrorRegistry<C extends string> {
  readonly codes: Readonly<Record<C, ErrorSpec>>;
  make(code: C, extra?: AppErrorExtra): AppError;
  has(code: string): code is C;
}

/**
 * Declares a module's error codes (ERR-1). Codes must be UPPER_SNAKE, prefixed by the feature
 * domain and must not shadow a common code; status must be 4xx/5xx.
 */
export function defineErrors<const C extends string>(table: Readonly<Record<C, ErrorSpec>>): ErrorRegistry<C> {
  for (const [code, spec] of Object.entries<ErrorSpec>(table)) {
    if (!CODE_RE.test(code) || !code.includes('_')) throw new Error(`defineErrors: invalid code ${code}`);
    if (code in COMMON_ERRORS) throw new Error(`defineErrors: ${code} shadows a common code`);
    if (!Number.isInteger(spec.status) || spec.status < 400 || spec.status > 599) throw new Error(`defineErrors: ${code} status ${spec.status}`);
  }
  return {
    codes: table,
    make: (code, extra) => build(code, table[code], extra),
    has: (code): code is C => Object.hasOwn(table, code),
  };
}

/**
 * Exception carrying an AppError across adapter boundaries that cannot return Results
 * (for example a busy SQLite database). The bus maps it back to the carried error.
 */
export class AppErrorException extends Error {
  readonly error: AppError;
  constructor(error: AppError) {
    super(error.code);
    this.name = 'AppErrorException';
    this.error = error;
  }
}
