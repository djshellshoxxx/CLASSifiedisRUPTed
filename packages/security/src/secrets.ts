/**
 * F16.S01.M02 secrets: loaded from the environment (or a secret store adapter), wrapped so
 * they never serialize or print. Errors name missing variables, never values.
 */
import { validationError } from '@classrup/kernel';

export class Secret {
  readonly #value: string;
  constructor(value: string) {
    this.#value = value;
  }
  reveal(): string {
    return this.#value;
  }
  toString(): string {
    return '[secret]';
  }
  toJSON(): string {
    return '[secret]';
  }
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return '[secret]';
  }
}

export interface SecretSpec {
  readonly name: string;
  readonly required: boolean;
  readonly minLength?: number;
}

export function loadSecrets(env: Readonly<Record<string, string | undefined>>, specs: readonly SecretSpec[]): Map<string, Secret> {
  const out = new Map<string, Secret>();
  const missing: string[] = [];
  const weak: string[] = [];
  for (const s of specs) {
    const v = env[s.name];
    if (v === undefined || v === '') {
      if (s.required) missing.push(s.name);
      continue;
    }
    if (s.minLength !== undefined && v.length < s.minLength) weak.push(s.name);
    out.set(s.name, new Secret(v));
  }
  if (missing.length > 0 || weak.length > 0) {
    throw validationError('SECRETS.INVALID', 'secret configuration invalid', { missing, weak });
  }
  return out;
}
