// RFC 8785 JSON Canonicalization Scheme through the vendored canonicalize 5.1.0, plus the strict JSON value
// checks and the strict parser (duplicate member names rejected) that every signing path relies on.
import canonicalize from 'canonicalize';
import { err, ok, type Result } from '@classrup/kernel';
import { utf8 } from './encoding.ts';

/** Why a value or text cannot be canonicalized; callers map it to their own stable error code. */
export type JsonIssue = 'NOT_JSON' | 'NON_FINITE' | 'FLOAT' | 'LONE_SURROGATE' | 'DUPLICATE_KEY' | 'TOO_DEEP' | 'TOO_LARGE' | 'SYNTAX';

export interface JsonLimits {
  /** Maximum nesting depth of arrays and objects (default 32). */
  readonly maxDepth?: number;
  /** Non-integer and unsafe-integer numbers are refused unless true (default true, as RFC 8785 allows them). */
  readonly allowFloats?: boolean;
  /** Maximum UTF-8 size of the canonical text or of the parsed text. */
  readonly maxBytes?: number;
}

const DEFAULT_DEPTH = 32;

function isPlainObject(v: object): boolean {
  const proto = Object.getPrototypeOf(v) as unknown;
  return proto === Object.prototype || proto === null;
}

function checkNumber(n: number, allowFloats: boolean): JsonIssue | undefined {
  if (!Number.isFinite(n)) return 'NON_FINITE';
  if (!allowFloats && !Number.isSafeInteger(n)) return 'FLOAT';
  if (Object.is(n, -0) && !allowFloats) return 'FLOAT';
  return undefined;
}

/**
 * Checks that a value is plain JSON data: null, booleans, well-formed strings, finite numbers, dense arrays
 * and plain objects without undefined members, within the depth limit. Anything JSON.stringify would drop,
 * coerce or call (undefined, functions, symbols, bigint, Date and other toJSON objects) is refused, so the
 * canonical bytes always describe exactly the value a reader sees.
 */
export function checkJsonValue(value: unknown, limits: JsonLimits = {}): JsonIssue | undefined {
  const maxDepth = limits.maxDepth ?? DEFAULT_DEPTH;
  const allowFloats = limits.allowFloats ?? true;
  const stack: Array<{ v: unknown; depth: number }> = [{ v: value, depth: 0 }];
  while (stack.length > 0) {
    const { v, depth } = stack.pop()!;
    if (v === null || typeof v === 'boolean') continue;
    if (typeof v === 'string') {
      if (!v.isWellFormed()) return 'LONE_SURROGATE';
      continue;
    }
    if (typeof v === 'number') {
      const issue = checkNumber(v, allowFloats);
      if (issue) return issue;
      continue;
    }
    if (typeof v !== 'object') return 'NOT_JSON';
    if (depth >= maxDepth) return 'TOO_DEEP';
    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) {
        if (!(i in v) || v[i] === undefined) return 'NOT_JSON';
        stack.push({ v: v[i], depth: depth + 1 });
      }
      continue;
    }
    if (!isPlainObject(v) || typeof (v as { toJSON?: unknown }).toJSON === 'function') return 'NOT_JSON';
    for (const key of Object.keys(v)) {
      if (!key.isWellFormed()) return 'LONE_SURROGATE';
      const child = (v as Record<string, unknown>)[key];
      if (child === undefined) return 'NOT_JSON';
      stack.push({ v: child, depth: depth + 1 });
    }
    if (Object.getOwnPropertySymbols(v).length > 0) return 'NOT_JSON';
  }
  return undefined;
}

/** RFC 8785 canonical text of a plain JSON value. */
export function jcs(value: unknown, limits: JsonLimits = {}): Result<string, JsonIssue> {
  const issue = checkJsonValue(value, limits);
  if (issue) return err(issue);
  let text: string | undefined;
  try {
    text = canonicalize(value);
  } catch {
    return err('NOT_JSON');
  }
  if (text === undefined) return err('NOT_JSON');
  if (limits.maxBytes !== undefined && utf8(text).length > limits.maxBytes) return err('TOO_LARGE');
  return ok(text);
}

/** RFC 8785 canonical UTF-8 bytes of a plain JSON value. */
export function jcsBytes(value: unknown, limits: JsonLimits = {}): Result<Uint8Array, JsonIssue> {
  const text = jcs(value, limits);
  return text.ok ? ok(utf8(text.value)) : text;
}

class ParseFailure extends Error {
  readonly issue: JsonIssue;
  constructor(issue: JsonIssue) {
    super(issue);
    this.issue = issue;
  }
}

const NUMBER_RE = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
const ESCAPES: Readonly<Record<string, string>> = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };

/**
 * Strict JSON parser: RFC 8259 grammar, duplicate member names refused (so every platform reads the same
 * object from the same bytes), lone surrogates and non-finite numbers refused, depth and size bounded.
 */
export function parseStrictJson(text: string, limits: JsonLimits = {}): Result<unknown, JsonIssue> {
  if (typeof text !== 'string') return err('SYNTAX');
  if (limits.maxBytes !== undefined && utf8(text).length > limits.maxBytes) return err('TOO_LARGE');
  const maxDepth = limits.maxDepth ?? DEFAULT_DEPTH;
  const allowFloats = limits.allowFloats ?? true;
  let i = 0;
  const fail = (issue: JsonIssue = 'SYNTAX'): never => {
    throw new ParseFailure(issue);
  };
  const ws = (): void => {
    while (i < text.length && (text[i] === ' ' || text[i] === '\t' || text[i] === '\n' || text[i] === '\r')) i++;
  };
  const str = (): string => {
    if (text[i] !== '"') fail();
    i++;
    let out = '';
    for (;;) {
      if (i >= text.length) fail();
      const c = text[i]!;
      if (c === '"') {
        i++;
        break;
      }
      if (c === '\\') {
        const e = text[i + 1];
        if (e === 'u') {
          const hex = text.slice(i + 2, i + 6);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail();
          out += String.fromCharCode(Number.parseInt(hex, 16));
          i += 6;
        } else {
          const m = e === undefined ? undefined : ESCAPES[e];
          if (m === undefined) fail();
          out += m;
          i += 2;
        }
        continue;
      }
      if (c < ' ') fail();
      out += c;
      i++;
    }
    if (!out.isWellFormed()) fail('LONE_SURROGATE');
    return out;
  };
  const num = (): number => {
    NUMBER_RE.lastIndex = i;
    const m = NUMBER_RE.exec(text);
    if (!m) fail();
    i += m![0].length;
    const n = Number(m![0]);
    const issue = checkNumber(n, allowFloats);
    if (issue) fail(issue);
    return n;
  };
  const value = (depth: number): unknown => {
    ws();
    const c = text[i];
    if (c === '{' || c === '[') {
      if (depth >= maxDepth) fail('TOO_DEEP');
      i++;
      ws();
      if (c === '[') {
        const arr: unknown[] = [];
        if (text[i] === ']') {
          i++;
          return arr;
        }
        for (;;) {
          arr.push(value(depth + 1));
          ws();
          if (text[i] === ',') i++;
          else if (text[i] === ']') {
            i++;
            return arr;
          } else fail();
        }
      }
      const entries: Array<[string, unknown]> = [];
      const seen = new Set<string>();
      if (text[i] === '}') {
        i++;
        return {};
      }
      for (;;) {
        ws();
        const key = str();
        if (seen.has(key)) fail('DUPLICATE_KEY');
        seen.add(key);
        ws();
        if (text[i] !== ':') fail();
        i++;
        entries.push([key, value(depth + 1)]);
        ws();
        if (text[i] === ',') i++;
        else if (text[i] === '}') {
          i++;
          return Object.fromEntries(entries);
        } else fail();
      }
    }
    if (c === '"') return str();
    if (text.startsWith('true', i)) {
      i += 4;
      return true;
    }
    if (text.startsWith('false', i)) {
      i += 5;
      return false;
    }
    if (text.startsWith('null', i)) {
      i += 4;
      return null;
    }
    return num();
  };
  try {
    const v = value(0);
    ws();
    if (i !== text.length) fail();
    return ok(v);
  } catch (e) {
    if (e instanceof ParseFailure) return err(e.issue);
    return err('SYNTAX');
  }
}
