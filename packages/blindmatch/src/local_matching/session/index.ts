import { appError, err, ok, z, type AppError, type Clock, type Result } from '@classrup/kernel';
import type { LocalIntentStore, PrivateIntent } from '../../intents/local/index.ts';
import { matchLocalCandidates, type LocalMatchSuggestion } from '../matcher/index.ts';

/** Reads an authenticated, already-retained public snapshot. This port must never
 * fetch from a relay/provider. Private criteria are deliberately absent from its input. */
export interface LocalCandidateRequest {
  readonly signal: AbortSignal;
  readonly limit: 128;
}

export interface LocalMatchSessionOptions {
  readonly intents: LocalIntentStore;
  readonly principal: string;
  readonly clock: Clock;
  readonly isCurrent: () => boolean;
  readonly enabled?: boolean;
  readonly loadCandidates: (request: LocalCandidateRequest) => Promise<readonly unknown[]>;
  readonly blockedOwners?: () => readonly string[];
}

export interface LocalMatchResult {
  readonly mode: 'local';
  readonly intentRevision: number;
  readonly items: readonly LocalMatchSuggestion[];
}

export interface LocalMatchSession {
  match(input: unknown, options?: { readonly signal?: AbortSignal }): Promise<Result<LocalMatchResult, AppError>>;
  cancel(): void;
}

const requestSchema = z.strictObject({
  id: z.uuidv4(),
  expectedRevision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  mode: z.enum(['local', 'bilateral-confidential', 'advanced-confidential']).default('local'),
});

/** One owner session, one ephemeral job. No job, result, event or deletion history
 * is persisted. Reopening a vault requires a fresh match call. */
export function createLocalMatchSession(options: LocalMatchSessionOptions): LocalMatchSession {
  const { intents, principal, clock, isCurrent, loadCandidates, blockedOwners } = options;
  const enabled = options.enabled === true;
  let active: AbortController | undefined;

  function cancel(): void {
    active?.abort();
    active = undefined;
  }

  function current(): boolean {
    try { return isCurrent() === true; } catch { return false; }
  }

  function validNow(): number | undefined {
    const now = clock.now();
    return Number.isSafeInteger(now) && Math.abs(now) <= 8_640_000_000_000_000 ? now : undefined;
  }

  function usable(data: PrivateIntent, revision: number, expectedRevision: number): AppError | undefined {
    if (data.ownerId !== principal) return appError('FORBIDDEN');
    if (revision !== expectedRevision) return appError('CONFLICT_REVISION');
    if (data.state !== 'active') return appError('PRECONDITION_FAILED');
    const now = validNow();
    if (now === undefined) return appError('VALIDATION_FAILED');
    if (Date.parse(data.expiresAt) <= now) return appError('EXPIRED');
    return undefined;
  }

  /** Abort settles locally even if a broken adapter never resolves or ignores its signal. */
  async function waitFor<T>(controller: AbortController, operation: () => Promise<T>): Promise<T> {
    let abort: (() => void) | undefined;
    try {
      return await new Promise<T>((resolve, reject) => {
        abort = () => reject(new Error('Cancelled local match'));
        controller.signal.addEventListener('abort', abort, { once: true });
        if (controller.signal.aborted) { abort(); return; }
        Promise.resolve().then(() => {
          if (controller.signal.aborted) throw new Error('Cancelled local match');
          return operation();
        }).then(resolve, reject);
      });
    } finally {
      if (abort) controller.signal.removeEventListener('abort', abort);
    }
  }

  return {
    cancel,
    async match(input, callOptions) {
      cancel();
      if (!enabled) return err(appError('FEATURE_DISABLED'));
      if (!current()) return err(appError('FORBIDDEN'));
      let parsed: ReturnType<typeof requestSchema.safeParse>;
      try { parsed = requestSchema.safeParse(input); }
      catch { return err(appError('VALIDATION_FAILED')); }
      if (!parsed.success) return err(appError('VALIDATION_FAILED'));
      if (parsed.data.mode !== 'local') return err(appError('DEPENDENCY_UNAVAILABLE'));
      if (callOptions?.signal?.aborted) return err(appError('PRECONDITION_FAILED'));
      const controller = new AbortController();
      active = controller;
      const abort = () => controller.abort();
      callOptions?.signal?.addEventListener('abort', abort, { once: true });
      const epoch = intents.epoch();
      const admitted = () => current() && active === controller && !controller.signal.aborted && intents.epoch() === epoch;
      try {
        const before = await waitFor(controller, () => intents.read(parsed.data.id));
        if (!admitted()) return err(appError('PRECONDITION_FAILED'));
        if (!before.ok) return before;
        const beforeError = usable(before.value.data, before.value.revision, parsed.data.expectedRevision);
        if (beforeError) return err(beforeError);
        const snapshot = await waitFor(controller, () => loadCandidates({ signal: controller.signal, limit: 128 }));
        if (!admitted()) return err(appError('PRECONDITION_FAILED'));
        // A second controller may have changed the durable intent; check both
        // revision and local epoch immediately before releasing references.
        const after = await waitFor(controller, () => intents.read(parsed.data.id));
        if (!admitted()) return err(appError('PRECONDITION_FAILED'));
        if (!after.ok) return after;
        const afterError = usable(after.value.data, after.value.revision, parsed.data.expectedRevision);
        if (afterError) return err(afterError);
        const now = validNow();
        if (now === undefined) return err(appError('VALIDATION_FAILED'));
        const matched = matchLocalCandidates(after.value.data.criteria, snapshot, {
          ownerId: principal, now, signal: controller.signal,
          ...(blockedOwners ? { blockedOwners: blockedOwners() } : {}),
        });
        if (!matched.ok) return matched;
        if (!admitted()) return err(appError('PRECONDITION_FAILED'));
        return ok({ mode: 'local', intentRevision: after.value.revision, items: matched.value });
      } catch {
        return err(appError(admitted() ? 'DEPENDENCY_UNAVAILABLE' : 'PRECONDITION_FAILED'));
      } finally {
        callOptions?.signal?.removeEventListener('abort', abort);
        if (active === controller) active = undefined;
      }
    },
  };
}
