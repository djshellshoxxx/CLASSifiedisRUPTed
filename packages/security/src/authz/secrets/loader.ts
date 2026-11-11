// Secret loading (V01–V04): RELAY_SECRET_<NAME> from the environment or RELAY_SECRET_<NAME>_FILE from a file with
// permission and size checks; all-or-nothing startup; atomic reload with an overlap for comparison secrets.
import { appError, err, ok, noopLogger, type AppError, type Clock, type Logger, type MetricsRegistry, type Result } from '@classrup/kernel';
import { equalConstantTime } from './compare.ts';
import { fromUtf8 } from './encoding.ts';
import type { FileOutcome, SecretEnvPort, SecretFilePort, SecretFileStat, Wait } from './ports.ts';
import { checkDataKeyVersions, checkFileStat, checkNotAmbiguous, checkPresent, checkStrength } from './rules.ts';
import {
  displayName,
  FILE_READ_ATTEMPTS,
  FILE_READ_SPACING_MS,
  OVERLAP_DEFAULT_MS,
  OVERLAP_MAX_MS,
  RELAY_SECRET_MANIFEST,
  secretErrors,
  variableName,
  type ManifestEntry,
  type SecretKind,
  type SecretManifest,
  type SecretSource,
  type SecretStatus,
} from './schema.ts';
import { Secret } from './secret.ts';

/** A loaded secret with its non-secret metadata. */
export interface LoadedSecret {
  readonly name: string;
  readonly display: string;
  readonly kind: SecretKind;
  readonly version?: number;
  readonly source: SecretSource;
  readonly bytes: number;
  readonly secret: Secret;
}

/** Metadata of one secret (P1, loggable). */
export interface SecretSummary {
  readonly name: string;
  readonly display: string;
  readonly kind: SecretKind;
  readonly version?: number;
  readonly source: SecretSource;
  readonly bytes: number;
}

/** Immutable set of loaded secrets; reload replaces the whole object. */
export interface SecretSet {
  readonly loadedAt: number;
  get(name: string): Secret | undefined;
  version(name: string, version: number): Secret | undefined;
  versions(name: string): readonly number[];
  summaries(): readonly SecretSummary[];
}

export interface SecretStatusRow {
  readonly name: string;
  readonly status: SecretStatus;
  readonly source?: SecretSource;
  readonly bytes?: number;
  readonly objects?: number;
  readonly code?: string;
}

export interface StartupReport {
  readonly rows: readonly SecretStatusRow[];
  readonly errors: readonly AppError[];
}

export interface SecretLoaderOptions {
  readonly env: SecretEnvPort;
  readonly files: SecretFilePort;
  readonly wait: Wait;
  readonly clock: Clock;
  readonly manifest?: SecretManifest;
  readonly logger?: Logger;
  readonly metrics?: MetricsRegistry;
}

export interface SecretLoader {
  readonly manifest: SecretManifest;
  /** Loads one manifest secret (name without the RELAY_SECRET_ prefix); versioned secrets need a version. */
  loadSecret(name: string, version?: number): Promise<Result<LoadedSecret, AppError>>;
  /** V03 checks for a key file owned by another module (the F15.S02.M01 relay key file). */
  checkSecretFile(path: string): Promise<Result<SecretFileStat, AppError>>;
  /**
   * Startup: every manifest secret exactly once with correct size and permissions, and every data-key version that
   * still wraps objects. All-or-nothing; one log line per secret with name, source and status, never a value.
   */
  loadAll(objectsByVersion?: ReadonlyMap<number, number>): Promise<Result<{ readonly set: SecretSet; readonly report: StartupReport }, StartupReport>>;
}

const STATUS_OF: Readonly<Record<string, SecretStatus>> = {
  SECURITY_SECRET_MISSING: 'missing',
  SECURITY_SECRET_AMBIGUOUS: 'ambiguous',
  SECURITY_SECRET_PERMISSIONS: 'permission-error',
  SECURITY_SECRET_WEAK: 'weak',
};

async function withRetry<T>(op: () => FileOutcome<T>, wait: Wait): Promise<FileOutcome<T>> {
  let last = op();
  for (let attempt = 1; attempt < FILE_READ_ATTEMPTS && !last.ok && last.transient; attempt++) {
    await wait(FILE_READ_SPACING_MS);
    last = op();
  }
  return last;
}

function stripNewline(text: string): string {
  return text.replace(/\r?\n$/, '');
}

function findEntry(manifest: SecretManifest, name: string): ManifestEntry | undefined {
  return manifest.find((e) => e.name === name);
}

function makeSet(loaded: readonly LoadedSecret[], loadedAt: number): SecretSet {
  const plain = new Map<string, LoadedSecret>();
  const versioned = new Map<string, Map<number, LoadedSecret>>();
  for (const s of loaded) {
    if (s.version === undefined) plain.set(s.name, s);
    else {
      const m = versioned.get(s.name) ?? new Map<number, LoadedSecret>();
      m.set(s.version, s);
      versioned.set(s.name, m);
    }
  }
  const summaries = Object.freeze(loaded.map(({ secret: _secret, ...meta }) => Object.freeze(meta)));
  return Object.freeze({
    loadedAt,
    get: (name: string) => plain.get(name)?.secret,
    version: (name: string, version: number) => versioned.get(name)?.get(version)?.secret,
    versions: (name: string) => [...(versioned.get(name)?.keys() ?? [])].sort((a, b) => a - b),
    summaries: () => summaries,
  });
}

/** Builds a SecretSet from already loaded secrets (tests and composition roots). */
export function secretSetOf(loaded: readonly LoadedSecret[], loadedAt: number): SecretSet {
  return makeSet(loaded, loadedAt);
}

const VERSION_RE = (name: string) => new RegExp(`^RELAY_SECRET_${name}_V([1-9][0-9]{0,5})(_FILE)?$`);

export function createSecretLoader(o: SecretLoaderOptions): SecretLoader {
  const manifest = o.manifest ?? RELAY_SECRET_MANIFEST;
  const log = o.logger ?? noopLogger;
  const loadedGauge = o.metrics?.gauge({ name: 'classrup_security_secrets_loaded', help: 'Secrets loaded by source (code label carries env or file).', labels: ['code'] });

  async function checkSecretFile(path: string): Promise<Result<SecretFileStat, AppError>> {
    const stat = await withRetry(() => o.files.lstat(path), o.wait);
    if (!stat.ok) return err(stat.reason === 'not_found' ? secretErrors.make('SECURITY_SECRET_MISSING', { params: { path } }) : secretErrors.make('SECURITY_SECRET_PERMISSIONS', { params: { path, problem: 'unreadable' } }));
    const checked = checkFileStat(path, stat.value, o.files.processUid());
    return checked.ok ? ok(stat.value) : checked;
  }

  async function readFileText(name: string, path: string): Promise<Result<string, AppError>> {
    const stat = await checkSecretFile(path);
    if (!stat.ok) return stat;
    const bytes = await withRetry(() => o.files.read(path), o.wait);
    if (!bytes.ok) return err(bytes.reason === 'not_found' ? secretErrors.make('SECURITY_SECRET_MISSING', { params: { name, path } }) : secretErrors.make('SECURITY_SECRET_PERMISSIONS', { params: { path, problem: 'unreadable' } }));
    const text = fromUtf8(bytes.value);
    if (text === undefined) return err(secretErrors.make('SECURITY_SECRET_WEAK', { params: { name } }));
    return ok(stripNewline(text));
  }

  async function loadSecret(name: string, version?: number): Promise<Result<LoadedSecret, AppError>> {
    const entry = findEntry(manifest, name);
    if (!entry || entry.versioned !== (version !== undefined)) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'name', code: 'NOT_IN_MANIFEST' }], params: { name } }));
    const variable = variableName(entry, version);
    const envValue = o.env.get(variable);
    const filePath = o.env.get(`${variable}_FILE`);
    const amb = checkNotAmbiguous(variable, envValue !== undefined, filePath !== undefined);
    if (!amb.ok) return amb;
    let text: string;
    let source: SecretSource;
    if (filePath !== undefined) {
      const r = await readFileText(variable, filePath);
      if (!r.ok) return r;
      text = r.value;
      source = 'file';
    } else {
      const present = checkPresent(variable, envValue);
      if (!present.ok) return present;
      text = present.value;
      source = 'env';
    }
    const present = checkPresent(variable, text);
    if (!present.ok) return present;
    const bytes = checkStrength(entry, variable, text);
    if (!bytes.ok) return bytes;
    return ok(Object.freeze({ name: entry.name, display: displayName(entry, version), kind: entry.kind, ...(version === undefined ? {} : { version }), source, bytes: bytes.value.length, secret: Secret.fromBytes(bytes.value) }));
  }

  function versionsInEnv(entry: ManifestEntry): number[] {
    const re = VERSION_RE(entry.name);
    const found = new Set<number>();
    for (const n of o.env.names()) {
      const m = re.exec(n);
      if (m?.[1]) found.add(Number(m[1]));
    }
    return [...found].sort((a, b) => a - b);
  }

  async function loadEntry(entry: ManifestEntry, objectsByVersion: ReadonlyMap<number, number>, rows: SecretStatusRow[], errors: AppError[], loaded: LoadedSecret[]): Promise<void> {
    const versions: (number | undefined)[] = entry.versioned ? versionsInEnv(entry) : [undefined];
    const loadedVersions = new Set<number>();
    for (const v of versions) {
      const r = await loadSecret(entry.name, v);
      const display = displayName(entry, v);
      if (r.ok) {
        loaded.push(r.value);
        if (v !== undefined) loadedVersions.add(v);
        const objects = v === undefined ? undefined : (objectsByVersion.get(v) ?? 0);
        rows.push({ name: display, status: 'loaded', source: r.value.source, bytes: r.value.bytes, ...(objects === undefined ? {} : { objects }) });
      } else {
        errors.push(r.error);
        rows.push({ name: display, status: STATUS_OF[r.error.code] ?? 'missing', code: r.error.code });
      }
    }
    if (!entry.versioned) return;
    const versionsOk = versions.length === 0 && !entry.required ? ok(undefined) : checkDataKeyVersions(loadedVersions, objectsByVersion, entry.name);
    if (versionsOk.ok) return;
    errors.push(versionsOk.error);
    const v = versionsOk.error.params['version'];
    const objects = versionsOk.error.params['objects'];
    rows.push({ name: typeof v === 'number' ? displayName(entry, v) : displayName(entry), status: 'missing', code: versionsOk.error.code, ...(typeof objects === 'number' ? { objects } : {}) });
  }

  async function loadAll(objectsByVersion: ReadonlyMap<number, number> = new Map()) {
    const rows: SecretStatusRow[] = [];
    const errors: AppError[] = [];
    const loaded: LoadedSecret[] = [];
    for (const entry of manifest) {
      if (!entry.versioned && !entry.required && o.env.get(variableName(entry)) === undefined && o.env.get(`${variableName(entry)}_FILE`) === undefined) continue;
      await loadEntry(entry, objectsByVersion, rows, errors, loaded);
    }
    for (const row of rows) {
      if (row.status === 'loaded') log.info('secret.loaded', { name: row.name, source: row.source, bytes: row.bytes, ...(row.objects === undefined ? {} : { objects: row.objects }) });
      else log.error('secret.invalid', { name: row.name, code: row.code, ...(row.objects === undefined ? {} : { objects: row.objects }) });
    }
    const report: StartupReport = Object.freeze({ rows: Object.freeze(rows), errors: Object.freeze(errors) });
    if (errors.length > 0) return err(report);
    for (const source of ['env', 'file'] as const) loadedGauge?.set({ code: source }, loaded.filter((s) => s.source === source).length);
    return ok({ set: makeSet(loaded, o.clock.now()), report });
  }

  return { manifest, loadSecret, checkSecretFile, loadAll };
}

/** One line per secret, plain text, status in words (operator startup summary). */
export function formatStartupSummary(report: StartupReport): string[] {
  return report.rows.map((r) => {
    if (r.status !== 'loaded') return `${r.name} ${r.status}${r.code ? ` (${r.code}${r.objects === undefined ? '' : `; ${r.objects} objects still wrapped`})` : ''}`;
    const extra = r.objects !== undefined && r.objects > 0 ? `; ${r.objects} objects still wrapped` : '';
    return `${r.name} loaded (${r.source}, ${r.bytes} bytes${extra})`;
  });
}

export interface SecretHolder {
  current(): SecretSet;
  /**
   * SIGHUP reload: loads a new set and swaps it in atomically; a failed reload keeps the previous values. The
   * previous value of a comparison secret stays valid for the overlap window; data-wrapping keys are exempt.
   */
  reload(load: () => Promise<Result<{ readonly set: SecretSet }, StartupReport>>): Promise<Result<SecretSet, StartupReport>>;
  /** Comparison secrets accepted now: the current value plus the previous one inside the overlap window. */
  accepted(name: string): readonly Secret[];
  /** Constant-time check of a presented value against every accepted value of a comparison secret. */
  matches(name: string, candidate: Uint8Array): boolean;
}

export interface SecretHolderOptions {
  readonly clock: Clock;
  readonly manifest?: SecretManifest;
  /** 0..300 000 ms, default 120 000 ms. */
  readonly overlapMs?: number;
  readonly logger?: Logger;
  readonly metrics?: MetricsRegistry;
}

export function createSecretHolder(initial: SecretSet, o: SecretHolderOptions): Result<SecretHolder, AppError> {
  const overlap = o.overlapMs ?? OVERLAP_DEFAULT_MS;
  if (!Number.isInteger(overlap) || overlap < 0 || overlap > OVERLAP_MAX_MS) return err(appError('VALIDATION_FAILED', { fields: [{ path: 'overlapMs', code: 'OUT_OF_RANGE' }] }));
  const manifest = o.manifest ?? RELAY_SECRET_MANIFEST;
  const log = o.logger ?? noopLogger;
  const reloads = o.metrics?.counter({ name: 'classrup_security_secret_reload_total', help: 'Secret reloads by outcome.', labels: ['outcome'] });
  // One immutable state object, replaced as a whole: readers see either the old or the new set.
  let state: { readonly current: SecretSet; readonly previous?: SecretSet; readonly swappedAt: number } = { current: initial, swappedAt: o.clock.now() };
  const kindOf = (name: string) => manifest.find((e) => e.name === name)?.kind;

  const accepted = (name: string): readonly Secret[] => {
    const s = state;
    const now = s.current.get(name);
    const list = now ? [now] : [];
    if (kindOf(name) !== 'comparison' || !s.previous) return list;
    const prev = s.previous.get(name);
    if (prev && o.clock.now() - s.swappedAt <= overlap) list.push(prev);
    return list;
  };

  return ok({
    current: () => state.current,
    reload: async (load) => {
      const r = await load();
      if (!r.ok) {
        reloads?.inc({ outcome: 'failed' });
        log.error('secret.reload_failed', { codes: r.error.errors.map((e) => e.code) });
        return r;
      }
      state = { current: r.value.set, previous: state.current, swappedAt: o.clock.now() };
      reloads?.inc({ outcome: 'ok' });
      return ok(r.value.set);
    },
    accepted,
    matches: (name, candidate) => {
      let any = false;
      for (const s of accepted(name)) any = equalConstantTime(s.reveal(), candidate) || any;
      return any;
    },
  });
}
