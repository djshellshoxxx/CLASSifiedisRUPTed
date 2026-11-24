import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createMemoryStorage, defineRepo, ok, sha256Hex, type Storage, z } from '../../packages/kernel/src/index.ts';
import { seal, type Sealed } from '../../packages/identity/src/index.ts';
import { signEnvelope, strictCanonicalJson } from '../../packages/federation/src/index.ts';
import { backupCodec, vaultFromStorage, type UnlockedVault } from '../../packages/vault/src/vault.ts';
import { verifySealedAttachmentManifest } from '../../packages/vault/src/attachment-manifest.ts';
import { ZERO_REF_TRANSITION_TYPE, type AttachmentZeroRefTransition } from '../../packages/vault/src/attachment-transition.ts';

const password = 'attachment-transition-evidence-passphrase';
const date = Date.parse('2026-11-23T00:00:00.000Z');
const repo = defineRepo({ type: 'test.attachment_zero_ref_transition',
  schema: z.strictObject({ id: z.string(), refs: z.array(z.string()), title: z.string().optional() }), indexes: {} });
const codec = { ...backupCodec(repo), recordId: (data: unknown) => repo.schema.parse(data).id,
  attachmentRefs: (data: unknown) => repo.schema.parse(data).refs };
const emptyParent = { id: 'parent', refs: [] };
const dataCid = async (data: unknown) => 'sha256-' + await sha256Hex(strictCanonicalJson(data));

async function putParent(session: UnlockedVault, data: z.infer<typeof repo.schema>, expectedRevision: number) {
  const saved = await session.storage.transaction(tx => tx.records.put({
    tenant: session.principal, type: repo.type, id: data.id, data, idx: [null, null, null, null],
    expectedRevision, now: date + expectedRevision,
  }));
  if (!saved.ok) throw new Error('Could not write transition fixture parent');
}

async function retainBlob(session: UnlockedVault) {
  const stored = await session.storage.transaction(async tx => {
    const blob = await tx.blobs.put({ tenant: session.principal, bytes: Uint8Array.of(11, 13, 17),
      privacy: 'P0', encrypted: false, contentType: 'image/png', now: date });
    if (!blob.ok) return blob;
    const retained = tx.blobs.attach(session.principal, blob.value.ref, 'retained-holder');
    if (!retained.ok) return retained;
    return ok(blob.value.ref);
  });
  if (!stored.ok) throw new Error('Could not retain transition fixture blob');
  return stored.value;
}

async function assertion(signer: UnlockedVault, payload: unknown) {
  const envelope = await signEnvelope(signer.identity, { type: ZERO_REF_TRANSITION_TYPE,
    createdAt: new Date().toISOString(), seq: 1, prev: null, payload });
  return seal(new TextEncoder().encode(JSON.stringify(envelope)), password);
}

describe('authenticated zero-reference transition evidence', () => {
  let archive: Sealed;
  let prior: Sealed;
  let proof: Sealed;
  let payload: AttachmentZeroRefTransition;
  let destination: UnlockedVault;
  let readActiveAtValidation: boolean[];

  beforeAll(async () => {
    const source = await vaultFromStorage(createMemoryStorage(), [codec]).create(password);
    try {
      const ref = await retainBlob(source);
      await putParent(source, { id: 'parent', refs: [ref] }, 0);
      archive = await source.exportBackup(password);
      prior = await source.exportAttachmentManifest(password);
      const manifest = await verifySealedAttachmentManifest(prior, password, source.principal);
      const parent = manifest.parents[0]!;
      await putParent(source, emptyParent, 1);
      payload = { principal: source.principal, type: repo.type, id: parent.id, ref,
        priorRevision: parent.revision, priorDataCid: parent.dataCid, currentRevision: 2,
        currentDataCid: await dataCid(emptyParent) };
      proof = await assertion(source, payload);
    } finally { await source.lock(); }
  }, 30000);

  beforeEach(async () => {
    const memory = createMemoryStorage();
    let reading = false;
    const storage: Storage = { ...memory, async read(fn) {
      reading = true;
      try { return await memory.read(fn); } finally { reading = false; }
    } };
    readActiveAtValidation = [];
    const observedCodec = { ...codec, async validate() { readActiveAtValidation.push(reading); } };
    destination = await vaultFromStorage(storage, [observedCodec]).restoreBackup(archive, password);
    expect(await retainBlob(destination)).toBe(payload.ref);
    readActiveAtValidation.length = 0;
  }, 30000);

  afterEach(async () => { await destination?.lock(); });

  const snapshot = () => destination.storage.read(tx => ({
    record: tx.records.get(destination.principal, repo.type, 'parent'),
    blob: tx.blobs.get(destination.principal, payload.ref),
    coverage: tx.blobs.referenceCoverage(destination.principal),
  }));
  const verify = (sealed: Sealed) => destination.verifyAttachmentZeroRefTransition(prior, sealed, password);

  it('accepts repeated verification on a recovered record and releases the read before codec validation', async () => {
    await putParent(destination, emptyParent, 1);
    const before = await snapshot();
    expect(before.blob?.holders).toBe(1);
    expect(await verify(proof)).toEqual(payload);
    expect(await verify(proof)).toEqual(payload);
    expect(readActiveAtValidation.length).toBeGreaterThanOrEqual(2);
    expect(readActiveAtValidation).not.toContain(true);
    expect(await snapshot()).toEqual(before);
  }, 30000);

  it('issues a verifiable owner assertion from the actual zero-reference record without writing', async () => {
    await putParent(destination, emptyParent, 1);
    const before = await snapshot();
    const owner = { type: repo.type, id: 'parent', ref: payload.ref };
    const sealed = await destination.exportAttachmentZeroRefTransition(prior, password, owner);
    expect(await verify(sealed)).toEqual(payload);
    expect(await snapshot()).toEqual(before);
  }, 30000);

  it('does not issue an assertion while the signed prior parent still owns the attachment', async () => {
    const before = await snapshot();
    const owner = { type: repo.type, id: 'parent', ref: payload.ref };
    await expect(destination.exportAttachmentZeroRefTransition(prior, password, owner))
      .rejects.toThrow(/current record mismatch/);
    expect(await snapshot()).toEqual(before);
  }, 30000);

  it('rejects issuance for a parent absent from the authenticated prior manifest', async () => {
    await putParent(destination, emptyParent, 1);
    const before = await snapshot();
    await expect(destination.exportAttachmentZeroRefTransition(prior, password,
      { type: repo.type, id: 'absent', ref: payload.ref })).rejects.toThrow(/prior evidence mismatch/);
    expect(await snapshot()).toEqual(before);
  }, 30000);

  it('rejects an incorrect issuance passphrase without changing the recovered record or retained bytes', async () => {
    await putParent(destination, emptyParent, 1);
    const before = await snapshot();
    const owner = { type: repo.type, id: 'parent', ref: payload.ref };
    await expect(destination.exportAttachmentZeroRefTransition(prior, password + '-incorrect', owner))
      .rejects.toThrow();
    expect(await snapshot()).toEqual(before);
    const issued = await destination.exportAttachmentZeroRefTransition(prior, password, owner);
    expect(await verify(issued)).toEqual(payload);
    expect(await snapshot()).toEqual(before);
  }, 30000);

  it('requires the prior manifest to belong to the unlocked identity even for matching public bytes', async () => {
    await putParent(destination, emptyParent, 1);
    const other = await vaultFromStorage(createMemoryStorage(), [codec]).create(password);
    try {
      expect(other.principal).not.toBe(destination.principal);
      const ref = await retainBlob(other);
      expect(ref).toBe(payload.ref);
      await putParent(other, { id: 'parent', refs: [ref] }, 0);
      const foreignPrior = await other.exportAttachmentManifest(password);
      const before = await snapshot();
      const owner = { type: repo.type, id: 'parent', ref };
      await expect(destination.exportAttachmentZeroRefTransition(foreignPrior, password, owner))
        .rejects.toThrow(/Unauthorized author/);
      expect(await snapshot()).toEqual(before);
      const issued = await destination.exportAttachmentZeroRefTransition(prior, password, owner);
      expect(await verify(issued)).toEqual(payload);
      expect(await snapshot()).toEqual(before);
    } finally { await other.lock(); }
  }, 30000);

  it.each([
    ['different prior digest', { priorDataCid: 'sha256-' + '0'.repeat(64) }, /prior evidence mismatch/],
    ['nonconsecutive revision', { currentRevision: 3 }, /transition fields/],
    ['different current digest', { currentDataCid: 'sha256-' + '1'.repeat(64) }, /current record mismatch/],
    ['extra field', { unrecognized: true }, /transition structure/],
  ] as const)('rejects a signed assertion with a %s', async (_name, change, error) => {
    await putParent(destination, emptyParent, 1);
    const before = await snapshot();
    await expect(verify(await assertion(destination, { ...payload, ...change }))).rejects.toThrow(error);
    expect(await snapshot()).toEqual(before);
  }, 30000);

  it('rejects a manifest supplied in place of the transition assertion', async () => {
    await putParent(destination, emptyParent, 1);
    const before = await snapshot();
    await expect(verify(prior)).rejects.toThrow(/Wrong statement type/);
    expect(await snapshot()).toEqual(before);
  }, 30000);

  it('rejects an assertion signed by another vault using the same passphrase', async () => {
    await putParent(destination, emptyParent, 1);
    const other = await vaultFromStorage(createMemoryStorage(), [codec]).create(password);
    try {
      expect(other.principal).not.toBe(destination.principal);
      const before = await snapshot();
      await expect(verify(await assertion(other, payload))).rejects.toThrow(/Unauthorized author/);
      expect(await snapshot()).toEqual(before);
    } finally { await other.lock(); }
  }, 30000);

  it('rejects a matching revision and digest if the current record still references the blob', async () => {
    const edited = { id: 'parent', refs: [payload.ref], title: 'Edited with attachment retained' };
    await putParent(destination, edited, 1);
    const before = await snapshot();
    expect(before.record?.revision).toBe(payload.currentRevision);
    const currentDataCid = await dataCid(edited);
    expect(currentDataCid).not.toBe(payload.priorDataCid);
    await expect(verify(await assertion(destination, { ...payload, currentDataCid })))
      .rejects.toThrow(/zero current references/);
    expect(await snapshot()).toEqual(before);
  }, 30000);

  it('rejects an earlier assertion after the attachment is restored at the next revision', async () => {
    await putParent(destination, emptyParent, 1);
    await putParent(destination, { id: 'parent', refs: [payload.ref] }, 2);
    const before = await snapshot();
    expect(before.record?.revision).toBe(3);
    await expect(verify(proof)).rejects.toThrow(/current record mismatch/);
    expect(await snapshot()).toEqual(before);
  }, 30000);
});
