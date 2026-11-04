// RFC 9457-compatible problem details rendering of AppError (CTR-ERR-001).
import type { AppError, FieldIssue } from './app-error.ts';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

export interface ProblemJson {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;
  readonly messageKey: string;
  readonly params: Readonly<Record<string, unknown>>;
  readonly fields?: readonly FieldIssue[];
  readonly correlationId: string | null;
  readonly retryAfterMs: number | null;
}

/** Renders only contract fields: never stack traces, SQL, hostnames or free-text internals (ERR-2). */
export function toProblemJson(error: AppError, correlationId?: string): ProblemJson {
  const base = {
    type: `urn:classrup:error:${error.code}`,
    title: error.code,
    status: error.status,
    code: error.code,
    retryable: error.retryable,
    messageKey: error.messageKey,
    params: error.params,
  };
  const tail = { correlationId: correlationId ?? null, retryAfterMs: error.retryAfterMs ?? null };
  return error.fields && error.fields.length > 0 ? { ...base, fields: error.fields, ...tail } : { ...base, ...tail };
}
