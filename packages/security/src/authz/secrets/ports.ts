// Consumer-owned ports of F16.S01.M02. The relay composition root wires Node adapters (process.env, node:fs);
// this module stays isomorphic and never imports node: modules.
import type { AppError, Result } from '@classrup/kernel';

/** Read-only view of the process environment. */
export interface SecretEnvPort {
  get(name: string): string | undefined;
  /** Variable names present, used to discover versioned secrets (RELAY_SECRET_DATA_KEY_V<n>). */
  names(): readonly string[];
}

export interface SecretFileStat {
  /** lstat result: true when the path itself is a symbolic link (never followed). */
  readonly isSymbolicLink: boolean;
  readonly isFile: boolean;
  /** Permission bits (mode & 0o7777). */
  readonly mode: number;
  readonly uid: number;
  readonly size: number;
}

/** Outcome of one file operation; transient IO errors (EAGAIN, EIO, EBUSY) may be retried, others not. */
export type FileOutcome<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly transient: boolean; readonly reason: 'not_found' | 'io' };

export interface SecretFilePort {
  /** lstat of the path without following symlinks. */
  lstat(path: string): FileOutcome<SecretFileStat>;
  read(path: string): FileOutcome<Uint8Array>;
  /** Effective uid of the relay process. */
  processUid(): number;
}

/** Waits between file read retries (100 ms spacing); injected so domain code never touches timers. */
export type Wait = (ms: number) => Promise<void>;

/**
 * Owning storage of wrapped per-object data keys (relay-local table security_rewrap_progress: objectId, keyVersion).
 * Implemented by the storage module that owns the wrapped objects.
 */
export interface RewrapStorePort {
  /** Verify pass: number of objects still wrapped by each data-key version. */
  countByVersion(): ReadonlyMap<number, number> | Promise<ReadonlyMap<number, number>>;
  /** Up to limit object IDs still wrapped by version, in ID order after afterId. */
  objectsOn(version: number, afterId: string | undefined, limit: number): readonly string[] | Promise<readonly string[]>;
  /**
   * Re-wraps one batch in one transaction and records (objectId, keyVersion) progress for each object, so a
   * repeated run skips finished objects. Returns how many objects moved.
   */
  rewrapBatch(objectIds: readonly string[], fromVersion: number, toVersion: number): Result<number, AppError> | Promise<Result<number, AppError>>;
}
