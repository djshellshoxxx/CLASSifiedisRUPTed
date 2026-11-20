import { expect, it } from 'vitest';
import { describeBackupCoverage, describeAttachmentCoverage } from '../../apps/pwa/src/backup-coverage.ts';
import type { BackupCoverage, AttachmentCoverage } from '../../packages/vault/src/index.ts';

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

const references: AttachmentCoverage = {
  referencedBlobs: 2, missingBlobs: 1, excludedStoredReferences: 1,
  holderRows: 3, limitExceeded: false, holderAuthorityVerified: false,
  includedInV1Backup: false,
};

it('reports held attachment exclusions without promising complete backup or revealing identifiers', () => {
  const text = describeAttachmentCoverage(references);
  expect(text).toContain('2 held references');
  expect(text).toContain('1 missing stored blobs');
  expect(text).toContain('1 present but excluded stored blobs');
  expect(text).toContain('3 holder rows');
  expect(text).toContain('excluded from v1 backups');
  expect(text).toContain('Holder labels are not authenticated');
  expect(text).toContain('unheld blobs are not inventoried');
  expect(text).not.toMatch(/blob:sha256-|principal|filename|listing\//);
});

it('does not describe overflowing attachment coverage as an exact count', () => {
  const text = describeAttachmentCoverage({
    ...references, referencedBlobs: null, missingBlobs: null,
    excludedStoredReferences: null, holderRows: null, limitExceeded: true,
  });
  expect(text).toContain('counts are unavailable');
  expect(text).toContain('10,000-holder limit');
  expect(text).toContain('excluded from v1 backups');
  expect(text).not.toContain('2 held references');
});

it('does not mistake zero holder references for a complete attachment inventory', () => {
  const text = describeAttachmentCoverage({
    ...references, referencedBlobs: 0, missingBlobs: 0,
    excludedStoredReferences: 0, holderRows: 0,
  });
  expect(text).toContain('0 held references');
  expect(text).toContain('unheld blobs are not inventoried');
  expect(text).toContain('excluded from v1 backups');
});
