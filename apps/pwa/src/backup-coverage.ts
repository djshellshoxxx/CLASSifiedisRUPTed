import type { BackupCoverage, AttachmentCoverage } from '../../../packages/vault/src/index.ts';

/**
 * These are diagnostic counts, not authenticated attachment evidence. Reject
 * malformed results rather than displaying partial, negative, or impossible
 * totals as if the optional read succeeded. The storage contract caps holder
 * rows at 10,000 and returns null totals on overflow.
 */
function isCoherentAttachmentCoverage(input: unknown): input is AttachmentCoverage {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return false;
  const report = input as Partial<AttachmentCoverage>;
  if (report.holderAuthorityVerified !== false || report.includedInV1Backup !== false ||
      typeof report.limitExceeded !== 'boolean') return false;
  const { referencedBlobs: refs, missingBlobs: missing,
    excludedStoredReferences: present, holderRows: holders } = report;
  if (report.limitExceeded) {
    return refs === null && missing === null && present === null && holders === null;
  }
  const validCount = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 10_000;
  return validCount(refs) && validCount(missing) && validCount(present) && validCount(holders) &&
    missing + present === refs && holders >= refs;
}

/** A failed attachment diagnostic must not discard a valid record-coverage result. */
export async function readBackupInspection(source: {
  backupCoverage(): Promise<BackupCoverage>;
  attachmentCoverage(): Promise<AttachmentCoverage>;
}): Promise<{ readonly records: BackupCoverage; readonly attachments: AttachmentCoverage | null }> {
  let records: BackupCoverage;
  try {
    records = await source.backupCoverage();
  } catch {
    // The PWA reports thrown errors verbatim. Keep database or crypto details out of the DOM.
    // A failed required read still rejects; it never creates a successful coverage report.
    throw new Error('Backup inspection unavailable; saved-record coverage could not be verified.');
  }
  try {
    const attachments = await source.attachmentCoverage();
    return { records, attachments: isCoherentAttachmentCoverage(attachments) ? attachments : null };
  } catch {
    // No error details or stale counts enter the inspection display.
    return { records, attachments: null };
  }
}

/** Coverage contains counts and type identifiers only; never render record payloads. */
export function describeBackupCoverage(coverage: BackupCoverage): string {
  if (coverage.typeLimitExceeded) return 'Backup blocked: too many saved record categories. Open a compatible application version before exporting.';
  if (coverage.unsupportedRecordTypes.length) return 'Backup blocked: some saved records belong to unsupported features. Open a compatible application version before exporting; those records will not be silently omitted.';
  if (coverage.recordLimitExceeded) return 'Backup blocked: more than 10,000 saved records. Complete recovery for larger vaults is not available in this alpha.';
  const records = coverage.recordCount === 1 ? 'record' : 'records';
  const categories = coverage.recordTypes.length === 1 ? 'category' : 'categories';
  return `At last check: ${coverage.recordCount} saved ${records} across ${coverage.recordTypes.length} supported ${categories}. Coverage is checked again during export. Record validation and the encrypted file size limit still apply.`;
}

/**
 * Holder coverage is diagnostic only. V1 does not include blob bytes or holder
 * relationships, even when every counted holder has a stored blob row.
 */
export function describeAttachmentCoverage(coverage: AttachmentCoverage | null): string {
  const exclusion = 'Attachment bytes and references are excluded from v1 backups. Holder labels are not authenticated and unheld blobs are not inventoried.';
  if (coverage === null) return `Attachment check unavailable; counts cannot be confirmed. ${exclusion}`;
  if (coverage.limitExceeded || coverage.referencedBlobs === null || coverage.missingBlobs === null ||
      coverage.excludedStoredReferences === null || coverage.holderRows === null) {
    return `Attachment check exceeded its 10,000-holder limit; counts are unavailable. ${exclusion}`;
  }
  const refs = coverage.referencedBlobs === 1 ? 'reference' : 'references';
  const missing = coverage.missingBlobs === 1 ? 'missing stored blob' : 'missing stored blobs';
  const excluded = coverage.excludedStoredReferences === 1 ? 'present but excluded stored blob' : 'present but excluded stored blobs';
  const holders = coverage.holderRows === 1 ? 'holder row' : 'holder rows';
  return `Attachment check: ${coverage.referencedBlobs} held ${refs}, ${coverage.missingBlobs} ${missing}, ${coverage.excludedStoredReferences} ${excluded}, and ${coverage.holderRows} ${holders}. ${exclusion}`;
}
