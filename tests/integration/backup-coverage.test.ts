import { expect, it } from 'vitest';
import { describeBackupCoverage, describeAttachmentCoverage, readBackupInspection } from '../../apps/pwa/src/backup-coverage.ts';
import { runForSession } from '../../apps/pwa/src/vault-session.ts';
import type { BackupCoverage, AttachmentCoverage } from '../../packages/vault/src/index.ts';

const base: BackupCoverage = { recordTypes: [{ type: 'private.note', count: 2 }], registeredRecordTypes: ['private.note'], unsupportedRecordTypes: [], recordCount: 2, typeLimitExceeded: false, recordLimitExceeded: false, excludedStores: ['blobs', 'blob_refs'] };

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
  expect(text).toContain('1 missing stored blob');
  expect(text).toContain('1 present but excluded stored blob');
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

it('retains successful record coverage if the optional attachment diagnostic rejects', async () => {
  const result = await readBackupInspection({
    backupCoverage: async () => base,
    attachmentCoverage: async () => { throw new Error('private blob:sha256-secret should not appear'); },
  });
  expect(result.records).toEqual(base);
  expect(result.attachments).toBeNull();
  const text = `${describeBackupCoverage(result.records)} ${describeAttachmentCoverage(result.attachments)}`;
  expect(text).toContain('2 saved records across 1 supported category');
  expect(text).toContain('Attachment check unavailable; counts cannot be confirmed');
  expect(text).toContain('excluded from v1 backups');
  expect(text).not.toMatch(/blob:sha256-secret|private\.note/);
});

it('keeps successful attachment inspection results exact', async () => {
  const result = await readBackupInspection({
    backupCoverage: async () => base,
    attachmentCoverage: async () => references,
  });
  expect(result).toEqual({ records: base, attachments: references });
});

it('does not downgrade a failed required read and never starts the optional diagnostic', async () => {
  let attachmentReads = 0;
  await expect(readBackupInspection({
    backupCoverage: async () => { throw new Error('Record coverage failed'); },
    attachmentCoverage: async () => { attachmentReads++; return references; },
  })).rejects.toThrow('Backup inspection unavailable; saved-record coverage could not be verified.');
  expect(attachmentReads).toBe(0);
});

it('does not expose sensitive internal required-read exceptions to the PWA error renderer', async () => {
  let received: unknown;
  try {
    await readBackupInspection({
      backupCoverage: async () => { throw new Error('sqlite tenant=private-owner blob:sha256-secret'); },
      attachmentCoverage: async () => references,
    });
  } catch (error) { received = error; }
  expect(received).toBeInstanceOf(Error);
  const message = (received as Error).message;
  expect(message).toBe('Backup inspection unavailable; saved-record coverage could not be verified.');
  expect(message).not.toMatch(/private-owner|blob:sha256-secret|sqlite/);
});

it('uses exact singular and plural attachment labels while keeping exclusion warnings', () => {
  const zero = describeAttachmentCoverage({
    ...references, referencedBlobs: 0, missingBlobs: 0,
    excludedStoredReferences: 0, holderRows: 0,
  });
  expect(zero).toContain('0 missing stored blobs');
  expect(zero).toContain('0 present but excluded stored blobs');
  const plural = describeAttachmentCoverage({
    ...references, referencedBlobs: 4, missingBlobs: 2,
    excludedStoredReferences: 2, holderRows: 4,
  });
  expect(plural).toContain('2 missing stored blobs');
  expect(plural).toContain('2 present but excluded stored blobs');
  const singular = describeAttachmentCoverage(references);
  expect(singular).toContain('1 missing stored blob,');
  expect(singular).toContain('1 present but excluded stored blob,');
  expect(singular).toContain('excluded from v1 backups');
});

it('does not publish a recovered record inspection after session replacement during an optional failure', async () => {
  const session = { id: 'owner-session' };
  let active: typeof session | undefined = session;
  let rejectAttachment: ((error: Error) => void) | undefined;
  const deferredAttachment = new Promise<AttachmentCoverage>((_resolve, reject) => {
    rejectAttachment = reject;
  });
  const pending = runForSession(session, () => active, () => readBackupInspection({
    backupCoverage: async () => base,
    attachmentCoverage: () => deferredAttachment,
  }));
  active = undefined;
  rejectAttachment?.(new Error('private blob:sha256-reference should not be shown'));
  await expect(pending).rejects.toThrow('Vault session ended');
});

it('retains valid record inspection when optional attachment counts are malformed', async () => {
  const invalidReports: readonly unknown[] = [
    undefined,
    { ...references, missingBlobs: -1 },
    { ...references, excludedStoredReferences: 2 },
    { ...references, holderRows: 1 },
    // No holder row can exist without naming a reference.
    { ...references, referencedBlobs: 0, missingBlobs: 0, excludedStoredReferences: 0, holderRows: 1 },
    { ...references, holderRows: 10001 },
    { ...references, missingBlobs: Number.NaN },
    { ...references, holderAuthorityVerified: true },
    { ...references, includedInV1Backup: true },
    { ...references, referencedBlobs: null, limitExceeded: false },
    { ...references, limitExceeded: true },
  ];
  for (const invalid of invalidReports) {
    const result = await readBackupInspection({
      backupCoverage: async () => base,
      attachmentCoverage: async () => invalid as AttachmentCoverage,
    });
    expect(result.records).toEqual(base);
    expect(result.attachments).toBeNull();
    const display = `${describeBackupCoverage(result.records)} ${describeAttachmentCoverage(result.attachments)}`;
    expect(display).toContain('Attachment check unavailable; counts cannot be confirmed');
    expect(display).toContain('Attachment bytes and references are excluded from v1 backups');
    expect(display).not.toContain('undefined');
    expect(display).not.toContain('NaN');
  }
});

it('accepts genuine empty attachment coverage with zero holders', async () => {
  const empty: AttachmentCoverage = {
    ...references, referencedBlobs: 0, missingBlobs: 0,
    excludedStoredReferences: 0, holderRows: 0,
  };
  const result = await readBackupInspection({
    backupCoverage: async () => base,
    attachmentCoverage: async () => empty,
  });
  expect(result).toEqual({ records: base, attachments: empty });
  expect(describeAttachmentCoverage(result.attachments)).toContain('0 holder rows');
});

it('preserves the explicit capped-overflow report without presenting numeric totals', async () => {
  const overflow: AttachmentCoverage = {
    ...references, referencedBlobs: null, missingBlobs: null,
    excludedStoredReferences: null, holderRows: null, limitExceeded: true,
  };
  const result = await readBackupInspection({
    backupCoverage: async () => base,
    attachmentCoverage: async () => overflow,
  });
  expect(result.records).toEqual(base);
  expect(result.attachments).toEqual(overflow);
  const display = describeAttachmentCoverage(result.attachments);
  expect(display).toContain('counts are unavailable');
  expect(display).toContain('10,000-holder limit');
  expect(display).toContain('excluded from v1 backups');
});

it('rejects malformed resolved record coverage without invoking attachment inspection', async () => {
  const invalidReports: readonly unknown[] = [
    undefined,
    { ...base, recordTypes: undefined },
    { ...base, recordTypes: [{ type: 'private.note', count: 1 }] },
    { ...base, recordTypes: [{ type: 'private.note', count: Number.NaN }] },
    { ...base, recordCount: -1 },
    { ...base, recordCount: 'tenant-private-secret' },
    { ...base, recordLimitExceeded: true },
    { ...base, unsupportedRecordTypes: ['private.note'] },
    { ...base, excludedStores: [] },
    { ...base, recordTypes: [{ type: 'private.note', count: 2 }, { type: 'private.note', count: 2 }], recordCount: 4 },
    { ...base, registeredRecordTypes: ['private.note', 'private.note'] },
    { ...base, registeredRecordTypes: [''] },
    { ...base, typeLimitExceeded: true }, // Impossible: the source only flags truncation after 256 categories.
    { ...base, typeLimitExceeded: 'false' },
  ];
  for (const invalid of invalidReports) {
    let attachmentReads = 0;
    await expect(readBackupInspection({
      backupCoverage: async () => invalid as BackupCoverage,
      attachmentCoverage: async () => { attachmentReads++; return references; },
    })).rejects.toThrow('Backup inspection unavailable; saved-record coverage could not be verified.');
    expect(attachmentReads).toBe(0);
  }
});

it('accepts coherent blocked required coverage without making an exportability claim', async () => {
  const overRecords: BackupCoverage = {
    ...base, recordTypes: [{ type: 'private.note', count: 10_001 }],
    recordCount: 10_001, recordLimitExceeded: true,
  };
  const counted = await readBackupInspection({
    backupCoverage: async () => overRecords,
    attachmentCoverage: async () => references,
  });
  expect(counted.records).toEqual(overRecords);
  expect(describeBackupCoverage(counted.records)).toContain('Backup blocked');

  // Over 256 stored types produces a lower-bound count for the 256 reported types.
  const categories = Array.from({ length: 256 }, (_, i) => ({ type: `unrecognized.${i}`, count: 1 }));
  const truncated: BackupCoverage = {
    ...base, recordTypes: categories, registeredRecordTypes: [],
    unsupportedRecordTypes: categories.map(row => row.type),
    recordCount: 256, typeLimitExceeded: true, recordLimitExceeded: false,
  };
  const result = await readBackupInspection({
    backupCoverage: async () => truncated,
    attachmentCoverage: async () => references,
  });
  expect(result.records).toEqual(truncated);
  expect(describeBackupCoverage(result.records)).toContain('too many saved record categories');
});

it('does not publish a successful required inspection after session replacement during the required read', async () => {
  const session = { id: 'owner-required-check' };
  let active: typeof session | undefined = session;
  let resolveCoverage: ((coverage: BackupCoverage) => void) | undefined;
  let attachmentReads = 0;
  const deferredCoverage = new Promise<BackupCoverage>(resolve => { resolveCoverage = resolve; });
  const pending = runForSession(session, () => active, () => readBackupInspection({
    backupCoverage: () => deferredCoverage,
    attachmentCoverage: async () => { attachmentReads++; return references; },
  }));
  active = undefined;
  resolveCoverage?.(base);
  await expect(pending).rejects.toThrow('Vault session ended');
  // This assertion is not about cancelling underlying work: only stale publication
  // is forbidden. The optional read may complete before the session guard rejects.
  expect(attachmentReads).toBeLessThanOrEqual(1);
});

it('prefers the atomic production inspection over separate potentially drifting reads', async () => {
  let legacyCalls = 0;
  let atomicCalls = 0;
  const result = await readBackupInspection({
    backupCoverage: async () => { legacyCalls++; return base; },
    attachmentCoverage: async () => { legacyCalls++; return references; },
    backupInspection: async () => { atomicCalls++; return { records: base, attachments: references }; },
  });
  expect(result).toEqual({ records: base, attachments: references });
  expect(atomicCalls).toBe(1);
  expect(legacyCalls).toBe(0);
});

it('preserves atomic record coverage when optional attachment values are malformed', async () => {
  const result = await readBackupInspection({
    backupCoverage: async () => { throw new Error('legacy path should not run'); },
    attachmentCoverage: async () => { throw new Error('legacy path should not run'); },
    backupInspection: async () => ({
      records: base, attachments: { ...references, missingBlobs: Number.NaN },
    }),
  });
  expect(result.records).toEqual(base);
  expect(result.attachments).toBeNull();
});

it('fails closed on malformed atomic required coverage and does not fall back to a stale read', async () => {
  let fallbackCalls = 0;
  await expect(readBackupInspection({
    backupCoverage: async () => { fallbackCalls++; return base; },
    attachmentCoverage: async () => { fallbackCalls++; return references; },
    backupInspection: async () => ({
      records: { ...base, recordCount: 500 }, attachments: references,
    }),
  })).rejects.toThrow('Backup inspection unavailable; saved-record coverage could not be verified.');
  expect(fallbackCalls).toBe(0);
});
