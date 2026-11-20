import type { BackupCoverage } from '../../../packages/vault/src/index.ts';

/** Coverage contains counts and type identifiers only; never render record payloads. */
export function describeBackupCoverage(coverage: BackupCoverage): string {
  if (coverage.typeLimitExceeded) return 'Backup blocked: too many saved record categories. Open a compatible application version before exporting.';
  if (coverage.unsupportedRecordTypes.length) return 'Backup blocked: some saved records belong to unsupported features. Open a compatible application version before exporting; those records will not be silently omitted.';
  if (coverage.recordLimitExceeded) return 'Backup blocked: more than 10,000 saved records. Complete recovery for larger vaults is not available in this alpha.';
  const records = coverage.recordCount === 1 ? 'record' : 'records';
  const categories = coverage.recordTypes.length === 1 ? 'category' : 'categories';
  return `At last check: ${coverage.recordCount} saved ${records} across ${coverage.recordTypes.length} supported ${categories}. Coverage is checked again during export. Record validation and the encrypted file size limit still apply.`;
}
