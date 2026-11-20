import { expect, it } from 'vitest';
import { describeBackupCoverage } from '../../apps/pwa/src/backup-coverage.ts';
import type { BackupCoverage } from '../../packages/vault/src/index.ts';

const base: BackupCoverage = { recordTypes: [{ type: 'private.note', count: 2 }], registeredRecordTypes: ['private.note'], unsupportedRecordTypes: [], recordCount: 2, typeLimitExceeded: false, recordLimitExceeded: false, excludedStores: ['blobs'] };

it('describes snapshot coverage without echoing private or untrusted type identifiers', () => {
  const text = describeBackupCoverage(base);
  expect(text).toContain('2 saved records across 1 supported category');
  expect(text).toContain('checked again during export');
  expect(text).not.toContain('private.note');
  const blocked = describeBackupCoverage({ ...base, unsupportedRecordTypes: ['<script>secret</script>'] });
  expect(blocked).toContain('Backup blocked');
  expect(blocked).toContain('not be silently omitted');
  expect(blocked).not.toMatch(/script|secret/);
});

it('does not describe truncated or over-limit coverage as an exportable count', () => {
  expect(describeBackupCoverage({ ...base, typeLimitExceeded: true })).toContain('too many saved record categories');
  expect(describeBackupCoverage({ ...base, recordCount: 10001, recordLimitExceeded: true })).toContain('more than 10,000');
  expect(describeBackupCoverage({ ...base, typeLimitExceeded: true })).not.toContain('2 saved records');
});
