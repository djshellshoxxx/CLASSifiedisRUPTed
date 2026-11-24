import { describe, expect, it } from 'vitest';
import { createMemoryStorage, defineRepo, ok, sha256Hex, z } from '../../packages/kernel/src/index.ts';
import { seal } from '../../packages/identity/src/index.ts';
import { signEnvelope, strictCanonicalJson } from '../../packages/federation/src/index.ts';
import { backupCodec, vaultFromStorage } from '../../packages/vault/src/vault.ts';
import { verifySealedAttachmentManifest } from '../../packages/vault/src/attachment-manifest.ts';
import { ZERO_REF_TRANSITION_TYPE } from '../../packages/vault/src/attachment-transition.ts';

const password = 'attachment-transition-evidence-passphrase';
const date = Date.parse('2026-11-23T00:00:00.000Z');
const repo = defineRepo({ type: 'test.attachment_zero_ref_transition',
  schema: z.strictObject({ id: z.string(), refs: z.array(z.string()) }), indexes: {} });
const codec = { ...backupCodec(repo), recordId: (data: unknown) => repo.schema.parse(data).id,
  attachmentRefs: (data: unknown) => repo.schema.parse(data).refs };

describe('authenticated zero-reference transition evidence', () => {
  it('binds the signed prior manifest and current canonical record without changing holders', async () => {
    const source = await vaultFromStorage(createMemoryStorage(), [codec]).create(password);
    try {
      const created = await source.storage.transaction(async tx => {
        const blob = await tx.blobs.put({ tenant: source.principal, bytes: Uint8Array.of(11, 13, 17),
          privacy: 'P0', encrypted: false, contentType: 'image/png', now: date });
        if (!blob.ok) return blob;
        const record = tx.records.put({ tenant: source.principal, type: repo.type, id: 'parent',
          data: { id: 'parent', refs: [blob.value.ref] }, idx: [null, null, null, null],
          expectedRevision: 0, now: date });
        if (!record.ok) return record;
        const attached = tx.blobs.attach(source.principal, blob.value.ref, 'retained-holder');
        if (!attached.ok) return attached;
        return ok(blob.value.ref);
      });
      if (!created.ok) throw new Error('transition fixture failed');
      const ref = created.value;
      const prior = await source.exportAttachmentManifest(password);
      const authenticated = await verifySealedAttachmentManifest(prior, password, source.principal);
      const old = authenticated.parents[0]!;
      const currentData = { id: 'parent', refs: [] };
      const updated = await source.storage.transaction(tx => tx.records.put({
        tenant: source.principal, type: repo.type, id: 'parent', data: currentData,
        idx: [null, null, null, null], expectedRevision: 1, now: date + 1,
      }));
      expect(updated.ok).toBe(true);
      const payload = { principal: source.principal, type: repo.type, id: 'parent', ref,
        priorRevision: old.revision, priorDataCid: old.dataCid, currentRevision: 2,
        currentDataCid: `sha256-${await sha256Hex(strictCanonicalJson(currentData))}` };
      const assertion = async (data: unknown) => {
        const envelope = await signEnvelope(source.identity, { type: ZERO_REF_TRANSITION_TYPE,
          createdAt: new Date().toISOString(), seq: 1, prev: null, payload: data });
        return seal(new TextEncoder().encode(JSON.stringify(envelope)), password);
      };
      const proof = await assertion(payload);
      const snapshot = () => source.storage.read(tx => ({
        record: tx.records.get(source.principal, repo.type, 'parent'),
        blob: tx.blobs.get(source.principal, ref),
        coverage: tx.blobs.referenceCoverage(source.principal),
      }));
      const before = await snapshot();
      expect(before.blob?.holders).toBe(1);
      expect(await source.verifyAttachmentZeroRefTransition(prior, proof, password)).toEqual(payload);
      // Verification is read-only and repeatable, NOT replay-safe authorization.
      expect(await source.verifyAttachmentZeroRefTransition(prior, proof, password)).toEqual(payload);
      await expect(source.verifyAttachmentZeroRefTransition(prior,
        await assertion({ ...payload, priorDataCid: 'sha256-' + '0'.repeat(64) }), password))
        .rejects.toThrow(/prior evidence mismatch/);
      await expect(source.verifyAttachmentZeroRefTransition(prior,
        await assertion({ ...payload, currentRevision: 3 }), password))
        .rejects.toThrow(/transition fields/);
      await expect(source.verifyAttachmentZeroRefTransition(prior,
        await assertion({ ...payload, currentDataCid: 'sha256-' + '1'.repeat(64) }), password))
        .rejects.toThrow(/current record mismatch/);
      await expect(source.verifyAttachmentZeroRefTransition(prior, prior, password))
        .rejects.toThrow(/Wrong statement type/);
      expect(await snapshot()).toEqual(before);
      const restored = await source.storage.transaction(tx => tx.records.put({
        tenant: source.principal, type: repo.type, id: 'parent', data: { id: 'parent', refs: [ref] },
        idx: [null, null, null, null], expectedRevision: 2, now: date + 2,
      }));
      expect(restored.ok).toBe(true);
      const after = await snapshot();
      await expect(source.verifyAttachmentZeroRefTransition(prior, proof, password))
        .rejects.toThrow(/current record mismatch/);
      expect(await snapshot()).toEqual(after);
    } finally { await source.lock(); }
  }, 30000);
});
