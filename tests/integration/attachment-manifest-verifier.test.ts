import { describe, expect, it } from 'vitest';
import { createIdentity, seal } from '../../packages/identity/src/index.ts';
import { signEnvelope } from '../../packages/federation/src/index.ts';
import {
  validateAttachmentManifestPayload, verifySealedAttachmentManifest,
} from '../../packages/vault/src/attachment-manifest.ts';

const passphrase = 'attachment manifest receiver verification test phrase';
const stamp = '2026-11-23T00:00:00.000Z';
const ref = 'blob:sha256-' + 'A'.repeat(43);
const cid = 'sha256-' + 'a'.repeat(64);
const principal = 'trusted-destination-principal';
const payload = {
  principal,
  parents: [{ type: 'test.owned_attachment', id: 'image-1', revision: 1, dataCid: cid, refs: [ref] }],
  blobs: [{ ref, size: 3, contentType: 'image/png', privacy: 'P0', encrypted: false, createdAt: stamp }],
};

describe('attachment manifest receiver boundary', () => {
  it('admits only bounded, exact, sorted parent and reference metadata', () => {
    const valid = validateAttachmentManifestPayload(payload, principal);
    expect(valid).toMatchObject({ principal, links: 1, totalBytes: 3 });
    expect(valid.parents).toHaveLength(1);
    expect(valid.blobs).toHaveLength(1);
    expect(Object.isFrozen(valid.parents[0])).toBe(true);
    expect(() => validateAttachmentManifestPayload(payload, 'different-principal')).toThrow();
    const rejects = (change: (candidate: any) => void) => {
      const candidate = structuredClone(payload);
      change(candidate);
      expect(() => validateAttachmentManifestPayload(candidate, principal)).toThrow();
    };
    rejects(p => { p.extra = 'unrecognized'; });
    rejects(p => { p.parents[0].revision = 0; });
    rejects(p => { p.parents[0].dataCid = 'sha256-ABC'; });
    rejects(p => { p.parents.push(structuredClone(p.parents[0])); });
    rejects(p => { p.parents[0].refs.push(ref); });
    rejects(p => { p.parents[0].refs = []; });
    rejects(p => { p.parents[0].refs = Array(33).fill(ref); });
    rejects(p => { p.blobs = []; });
    rejects(p => { p.blobs.push(structuredClone(p.blobs[0])); });
    rejects(p => { p.blobs[0].ref = 'blob:invalid'; });
    rejects(p => { p.blobs[0].size = 99 * 1024 * 1024; });
    rejects(p => { p.blobs[0].encrypted = 'false'; });
    rejects(p => { p.blobs[0].createdAt = '2026-11-23T00:00:00Z'; });
    rejects(p => { p.blobs[0].contentType = 'INVALID'; });
    rejects(p => { p.parents[0].refs = ['blob:sha256-' + 'B'.repeat(43)]; });
  });

  it('decrypts and verifies the exact author, statement type and signed manifest', async () => {
    const created = await createIdentity(passphrase);
    try {
      const identity = created.identity;
      const signed = await signEnvelope(identity, {
        type: 'classrup.vault.attachment_manifest/v1',
        createdAt: new Date().toISOString(), seq: 1, prev: null,
        payload: { ...payload, principal: identity.principal },
      });
      const plaintext = new TextEncoder().encode(JSON.stringify(signed));
      let sealed;
      try { sealed = await seal(plaintext, passphrase); }
      finally { plaintext.fill(0); }
      const result = await verifySealedAttachmentManifest(sealed, passphrase, identity.principal);
      expect(result).toMatchObject({ principal: identity.principal, links: 1, totalBytes: 3 });
      expect(result.parents[0].refs).toEqual([ref]);
    } finally {
      created.identity.lock();
    }
  }, 30000);
});
