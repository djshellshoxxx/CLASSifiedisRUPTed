import { canonicalJson, type Clock, type Storage, type StoredRecord } from '../../../packages/kernel/src/index.ts';
import { retainedListingId, retainedListingRepo, validateRetainedRecord, type RetainedListing } from '../../../packages/discovery/src/index.ts';
import { verifyEnvelope } from '../../../packages/federation/src/index.ts';
import { MAX_LOCAL_MATCH_CANDIDATES, type LocalCandidateRequest } from '../../../packages/blindmatch/src/index.ts';

export interface LocalCandidateLoaderOptions {
  /** Use the current unlocked vault's storage and principal. This port does not open a vault. */
  readonly storage: Storage;
  readonly principal: string;
  readonly clock: Clock;
  readonly isCurrent: () => boolean;
}

/**
 * Authenticate a bounded snapshot of already-retained public evidence. Private criteria,
 * intent IDs and network ports are deliberately absent. The row cap bounds admission and
 * signature work, not the storage adapter's underlying snapshot/decryption cost.
 */
export function createLocalCandidateLoader(options: LocalCandidateLoaderOptions):
  (request: LocalCandidateRequest) => Promise<readonly RetainedListing[]> {
  const { storage, principal, clock, isCurrent } = options;
  const unavailable = () => new Error('Local candidates unavailable');

  return async request => {
    function guard(): void {
      if (request?.limit !== MAX_LOCAL_MATCH_CANDIDATES || !(request.signal instanceof AbortSignal)
        || request.signal.aborted || isCurrent() !== true) throw unavailable();
    }

    function now(): number {
      const value = clock.now();
      if (!Number.isSafeInteger(value) || value < 0 || value > 8_640_000_000_000_000) throw unavailable();
      return value;
    }

    async function readSnapshot(): Promise<readonly StoredRecord<RetainedListing>[]> {
      guard();
      const rows = await storage.read(tx => {
        guard();
        const found = tx.records.query<RetainedListing>({ tenant: principal, type: retainedListingRepo.type,
          filters: [], orderSlot: 0, dir: 'asc', limit: MAX_LOCAL_MATCH_CANDIDATES + 1 });
        if (found.length > MAX_LOCAL_MATCH_CANDIDATES) throw unavailable();
        const ids = new Set<string>();
        const checked = found.map(row => {
          const data = retainedListingRepo.schema.parse(row.data);
          if (row.tenantId !== principal || row.type !== retainedListingRepo.type
            || row.id !== retainedListingId(data.ownerId, data.listingId)
            || !Number.isSafeInteger(row.revision) || row.revision < 1 || ids.has(row.id)) throw unavailable();
          ids.add(row.id);
          return { ...row, data };
        });
        guard();
        return checked;
      });
      guard();
      return rows;
    }

    try {
      guard();
      const at = now();
      const snapshot = await readSnapshot();
      for (const row of snapshot) {
        guard();
        await validateRetainedRecord(row.data, input => verifyEnvelope(input, { now: at }));
        guard();
      }
      // Signature verification yields. Refuse results if a withdrawal, fork, revision,
      // deletion or newly retained record changed the bounded snapshot in the meantime.
      const current = await readSnapshot();
      if (canonicalJson(current) !== canonicalJson(snapshot)) throw unavailable();
      now();
      guard();
      return snapshot.map(row => row.data);
    } catch {
      // Neither signed metadata nor adapter diagnostics escape into the private view.
      throw unavailable();
    }
  };
}
