import type { BackupCoverage, AttachmentCoverage } from '../../../packages/vault/src/index.ts';

/** A failed attachment diagnostic must not discard a valid record-coverage result. */
export async function readBackupInspection(source: {
  backupCoverage(): Promise<BackupCoverage>;
  attachmentCoverage(): Promise<AttachmentCoverage>;
}): Promise<{ readonly records: BackupCoverage; readonly attachments: AttachmentCoverage | null }> {
  const records = await source.backupCoverage();
  try {
    return { records, attachments: await source.attachmentCoverage() };
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
  const holders = coverage.holderRows === 1 ? 'holder row' : 'holder rows';
  return `Attachment check: ${coverage.referencedBlobs} held ${refs}, ${coverage.missingBlobs} missing stored blobs, ${coverage.excludedStoredReferences} present but excluded stored blobs, and ${coverage.holderRows} ${holders}. ${exclusion}`;
}
