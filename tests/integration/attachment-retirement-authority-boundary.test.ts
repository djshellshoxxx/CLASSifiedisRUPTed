import { describe, expect, it } from 'vitest';
import { createMemoryStorage, defineRepo, ok, readVerifiedBlobBatch, z } from '../../packages/kernel/src/index.ts';
import { backupCodec, vaultFromStorage } from '../../packages/vault/src/vault.ts';
import { verifySealedAttachmentManifest } from '../../packages/vault/src/attachment-manifest.ts';

const password = 'attachment-retirement-boundary-test-passphrase';
const date = Date.parse('2026-11-23T00:00:00.000Z');
const repo = defineRepo({ type: 'test.attachment_retirement_boundary',
  schema: z.strictObject({ id: z.string(), refs: z.array(z.string()) }), indexes: {} });
const codec = { ...backupCodec(repo),
  recordId: (data: unknown) => repo.schema.parse(data).id,
  attachmentRefs: (data: unknown) => repo.schema.parse(data).refs };
const holder = (id: string) => 'classrup.attachment_owner/v1:' + JSON.stringify([repo.type, id]);

describe('authenticated attachment retirement boundaries', () => {
  it('does not infer deletion authority from missing parents, empty refs or absence from the manifest', async () => {
    const source = await vaultFromStorage(createMemoryStorage(), [codec]).create(password);
    try {
      // Model an actual removed parent and a current parent with no refs,
      // not merely a forged ID in the retirement request.
      const seed = await source.storage.transaction(async tx => {
        const kept = await tx.blobs.put({ tenant: source.principal, bytes: Uint8Array.of(1, 3, 5),
          contentType: 'image/png', privacy: 'P0', encrypted: false, now: date });
        if (!kept.ok) return kept;
        for (const id of ['current', 'removed', 'empty']) {
          const row = tx.records.put({ tenant: source.principal, type: repo.type, id,
            data: { id, refs: id === 'empty' ? [] : [kept.value.ref] },
            idx: [null, null, null, null], expectedRevision: 0, now: date });
          if (!row.ok) return row;
        }
        const removed = tx.records.remove(source.principal, repo.type, 'removed', 1);
        if (!removed.ok) return removed;
        return ok(kept.value.ref);
      });
      if (!seed.ok) throw new Error('source fixture failed');
      const keptRef = seed.value;
      const archive = await source.exportBackup(password);
      const sealed = await source.exportAttachmentManifest(password);
      const manifest = await verifySealedAttachmentManifest(sealed, password, source.principal);
      expect(manifest.parents.map(parent => parent.id)).toEqual(['current']);
      const bytes = (await readVerifiedBlobBatch(source.storage, source.principal, [keptRef]))
        .map(blob => new Uint8Array(blob.bytes));
      const dest = await vaultFromStorage(createMemoryStorage(), [codec]).restoreBackup(archive, password);
      try {
        const staged = await dest.storage.transaction(async tx => {
          expect(tx.records.get(dest.principal, repo.type, 'removed')).toBeUndefined();
          expect(tx.records.get(dest.principal, repo.type, 'empty')?.data).toEqual({ id: 'empty', refs: [] });
          const kept = await tx.blobs.put({ tenant: dest.principal, bytes: Uint8Array.of(1, 3, 5),
            contentType: 'image/png', privacy: 'P0', encrypted: false, now: date });
          if (!kept.ok) return kept;
          const orphaned = await tx.blobs.put({ tenant: dest.principal, bytes: Uint8Array.of(2, 4, 6),
            contentType: 'image/png', privacy: 'P0', encrypted: false, now: date });
          if (!orphaned.ok) return orphaned;
          for (const id of ['removed', 'empty', 'external-retention']) {
            const attached = tx.blobs.attach(dest.principal, keptRef,
              id === 'external-retention' ? id : holder(id));
            if (!attached.ok) return attached;
          }
          const last = tx.blobs.attach(dest.principal, orphaned.value.ref, holder('current'));
          if (!last.ok) return last;
          return ok(orphaned.value.ref);
        });
        if (!staged.ok) throw new Error('destination fixture failed');
        const finalRef = staged.value;
        expect(manifest.blobs.map(blob => blob.ref)).toEqual([keptRef]);
        const snapshot = () => dest.storage.read(tx => ({
          kept: tx.blobs.get(dest.principal, keptRef),
          last: tx.blobs.get(dest.principal, finalRef),
          coverage: tx.blobs.referenceCoverage(dest.principal),
        }));
        const before = await snapshot();
        expect(before.kept?.holders).toBe(3);
        expect(before.last?.holders).toBe(1);
        for (const retirement of [
          { type: repo.type, id: 'removed', ref: keptRef },
          { type: repo.type, id: 'empty', ref: keptRef },
          { type: repo.type, id: 'current', ref: finalRef },
        ]) {
          await expect(dest.importPublicAttachmentBatch(sealed, password, bytes, retirement))
            .rejects.toThrow(/retirement not authorized/);
          expect(await snapshot()).toEqual(before);
        }

        // Positive control: the valid signed manifest is importable. It adds
        // the current canonical holder, but must not implicitly purge omitted
        // holder labels or a last-held blob.
        await dest.importPublicAttachmentBatch(sealed, password, bytes);
        const after = await snapshot();
        expect(after.kept?.bytes).toEqual(Uint8Array.of(1, 3, 5));
        expect(after.kept?.holders).toBe(4);
        expect(after.last).toEqual(before.last);
        expect(after.coverage).toMatchObject({ referenceCount: 2, holderCount: 5, missingCount: 0 });
        const observed = new Error('holder identity observation rollback');
        await expect(dest.storage.transaction(tx => {
          for (const label of [holder('current'), holder('removed'), holder('empty'), 'external-retention']) {
            const attached = tx.blobs.attach(dest.principal, keptRef, label);
            if (!attached.ok) throw new Error('retained holder probe failed');
            expect(attached.value.holders).toBe(4);
          }
          const last = tx.blobs.attach(dest.principal, finalRef, holder('current'));
          if (!last.ok) throw new Error('last holder probe failed');
          expect(last.value.holders).toBe(1);
          throw observed;
        })).rejects.toBe(observed);
        expect(await snapshot()).toEqual(after);
      } finally { await dest.lock(); }
    } finally { await source.lock(); }
  }, 30000);
});
