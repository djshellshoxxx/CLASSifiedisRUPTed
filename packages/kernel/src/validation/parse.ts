// Strict input parsing with zod mapped to VALIDATION_FAILED {fields:[{path,code}]} (CTR-ERR-001, CTR-SCH-001 SCH-2).
import type * as z from 'zod';
import { appError, type AppError, type FieldIssue } from '../errors/app-error.ts';
import { err, ok, type Result } from '../errors/result.ts';

type Issue = z.core.$ZodIssue & { readonly input?: unknown };

function pathOf(path: readonly PropertyKey[]): string {
  return path.map((p) => String(p)).join('.');
}

function codeOf(issue: Issue): string {
  switch (issue.code) {
    case 'invalid_type':
      return issue.input === undefined ? 'REQUIRED' : 'INVALID_TYPE';
    case 'too_small':
      return 'TOO_SMALL';
    case 'too_big':
      return 'TOO_BIG';
    case 'invalid_format':
      return 'INVALID_FORMAT';
    case 'not_multiple_of':
      return 'NOT_MULTIPLE_OF';
    case 'invalid_value':
      return 'INVALID_VALUE';
    case 'invalid_union':
      return 'INVALID_UNION';
    case 'invalid_key':
      return 'INVALID_KEY';
    case 'invalid_element':
      return 'INVALID_ELEMENT';
    case 'custom': {
      const code = (issue.params as { code?: unknown } | undefined)?.code;
      return typeof code === 'string' ? code : 'INVALID';
    }
    default:
      return 'INVALID';
  }
}

export function issuesToFields(issues: readonly Issue[]): FieldIssue[] {
  const fields: FieldIssue[] = [];
  for (const issue of issues) {
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) fields.push({ path: pathOf([...issue.path, key]), code: 'UNKNOWN_FIELD' });
    } else {
      fields.push({ path: pathOf(issue.path), code: codeOf(issue) });
    }
  }
  return fields;
}

/** Parses untrusted input; any violation yields VALIDATION_FAILED with stable field codes. */
export function parseInput<S extends z.ZodType>(schema: S, raw: unknown): Result<z.output<S>, AppError> {
  const r = schema.safeParse(raw, { reportInput: true });
  if (r.success) return ok(r.data);
  return err(appError('VALIDATION_FAILED', { fields: issuesToFields(r.error.issues as readonly Issue[]) }));
}
