import { z } from '../../../packages/kernel/src/index.ts';

const PAGE_SIZE = 100;
const PAGES_PER_PASS = 5;
const CYCLE_INTERVAL_MS = 60_000;
const pageSchema = z.object({
  processed: z.int().min(0).max(PAGE_SIZE),
  expired: z.int().min(0).max(PAGE_SIZE),
  archived: z.int().min(0).max(PAGE_SIZE),
  nextCursor: z.string().min(1).max(2000).optional(),
}).refine(page => page.expired <= page.processed && page.archived <= page.processed);

export interface ListingMaintenanceStatus {
  readonly phase: 'idle' | 'running' | 'pending' | 'complete' | 'failed' | 'stopped';
  /** Confirmed counts accumulated across the current full scan, including previous passes. */
  readonly processed: number;
  readonly expired: number;
  readonly archived: number;
  readonly pages: number;
  readonly pending: boolean;
  readonly nextCursor?: string;
}
interface ListingMaintenancePorts {
  /** Must dispatch through the current vault's owner-authorized command bus. */
  command(name: 'bazaar.listing.sweep', input: { readonly limit: number; readonly cursor?: string }): Promise<unknown>;
  isActive(): boolean;
  onStatus(status: ListingMaintenanceStatus): void;
  /** Monotonic milliseconds; lifecycle deadlines themselves are evaluated by the domain clock. */
  readonly now?: () => number;
}

/** Bounded local maintenance. Signed withdrawals stay stored; this never downloads or sends them. */
export function createListingMaintenance(ports: ListingMaintenancePorts) {
  const now = ports.now ?? (() => performance.now());
  let disposed = false;
  let inFlight: Promise<ListingMaintenanceStatus> | undefined;
  let completedAt: number | undefined;
  let cycleStarted = false;
  let cursor: string | undefined;
  const cursors = new Set<string>();
  let counts = { processed: 0, expired: 0, archived: 0, pages: 0 };
  let status: ListingMaintenanceStatus = Object.freeze({ phase: 'idle', ...counts, pending: true });
  const active = () => !disposed && ports.isActive();
  const stopped = (): ListingMaintenanceStatus => Object.freeze({ ...status, phase: 'stopped' });
  function publish(phase: ListingMaintenanceStatus['phase']) {
    status = Object.freeze({ phase, ...counts, pending: phase !== 'complete', ...(cursor ? { nextCursor: cursor } : {}) });
    ports.onStatus(status);
    return status;
  }
  async function pass(): Promise<ListingMaintenanceStatus> {
    if (!active()) return stopped();
    if (!cycleStarted) {
      counts = { processed: 0, expired: 0, archived: 0, pages: 0 };
      cursor = undefined; cursors.clear(); cycleStarted = true;
    }
    publish('running');
    for (let pageNo = 0; pageNo < PAGES_PER_PASS; pageNo++) {
      if (!active()) return stopped();
      try {
        const input = { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) };
        const response = await ports.command('bazaar.listing.sweep', input);
        if (!active()) return stopped();
        const page = pageSchema.parse(response);
        // A malformed/repeating cursor cannot make maintenance spin indefinitely.
        if (page.nextCursor && cursors.has(page.nextCursor)) return publish('failed');
        counts = { processed: counts.processed + page.processed, expired: counts.expired + page.expired,
          archived: counts.archived + page.archived, pages: counts.pages + 1 };
        cursor = page.nextCursor;
        if (!cursor) {
          completedAt = now(); cycleStarted = false;
          return publish('complete');
        }
        cursors.add(cursor);
      } catch {
        if (!active()) return stopped();
        // Earlier pages already committed. Keep their counts and the failed page's
        // input cursor, so the next activity resumes instead of claiming completion.
        return publish('failed');
      }
    }
    return publish('pending');
  }
  return {
    run(): Promise<ListingMaintenanceStatus> {
      if (!active()) return Promise.resolve(stopped());
      if (inFlight) return inFlight;
      const elapsed = completedAt === undefined ? undefined : now() - completedAt;
      if (!cycleStarted && elapsed !== undefined && elapsed >= 0 && elapsed < CYCLE_INTERVAL_MS) return Promise.resolve(status);
      // Defer to a microtask so synchronous status callbacks also see the running
      // promise and cannot start a second sweep.
      inFlight = Promise.resolve().then(pass).finally(() => { inFlight = undefined; });
      return inFlight;
    },
    dispose() { disposed = true; },
  };
}
