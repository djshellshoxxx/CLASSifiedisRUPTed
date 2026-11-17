import { describe, expect, it } from 'vitest';
import { canonicalJson, defineCommand, sha256Hex, z, type Actor } from '@classrup/kernel';
import { createTestKernel } from '@classrup/kernel/testing';
import { didFromPublicKey, encodeBase64url, publicKeyFromDid, type StatementSigner } from '@classrup/security';
import { consentDefinitions, consentRepo, consentSigningBytes, signConsentStatement, verifyConsentStatement, type ConsentPayload, type ConsentStatement, type ConsentSubject } from './index.ts';

type Res = { ok: boolean; value?: unknown; error?: { code: string } };
function val<T>(r: Res): T { if (!r.ok) throw new Error(r.error?.code); return (r.value as { value: T }).value; }
const code = (r: Res) => r.ok ? 'ok' : r.error?.code;
async function signer(): Promise<StatementSigner> {
  const keys = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const principal = didFromPublicKey(new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey)));
  return { principal, sign: async bytes => new Uint8Array(await crypto.subtle.sign('Ed25519', keys.privateKey, new Uint8Array(bytes))), lock() {} };
}
async function setup(withKeyPolicy = false) {
  const k = createTestKernel();
  const alice = await signer(); const bob = await signer(); const outsider = await signer();
  const actor: Actor = { kind: 'user', id: alice.principal, roles: ['member'] };
  const ref = k.ids.next(); const hash = await sha256Hex(canonicalJson({ terms: 'Exact offer', revision: 1 }));
  const textHash = await sha256Hex('I agree with this exact offer revision.');
  const versions = new Map<number, ConsentSubject>();
  let current = 1;
  let committed = false;
  let keyCutoff = Infinity;
  const participants = [{ did: alice.principal, roles: ['buyer'] }, { did: bob.principal, roles: ['seller'] }];
  versions.set(1, { revision: 1, currentRevision: 1, hash, participants, committed: false });
  const defs = consentDefinitions({ localPrincipal: () => alice.principal, signer: alice,
    ...(withKeyPolicy ? { keyFor: async (p: ConsentPayload, at: string) => Date.parse(at) < keyCutoff && p.signerKeyId === p.signerDid ? publicKeyFromDid(p.signerDid) : undefined } : {}),
    subject: (_tx, type, id, revision = current) => { const s = versions.get(revision); return type === 'bazaar_offer' && id === ref && s ? { ...s, currentRevision: current, committed } : undefined; },
    wording: [{ key: 'consent.bazaar.offer.v1', subjectType: 'bazaar_offer', textHash, roles: ['buyer', 'seller'] }],
  });
  k.registry.add(...defs.all);
  const input = { subjectType: 'bazaar_offer' as const, subjectRef: ref, subjectRevision: 1, subjectRevisionHash: hash, statementKey: 'consent.bazaar.offer.v1', statementTextHash: textHash, kind: 'consent' as const, readConfirmed: true };
  const query = { subjectType: input.subjectType, subjectRef: ref, subjectRevisionHash: hash, signerDid: alice.principal, statementKey: input.statementKey };
  const cmd = (name: string, i: unknown, as = actor) => k.cmd(name, i, { actor: as });
  const ask = (name: string, i: unknown, as = actor) => k.ask(name, i, { actor: as });
  const sign = () => cmd('comms.consent.sign', input);
  const make = async (who: StatementSigner, over: Partial<ConsentPayload> = {}) => signConsentStatement(who, {
    signerDid: who.principal, signerKeyId: who.principal, subjectType: 'bazaar_offer', subjectRef: ref, subjectRevision: 1, subjectRevisionHash: hash,
    statementKey: input.statementKey, statementTextHash: textHash, signedAtClaim: k.clock.iso(), kind: 'consent', ...over,
  });
  return { k, alice, bob, outsider, actor, ref, hash, textHash, input, query, cmd, ask, sign, make,
    revise: async (next = current + 1) => { current = next; const hash = await sha256Hex(`revision ${next}`); versions.set(next, { revision: next, currentRevision: next, hash, participants, committed: false }); return { subjectRevision: next, subjectRevisionHash: hash }; },
    commit: () => { committed = true; },
    revokeKeysAfter: (at: number) => { keyCutoff = at; },
  };
}

describe('Explicit signed consent core', () => {
  it('checks stored first-seen key validity on exact replay while rejecting new statements after key revocation', async () => {
    const e = await setup(true); const peer = await e.make(e.bob);
    val(await e.cmd('comms.consent.accept', { statement: peer, provenance: {} }));
    e.k.clock.advance(1_000); e.revokeKeysAfter(e.k.clock.now());
    expect(code(await e.cmd('comms.consent.accept', { statement: peer, provenance: { via: ['file'] } }))).toBe('ok');
    expect(val(await e.ask('comms.consent.verify', { ...e.query, signerDid: e.bob.principal }))).toMatchObject({ result: 'valid' });
    const newStatement = await e.make(e.bob);
    expect(code(await e.cmd('comms.consent.accept', { statement: newStatement, provenance: {} }))).toBe('COMMS_CONSENT_SIGNATURE_INVALID');
    expect(e.k.events.filter(x => x.type === 'comms.consent.received')).toHaveLength(1);
    expect(val<{ items: unknown[] }>(await e.ask('comms.consent.list_for_subject', { subjectType: 'bazaar_offer', subjectRef: e.ref })).items).toHaveLength(1);
  });


  it('rolls back failed signing and detects altered stored signatures before reporting consent valid', async () => {
    const e = await setup();
    const actual = e.alice.sign;
    e.alice.sign = async () => new Uint8Array(64);
    expect(code(await e.sign())).toBe('COMMS_CONSENT_SIGNATURE_INVALID');
    expect(e.k.events).toEqual([]);
    expect(val<{ items: unknown[] }>(await e.ask('comms.consent.list_for_subject', { subjectType: 'bazaar_offer', subjectRef: e.ref })).items).toEqual([]);
    e.alice.sign = actual;
    const signed = val<{ consentId: string }>(await e.sign());
    const corrupt = defineCommand({ name: 'test.consent.corrupt', module: 'F99.S01.M01', capability: 'test.consent.corrupt', idempotent: false, input: z.strictObject({}), handler(ctx) {
      const repo = ctx.tx.repo(consentRepo); const row = repo.get(signed.consentId);
      if (!row) throw new Error('Missing fixture consent');
      return repo.put(row.id, { ...row.data, statement: { ...row.data.statement, signature: encodeBase64url(new Uint8Array(64)) } }, { expectedRevision: row.revision });
    } });
    e.k.registry.add(corrupt);
    val(await e.cmd('test.consent.corrupt', {}));
    expect(code(await e.ask('comms.consent.verify', e.query))).toBe('COMMS_CONSENT_SIGNATURE_INVALID');
  });

  it('retains distinct authenticated duplicate CIDs so a remote revocation can refer to the exact signed statement', async () => {
    const e = await setup();
    const first = await e.make(e.bob);
    e.k.clock.advance(1000);
    const duplicate = await e.make(e.bob);
    for (const statement of [first, duplicate]) val(await e.cmd('comms.consent.accept', { statement, provenance: { via: ['file'] } }));
    const revocation = await e.make(e.bob, { kind: 'revocation', revokes: duplicate.cid });
    val(await e.cmd('comms.consent.accept', { statement: revocation, provenance: { via: ['file'] } }));
    expect(val(await e.ask('comms.consent.verify', { ...e.query, signerDid: e.bob.principal }))).toMatchObject({ result: 'revoked' });
    expect(val<{ items: unknown[] }>(await e.ask('comms.consent.list_for_subject', { subjectType: 'bazaar_offer', subjectRef: e.ref })).items).toHaveLength(3);
  });

  it('binds exact consent bytes, content address, participant role, wording and revision; no text leaks into events', async () => {
    const e = await setup();
    const signed = val<{ consentId: string; statement: ConsentStatement; revision: number }>(await e.sign());
    const payload = signed.statement.payload;
    const bytes = new TextEncoder().encode(`classrup.consent.v1\0${canonicalJson(payload)}`);
    expect(consentSigningBytes(payload)).toEqual(bytes);
    expect(signed.statement.signature).toBe(encodeBase64url(await e.alice.sign(bytes)));
    expect(signed.consentId).toBe(`sha256-${await sha256Hex(canonicalJson({ payload, signature: signed.statement.signature }))}`);
    expect(await verifyConsentStatement(signed.statement)).toEqual(signed.statement);
    expect(val(await e.ask('comms.consent.verify', e.query))).toMatchObject({ result: 'valid', consentId: signed.consentId });
    expect(JSON.stringify(e.k.events)).not.toContain('Exact offer');
    expect(JSON.stringify(e.k.events)).not.toContain(signed.statement.signature);
    expect(e.k.events.filter(x => x.type === 'comms.consent.signed')).toHaveLength(1);
  });

  it('rejects stale or mismatched revisions, bad wording, missing confirmation and foreign users without writes', async () => {
    const e = await setup();
    for (const patch of [{ subjectRevisionHash: 'f'.repeat(64) }, { statementTextHash: 'f'.repeat(64) }, { readConfirmed: false }, { subjectRevision: 8 }]) {
      expect(code(await e.cmd('comms.consent.sign', { ...e.input, ...patch }))).not.toBe('ok');
    }
    expect(code(await e.cmd('comms.consent.sign', e.input, { kind: 'user', id: e.outsider.principal, roles: ['member'] }))).toBe('FORBIDDEN');
    expect(val<{ items: unknown[] }>(await e.ask('comms.consent.list_for_subject', { subjectType: 'bazaar_offer', subjectRef: e.ref })).items).toEqual([]);
    expect(e.k.events).toHaveLength(0);
    await e.revise();
    expect(code(await e.sign())).toBe('COMMS_CONSENT_STALE');
  });

  it('deduplicates signing despite clock changes and receiving the same content despite new idempotency keys', async () => {
    const e = await setup();
    const first = val<{ consentId: string; statement: ConsentStatement }>(await e.sign());
    e.k.clock.advance(10_000);
    expect(val(await e.sign())).toMatchObject({ consentId: first.consentId, statement: first.statement });
    const peer = await e.make(e.bob);
    for (let i = 0; i < 5; i++) expect(code(await e.cmd('comms.consent.accept', { statement: peer, provenance: { via: ['file'] } }))).toBe('ok');
    expect(e.k.events.filter(x => x.type === 'comms.consent.signed')).toHaveLength(1);
    expect(e.k.events.filter(x => x.type === 'comms.consent.received')).toHaveLength(1);
    expect(val<{ items: unknown[] }>(await e.ask('comms.consent.list_for_subject', { subjectType: 'bazaar_offer', subjectRef: e.ref })).items).toHaveLength(2);
  });

  it('rejects tampered, foreign-participant, wrong protocol and unregistered-key statements before persistence', async () => {
    const e = await setup(); const peer = await e.make(e.bob);
    const attempts = [
      { ...peer, payload: { ...peer.payload, kind: 'decline' } },
      await e.make(e.outsider),
      { ...peer, signature: encodeBase64url(await e.bob.sign(new TextEncoder().encode(canonicalJson(peer.payload)))) },
      await e.make(e.bob, { signerKeyId: e.outsider.principal }),
    ];
    for (const statement of attempts) expect(code(await e.cmd('comms.consent.accept', { statement, provenance: { via: ['file'] } }))).not.toBe('ok');
    expect(e.k.events).toHaveLength(0);
    expect(val<{ items: unknown[] }>(await e.ask('comms.consent.list_for_subject', { subjectType: 'bazaar_offer', subjectRef: e.ref })).items).toEqual([]);
  });

  it('keeps revocation monotonic and never orders consent, decline or revocation by time claims', async () => {
    const e = await setup(); const first = val<{ consentId: string; statement: ConsentStatement }>(await e.sign());
    const decline = await e.make(e.alice, { kind: 'decline', signedAtClaim: '2026-11-01T00:00:00.000Z' });
    expect(code(await e.cmd('comms.consent.accept', { statement: decline, provenance: { via: ['file'] } }))).toBe('ok');
    expect(val(await e.ask('comms.consent.verify', e.query))).toMatchObject({ result: 'conflicted' });
    expect(code(await e.cmd('comms.consent.revoke', { consentId: first.consentId, expectedRevision: 99 }))).toBe('CONFLICT_REVISION');
    val(await e.cmd('comms.consent.revoke', { consentId: first.consentId, expectedRevision: 1 }));
    expect(val(await e.ask('comms.consent.verify', e.query))).toMatchObject({ result: 'revoked' });
    e.k.clock.advance(1_000);
    val(await e.sign());
    expect(val(await e.ask('comms.consent.verify', e.query))).toMatchObject({ result: 'revoked' });
    expect(code(await e.cmd('comms.consent.revoke', { consentId: first.consentId, expectedRevision: 2 }))).toBe('COMMS_CONSENT_NOT_REVOCABLE');
  });

  it('reports old consent stale after subject revision and rejects revocation after the owner commits', async () => {
    const e = await setup(); const first = val<{ consentId: string }>(await e.sign());
    await e.revise();
    expect(val(await e.ask('comms.consent.verify', e.query))).toMatchObject({ result: 'stale' });
    e.commit();
    expect(code(await e.cmd('comms.consent.revoke', { consentId: first.consentId, expectedRevision: 1 }))).toBe('COMMS_CONSENT_NOT_REVOCABLE');
  });

  it('flags clock suspicion while keeping authenticated past/future claims and hides subject evidence from foreign users', async () => {
    const e = await setup();
    const peer = await e.make(e.bob, { signedAtClaim: '2020-01-01T00:00:00.000Z' });
    val(await e.cmd('comms.consent.accept', { statement: peer, provenance: { via: ['file'] } }));
    expect(val(await e.ask('comms.consent.verify', { ...e.query, signerDid: e.bob.principal }))).toMatchObject({ result: 'valid', clockSuspect: true });
    const outsider: Actor = { kind: 'user', id: e.outsider.principal, roles: ['member'] };
    expect(code(await e.ask('comms.consent.verify', e.query, outsider))).toBe('NOT_FOUND');
    expect(code(await e.ask('comms.consent.list_for_subject', { subjectType: 'bazaar_offer', subjectRef: e.ref }, outsider))).toBe('NOT_FOUND');
    expect(code(await e.cmd('comms.consent.accept', { statement: peer, provenance: {} }, outsider))).toBe('FORBIDDEN');
  });

  it('rejects new-CID repeated revocations without consuming another consent withdrawal reserve', async () => {
    const e = await setup(); const first = val<{ consentId: string }>(await e.sign());
    const revision = await e.revise();
    const second = val<{ consentId: string }>(await e.cmd('comms.consent.sign', { ...e.input, ...revision }));
    const revoked = val<{ statement: ConsentStatement }>(await e.cmd('comms.consent.revoke', { consentId: first.consentId, expectedRevision: 1 }));
    // Exact replay remains idempotent, even when the original row is terminal.
    expect(code(await e.cmd('comms.consent.accept', { statement: revoked.statement, provenance: {} }))).toBe('ok');
    e.k.clock.advance(1_000);
    const repeated = await e.make(e.alice, { kind: 'revocation', revokes: first.consentId });
    expect(code(await e.cmd('comms.consent.accept', { statement: repeated, provenance: {} }))).toBe('COMMS_CONSENT_NOT_REVOCABLE');
    expect(val<{ items: unknown[] }>(await e.ask('comms.consent.list_for_subject', { subjectType: 'bazaar_offer', subjectRef: e.ref })).items).toHaveLength(3);
    expect(code(await e.cmd('comms.consent.revoke', { consentId: second.consentId, expectedRevision: 1 }))).toBe('ok');
  });

  it('rejects mismatched revocation targets and reserves withdrawal capacity when normal evidence is full', async () => {
    const e = await setup(); const first = val<{ consentId: string }>(await e.sign());
    const wrong = await e.make(e.bob, { kind: 'revocation', revokes: first.consentId });
    expect(code(await e.cmd('comms.consent.accept', { statement: wrong, provenance: {} }))).toBe('COMMS_CONSENT_NOT_REVOCABLE');
    const originals = [first.consentId];
    for (let i = 2; i <= 10; i++) {
      const revision = await e.revise(i);
      originals.push(val<{ consentId: string }>(await e.cmd('comms.consent.sign', { ...e.input, ...revision })).consentId);
    }
    const eleventh = await e.revise(11);
    expect(code(await e.cmd('comms.consent.sign', { ...e.input, ...eleventh }))).toBe('RATE_LIMITED');
    for (const consentId of originals) expect(code(await e.cmd('comms.consent.revoke', { consentId, expectedRevision: 1 }))).toBe('ok');
    const rows = val<{ items: Array<{ data: { status: string; statement: ConsentStatement } }> }>(await e.ask('comms.consent.list_for_subject', { subjectType: 'bazaar_offer', subjectRef: e.ref })).items;
    expect(rows).toHaveLength(20);
    expect(rows.filter(r => r.data.status === 'revoked')).toHaveLength(10);
  });
});
