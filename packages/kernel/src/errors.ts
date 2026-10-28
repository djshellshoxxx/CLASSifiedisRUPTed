/**
 * CTR-ERR-001: typed domain errors.
 * `code` is a stable machine identifier `AREA.REASON` (upper snake segments).
 * `details` must never contain secrets, exact locations or message bodies:
 * it is returned to clients and written to logs.
 */
export type ErrorCategory =
  | 'validation'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'precondition'
  | 'rate_limited'
  | 'unavailable'
  | 'disabled'
  | 'internal';

const HTTP_STATUS: Record<ErrorCategory, number> = {
  validation: 400,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  precondition: 422,
  rate_limited: 429,
  disabled: 404,
  unavailable: 503,
  internal: 500,
};

const RETRYABLE: Record<ErrorCategory, boolean> = {
  validation: false,
  unauthenticated: false,
  forbidden: false,
  not_found: false,
  conflict: true,
  precondition: false,
  rate_limited: true,
  disabled: false,
  unavailable: true,
  internal: false,
};

export type ErrorDetails = Readonly<Record<string, string | number | boolean | null | readonly string[]>>;

const CODE_PATTERN = /^[A-Z][A-Z0-9_]*(\.[A-Z][A-Z0-9_]*)+$/;

export class DomainError extends Error {
  readonly code: string;
  readonly category: ErrorCategory;
  readonly details: ErrorDetails;
  readonly retryable: boolean;

  constructor(category: ErrorCategory, code: string, message: string, details: ErrorDetails = {}) {
    super(message);
    if (!CODE_PATTERN.test(code)) throw new TypeError(`invalid error code: ${code}`);
    this.name = 'DomainError';
    this.category = category;
    this.code = code;
    this.details = details;
    this.retryable = RETRYABLE[category];
  }

  get httpStatus(): number {
    return HTTP_STATUS[this.category];
  }

  toJSON(): ErrorBody {
    return { code: this.code, category: this.category, message: this.message, retryable: this.retryable, details: this.details };
  }
}

export interface ErrorBody {
  code: string;
  category: ErrorCategory;
  message: string;
  retryable: boolean;
  details: ErrorDetails;
}

export const isDomainError = (e: unknown): e is DomainError => e instanceof DomainError;

const make =
  (category: ErrorCategory) =>
  (code: string, message: string, details?: ErrorDetails): DomainError =>
    new DomainError(category, code, message, details);

export const validationError = make('validation');
export const unauthenticated = make('unauthenticated');
export const forbidden = make('forbidden');
export const notFound = make('not_found');
export const conflict = make('conflict');
export const precondition = make('precondition');
export const rateLimited = make('rate_limited');
export const unavailable = make('unavailable');
export const disabled = make('disabled');
export const internalError = make('internal');

/** Assert an invariant that only a programmer error can break. */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new DomainError('internal', 'KERNEL.INVARIANT', message);
}
