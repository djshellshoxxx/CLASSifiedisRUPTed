import { describe, expect, it } from 'vitest';
import { ANONYMOUS, appError, canonicalJson, createSyncSender, defineQuery, err, ok, ok as okResult, sha256Hex, z, type Actor, type SignedEnvelope } from '@classrup/kernel';
import { createTestKernel, type TestKernel } from '@classrup/kernel/testing';
import { decodeBase64url, didFromPublicKey, encodeBase64url, publicKeyFromDid } from '@classrup/security';
import { optDefinitions, type VerifiedStatement } from '../opt/index.ts';
import { CATEGORIES, DEFAULT_MATRIX, PREFERENCE_MIRROR_STATEMENT, inAppEnabled, mirrorRepo, mirrorStateOf, mirrorStatementSchema, preferenceChanged, prefDefinitions, preferenceRepo } from './index.ts';

const enc = new TextEncoder();
interface Ident { did: string; sign(type: string, payload: unknown, seq: number, prev: string | null, at: string): Promise<SignedEnvelope> }
async function makeIdent(): Promise<Ident> {
  const kp = (await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])) as CryptoKeyPair;
  const did = didFromPublicKey(new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)));
  return { did, sign: async (type, payload, seq, prev, at) => {
    const body = { type, author: did, seq, prev, payload, createdAt: at };
    const cid = `sha256-${await sha256Hex(canonicalJson(body))}`;
    const sig = encodeBase64url(new Uint8Array(await crypto.subtle.sign('Ed25519', kp.privateKey, enc.encode(canonicalJson({ ...body, cid })))));
    return { ...body, cid, sig };
  } };
}
async function verify(input: unknown): Promise<VerifiedStatement> {
  const { sig, cid, ...body } = input as Record<string, unknown> & { sig: string; cid: string };
  if (cid !== `sha256-${await sha256Hex(canonicalJson(body))}`) throw new Error('cid');
  const key = await crypto.subtle.importKey('raw', publicKeyFromDid(body['author'] as string), 'Ed25519', false, ['verify']);
  if (!(await crypto.subtle.verify('Ed25519', key, decodeBase64url(sig, 64), enc.encode(canonicalJson({ ...body, cid }))))) throw new Error('sig');
  return { author: body['author'] as string, type: body['type'] as string, payload: body['payload'], cid, seq: body['seq'] as number };
}

const R = 'relay.example';
interface Env { user: Ident; vault: TestKernel; relay: TestKernel; actor: Actor; relayActor: Actor; sysActor: Actor }
async function setup(): Promise<Env> {
  const user = await makeIdent();
  const relayIdent = await makeIdent();
  const vault = createTestKernel();
  const relay = createTestKernel();
  const common = (ident: Ident, k: TestKernel) => ({ localPrincipal: () => ident.did, signStatement: (t: string, p: unknown, s: number, prev: string | null) => ident.sign(t, p, s, prev, k.clock.iso()), verifyStatement: verify });
  const optOpts = (ident: Ident, k: TestKernel) => ({ ...common(ident, k), relayChannels: (id: string) => (id === R ? ['push', 'email'] : []), privacy: { check: () => ({ granted: true, consentId: 'pc-1' }) } });
  const relayInfo = { relayId: R, signReceipt: async (p: unknown) => `receipt:${await sha256Hex(canonicalJson(p))}` };
  vault.registry.add(...optDefinitions(optOpts(user, vault)).all, ...prefDefinitions(common(user, vault)).all);
  relay.registry.add(...optDefinitions({ ...optOpts(relayIdent, relay), relay: { offers: ['push', 'email'], ...relayInfo, randomBytes: n => crypto.getRandomValues(new Uint8Array(n)) } }).all, ...prefDefinitions({ ...common(relayIdent, relay), relay: relayInfo }).all);
  const dump = defineQuery({ name: 'test.mirror.dump', module: 'F99.S01.M01', capability: 'test.mirror.dump', input: z.strictObject({}), handler: ctx => { const p = ctx.tx.repo(mirrorRepo).query({ limit: 10 }); return p.ok ? okResult(p.value.items.map(r => r.data)) : p; } });
  const cells = defineQuery({ name: 'test.cells.dump', module: 'F99.S01.M01', capability: 'test.cells.dump', input: z.strictObject({}), handler: ctx => { const p = ctx.tx.repo(preferenceRepo).query({ limit: 50 }); return p.ok ? okResult(p.value.items.map(r => ({ id: r.id, revision: r.revision, ...r.data }))) : p; } });
  const gate = defineQuery({ name: 'test.inapp.gate', module: 'F99.S01.M01', capability: 'test.inapp.gate', input: z.strictObject({ category: z.string() }), handler: (ctx, i) => okResult({ on: inAppEnabled(ctx.tx, i.category) }) });
  vault.registry.add(cells, gate); relay.registry.add(dump);
  return { user, vault, relay, actor: { kind: 'user', id: user.did, roles: ['member'] }, relayActor: relay.user(['relay_device']), sysActor: { kind: 'system', id: 'relay:gate', roles: [] } };
}
type Res = { ok: boolean; value?: unknown; error?: { code: string } };
const val = <T>(r: Res): T => { if (!r.ok) throw new Error(r.error?.code); return (r.value as { value: T }).value; };
const code = (r: Res) => (r.ok ? 'ok' : r.error?.code);
interface CellOut { id: string; revision: number; category: string; inApp: boolean; push: boolean; email: boolean; inAppLocked: boolean; mirrorSeq: number }
const matrix = async (e: Env) => val<{ cells: CellOut[]; channelStatus: { push: boolean; email: boolean }; defaultsVersion: number; mirrorRef: string | null }>(await e.vault.ask('notify.preference.get_matrix', {}, { actor: e.actor }));
const stored = async (e: Env) => val<CellOut[]>(await e.vault.ask('test.cells.dump', {}, { actor: e.actor }));
const set = (e: Env, cells: object[]) => e.vault.cmd('notify.preference.set', { cells }, { actor: e.actor });
const sync = (e: Env) => e.vault.storage.read(tx => tx.sync.list({}));
const rev = (m: CellOut[], c: string) => m.find(x => x.category === c)?.revision ?? 0;
async function enableChannel(e: Env, channel = 'push') {
  val(await e.vault.cmd('notify.channel.opt_in', { channel, relayId: R }, { actor: e.actor }));
  await e.vault.drainOutbox();
  for (const s of (await sync(e)).filter(x => x.envelope.type === 'classrup.notify.channel_consent/v1')) val(await e.relay.cmd('notify.channel.register', { statement: s.envelope }, { actor: e.relayActor }));
}
const mirrors = async (e: Env) => (await sync(e)).filter(x => x.envelope.type === PREFERENCE_MIRROR_STATEMENT);

describe('F13.S02.M04 in-app notification preferences', () => {
  it('TEST-PS-106-09.T01 a new vault reads 7 records equal to the golden default table with security in-app on and locked', async () => {
    const e = await setup();
    const m = await matrix(e);
    expect(m.defaultsVersion).toBe(1);
    expect(m.cells.map(c => c.category)).toEqual([...CATEGORIES]);
    const golden: Record<string, [boolean, boolean, boolean]> = {
      offers: [true, true, false], cycles: [true, true, false], messages: [true, true, false], auctions: [true, true, false], bookings: [true, true, false], moderation: [true, false, false], security: [true, true, true],
    };
    for (const c of m.cells) expect([c.inApp, c.push, c.email], c.category).toEqual(golden[c.category]);
    expect(Object.fromEntries(CATEGORIES.map(c => [c, [DEFAULT_MATRIX[c].inApp, DEFAULT_MATRIX[c].push, DEFAULT_MATRIX[c].email]]))).toEqual(golden);
    expect(m.cells.map(c => c.inAppLocked)).toEqual([false, false, false, false, false, false, true]);
    expect(m.cells.every(c => c.revision === 1)).toBe(true);
    expect(m.channelStatus).toEqual({ push: false, email: false });
    // The first write materializes exactly 7 stored records at revision 1 + the edit.
    val(await set(e, [{ category: 'auctions', push: false, expectedRevision: 1 }]));
    const rows = await stored(e);
    expect(rows).toHaveLength(7);
    expect(rows.find(r => r.id === 'security')).toMatchObject({ inApp: true, inAppLocked: true });
  });

  it('TEST-PS-106-09.T02 each rule V01 to V07 violated in turn returns the documented code and changes nothing', async () => {
    const e = await setup();
    val(await set(e, [{ category: 'offers', push: false, expectedRevision: 1 }]));
    const snap = async () => JSON.stringify([await stored(e), await sync(e), e.vault.events.length]);
    const before = await snap();
    // V01: unknown category, duplicate category, non-boolean flag, more than 21 cells, empty list, unknown key.
    expect(code(await set(e, [{ category: 'sales', push: true, expectedRevision: 1 }]))).toBe('VALIDATION_FAILED');
    expect(code(await set(e, [{ category: 'offers', push: true, expectedRevision: 2 }, { category: 'offers', email: true, expectedRevision: 2 }]))).toBe('VALIDATION_FAILED');
    expect(code(await set(e, [{ category: 'offers', push: 'yes', expectedRevision: 2 }]))).toBe('VALIDATION_FAILED');
    expect(code(await set(e, Array.from({ length: 22 }, () => ({ category: 'offers', push: true, expectedRevision: 2 }))))).toBe('VALIDATION_FAILED');
    expect(code(await set(e, []))).toBe('VALIDATION_FAILED');
    expect(code(await set(e, [{ category: 'offers', sms: true, expectedRevision: 2 }]))).toBe('VALIDATION_FAILED');
    // V02: security in-app cannot be switched off, even together with a valid change in the same request.
    expect(code(await set(e, [{ category: 'security', inApp: false, expectedRevision: 1 }]))).toBe('NOTIFY_PREF_LOCKED');
    expect(code(await set(e, [{ category: 'messages', push: false, expectedRevision: 1 }, { category: 'security', inApp: false, expectedRevision: 1 }]))).toBe('NOTIFY_PREF_LOCKED');
    // V03: reset needs confirm true.
    expect(code(await e.vault.cmd('notify.preference.reset', { confirm: false }, { actor: e.actor }))).toBe('VALIDATION_FAILED');
    expect(code(await e.vault.cmd('notify.preference.reset', {}, { actor: e.actor }))).toBe('VALIDATION_FAILED');
    // V07: stale revision, also in a request whose other cell is valid.
    expect(code(await set(e, [{ category: 'offers', push: true, expectedRevision: 1 }]))).toBe('CONFLICT_REVISION');
    expect(code(await set(e, [{ category: 'messages', push: false, expectedRevision: 1 }, { category: 'cycles', push: false, expectedRevision: 7 }]))).toBe('CONFLICT_REVISION');
    // Other principals cannot edit the matrix.
    expect(code(await e.vault.cmd('notify.preference.set', { cells: [{ category: 'offers', push: true, expectedRevision: 2 }] }, { actor: e.vault.user() }))).toBe('FORBIDDEN');
    expect(await snap()).toBe(before);
    // V04 and V05 on the relay.
    await enableChannel(e);
    const relayBefore = JSON.stringify(val(await e.relay.ask('test.mirror.dump', {}, { actor: e.relayActor })));
    const mallory = await makeIdent();
    const payload = { userDid: e.user.did, seq: 99, cells: CATEGORIES.map(category => ({ category, push: true, email: true })) };
    const forged = await mallory.sign(PREFERENCE_MIRROR_STATEMENT, payload, 99, null, e.relay.clock.iso());
    expect(code(await e.relay.cmd('notify.preference.mirror', { statement: forged }, { actor: e.relayActor }))).toBe('PRECONDITION_FAILED');
    expect(code(await e.relay.cmd('notify.preference.mirror', { statement: { garbage: true } }, { actor: e.relayActor }))).toBe('PRECONDITION_FAILED');
    expect(code(await e.relay.cmd('notify.preference.mirror', { statement: await e.user.sign(PREFERENCE_MIRROR_STATEMENT, { ...payload, cells: payload.cells.slice(1) }, 99, null, e.relay.clock.iso()) }, { actor: e.relayActor }))).toBe('VALIDATION_FAILED');
    expect(JSON.stringify(val(await e.relay.ask('test.mirror.dump', {}, { actor: e.relayActor })))).toBe(relayBefore);
  });

  it('TEST-PS-106-09.T03 edits across categories and channels are in place with revision increments, no cell is deleted and the security lock holds', async () => {
    const e = await setup();
    const first = val<{ cells: CellOut[]; mirrorState: string }>(await set(e, [{ category: 'auctions', push: false, expectedRevision: 1 }, { category: 'messages', email: true, inApp: false, expectedRevision: 1 }, { category: 'security', push: false, email: false, expectedRevision: 1 }]));
    expect(first.mirrorState).toBe('none');
    expect(first.cells.map(c => [c.category, c.revision, c.inApp, c.push, c.email])).toEqual([['messages', 2, false, true, true], ['auctions', 2, true, false, false], ['security', 2, true, false, false]]);
    // Re-sending the same values with the old revision is an idempotent no-op; fresh revisions go up by one per changed cell only.
    expect(code(await set(e, [{ category: 'auctions', push: false, expectedRevision: 1 }]))).toBe('ok');
    expect(rev(await stored(e), 'auctions')).toBe(2);
    val(await set(e, [{ category: 'auctions', push: true, expectedRevision: 2 }]));
    const rows = await stored(e);
    expect(rows).toHaveLength(7);
    expect(rev(rows, 'auctions')).toBe(3);
    expect(rev(rows, 'offers')).toBe(1);
    expect(rows.find(r => r.id === 'security')).toMatchObject({ inApp: true, inAppLocked: true, push: false });
    expect(code(await set(e, [{ category: 'security', inApp: false, expectedRevision: 2 }]))).toBe('NOTIFY_PREF_LOCKED');
    // reset restores the defaults for every cell, keeps all 7 records and bumps only cells that differ.
    const r = val<{ cells: CellOut[]; defaultsVersion: number }>(await e.vault.cmd('notify.preference.reset', { confirm: true }, { actor: e.actor }));
    expect(r.defaultsVersion).toBe(1);
    expect(r.cells).toHaveLength(7);
    for (const c of r.cells) expect([c.inApp, c.push, c.email], c.category).toEqual([DEFAULT_MATRIX[c.category as keyof typeof DEFAULT_MATRIX].inApp, DEFAULT_MATRIX[c.category as keyof typeof DEFAULT_MATRIX].push, DEFAULT_MATRIX[c.category as keyof typeof DEFAULT_MATRIX].email]);
    expect(rev(r.cells, 'offers')).toBe(1);
    expect(rev(r.cells, 'messages')).toBe(3);
    // The in-app gate used by the inbox follows the matrix and always keeps security on.
    val(await set(e, [{ category: 'offers', inApp: false, expectedRevision: 1 }]));
    expect(val<{ on: boolean }>(await e.vault.ask('test.inapp.gate', { category: 'offers' }, { actor: e.actor })).on).toBe(false);
    expect(val<{ on: boolean }>(await e.vault.ask('test.inapp.gate', { category: 'security' }, { actor: e.actor })).on).toBe(true);
    expect(val<{ on: boolean }>(await e.vault.ask('test.inapp.gate', { category: 'future_thing' }, { actor: e.actor })).on).toBe(true);
  });

  it('TEST-PS-106-09.T04 an edit while the relay is down then up shows local_committed, prepared, transport_acknowledged and peer_accepted in order, never ahead', async () => {
    const e = await setup();
    await enableChannel(e);
    const seen: string[] = [];
    const setOut = val<{ mirrorState: string }>(await set(e, [{ category: 'bookings', push: false, expectedRevision: 1 }]));
    seen.push(setOut.mirrorState);
    const stateNow = async () => { const m = await matrix(e); return mirrorStateOf((await sync(e)).filter(s => s.ref === m.mirrorRef)); };
    seen.push(await stateNow());
    let up = false;
    const sender = createSyncSender({ storage: e.vault.storage, clock: e.vault.clock, random: () => 0.5,
      transport: { send: async (destination, envelope) => {
        if (!up) return err(appError('DEPENDENCY_UNAVAILABLE'));
        const r = await e.relay.cmd(envelope.type === PREFERENCE_MIRROR_STATEMENT ? 'notify.preference.mirror' : 'notify.channel.register', { statement: envelope }, { actor: e.relayActor });
        return r.ok ? ok({ receipt: r.value.value }) : err(r.error);
      } } });
    await sender.runOnce();
    seen.push(await stateNow()); // relay down: still only prepared
    up = true;
    e.vault.clock.advance(60_000);
    await sender.drain();
    seen.push(await stateNow());
    const m = await matrix(e);
    const entry = (await sync(e)).find(s => s.ref === m.mirrorRef);
    const ack = await sender.recordPeerAck(e.vault.tenantId, R, m.mirrorRef ?? '', entry?.receipt);
    expect(ack.ok).toBe(true);
    seen.push(await stateNow());
    expect(seen).toEqual(['local_committed', 'prepared', 'prepared', 'transport_acknowledged', 'peer_accepted']);
    // The local matrix was never blocked by the relay being down; the relay holds the new snapshot after it came back.
    const snap = val<Array<{ seq: number; cells: Array<{ category: string; push: boolean }> }>>(await e.relay.ask('test.mirror.dump', {}, { actor: e.relayActor }));
    expect(snap[0]?.seq).toBe(2);
    expect(snap[0]?.cells.find(c => c.category === 'bookings')?.push).toBe(false);
  });

  it('TEST-PS-106-09.T05 each command and query executes and outputs, mirror statements and event payloads validate against the schemas', async () => {
    const e = await setup();
    await enableChannel(e, 'email');
    const out = val<{ cells: CellOut[]; mirrorState: string }>(await set(e, [{ category: 'offers', email: true, expectedRevision: 1 }]));
    expect(z.strictObject({ cells: z.array(z.object({ category: z.string(), revision: z.int() })).length(1), mirrorState: z.literal('local_committed') }).safeParse(out).success).toBe(true);
    const reset = val<{ cells: CellOut[]; defaultsVersion: number }>(await e.vault.cmd('notify.preference.reset', { confirm: true }, { actor: e.actor }));
    expect(reset.cells).toHaveLength(7);
    const statements = await mirrors(e);
    expect(statements).toHaveLength(3); // opt-in snapshot, set, reset
    const seqs: number[] = [];
    for (const s of statements) {
      const v = await verify(s.envelope);
      expect(v.author).toBe(e.user.did);
      const p = mirrorStatementSchema.parse(v.payload);
      seqs.push(p.seq);
      expect(p.cells.map(c => c.category)).toEqual([...CATEGORIES]);
    }
    expect(seqs).toEqual([1, 2, 3]);
    const receipt = val<{ seq: number; relayReceiptAt: string; relayReceiptSig: string }>(await e.relay.cmd('notify.preference.mirror', { statement: statements[2]?.envelope }, { actor: e.relayActor }));
    expect(z.strictObject({ seq: z.literal(3), relayReceiptAt: z.string(), relayReceiptSig: z.string().min(1) }).safeParse(receipt).success).toBe(true);
    const m = await matrix(e);
    expect(z.strictObject({ cells: z.array(z.object({ category: z.string() })).length(7), channelStatus: z.strictObject({ push: z.boolean(), email: z.boolean() }), defaultsVersion: z.literal(1), mirrorRef: z.string().nullable() }).safeParse(m).success).toBe(true);
    const resolved = val<{ allowed: boolean; seq: number }>(await e.relay.ask('notify.preference.resolve', { userDid: e.user.did, category: 'security', channel: 'email' }, { actor: e.sysActor }));
    expect(resolved).toEqual({ allowed: true, seq: 3 });
    expect(val<{ allowed: boolean }>(await e.relay.ask('notify.preference.resolve', { userDid: e.user.did, category: 'offers', channel: 'email' }, { actor: e.sysActor })).allowed).toBe(false); // reset turned it off
    expect(val<{ allowed: boolean }>(await e.relay.ask('notify.preference.resolve', { userDid: e.user.did, category: 'security', channel: 'push' }, { actor: e.sysActor })).allowed).toBe(false); // no push consent here
    expect(code(await e.relay.ask('notify.preference.resolve', { userDid: (await makeIdent()).did, category: 'offers', channel: 'push' }, { actor: e.sysActor }))).toBe('NOT_FOUND');
    const events = e.vault.events.filter(x => x.type === 'notify.preference.changed');
    expect(events).toHaveLength(2);
    for (const ev of events) expect(preferenceChanged.payload.safeParse(ev.payload).success).toBe(true);
    expect(events[0]?.payload).toEqual({ userDid: e.user.did, categories: ['offers'], channelsChanged: ['email'], mirrorSeq: 2, defaultsVersion: 1 });
    expect(events[0]?.privacy).toBe('P2');
  });

  it('TEST-PS-106-09.T06 channel opted-in and opted-out events mark the channel active or inactive and the relay snapshot is sent on opt-in', async () => {
    const e = await setup();
    val(await set(e, [{ category: 'moderation', push: true, expectedRevision: 1 }]));
    expect((await matrix(e)).channelStatus).toEqual({ push: false, email: false });
    expect(await mirrors(e)).toHaveLength(0); // no relay holds consent yet: nothing mirrored
    const c = val<{ consentId: string }>(await e.vault.cmd('notify.channel.opt_in', { channel: 'push', relayId: R }, { actor: e.actor }));
    await e.vault.drainOutbox();
    expect((await matrix(e)).channelStatus).toEqual({ push: true, email: false });
    const snapshots = await mirrors(e);
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.destination).toBe(R);
    const p = mirrorStatementSchema.parse((await verify(snapshots[0]?.envelope)).payload);
    expect(p.cells.find(x => x.category === 'moderation')).toEqual({ category: 'moderation', push: true, email: false });
    // The stored flags survive when the channel is withdrawn; the matrix only shows it inactive.
    const revNow = val<{ items: Array<{ id: string; revision: number }> }>(await e.vault.ask('notify.channel.get_mine', {}, { actor: e.actor })).items[0]?.revision ?? 0;
    val(await e.vault.cmd('notify.channel.opt_out', { consentId: c.consentId, expectedRevision: revNow }, { actor: e.actor }));
    await e.vault.drainOutbox();
    const m = await matrix(e);
    expect(m.channelStatus).toEqual({ push: false, email: false });
    expect(m.cells.find(x => x.category === 'moderation')?.push).toBe(true);
    // With no active relay a later edit is local only.
    expect(val<{ mirrorState: string }>(await set(e, [{ category: 'offers', push: false, expectedRevision: 1 }])).mirrorState).toBe('none');
  });

  it('TEST-PS-106-09.T07 a forged mirror from another key, a mirror without relay consent and a third-party read are rejected; the relay holds no in-app column', async () => {
    const e = await setup();
    // No consent at the relay yet: a correctly signed mirror is refused.
    const payload = { userDid: e.user.did, seq: 1, cells: CATEGORIES.map(category => ({ category, push: true, email: false })) };
    const signed = await e.user.sign(PREFERENCE_MIRROR_STATEMENT, payload, 1, null, e.relay.clock.iso());
    expect(code(await e.relay.cmd('notify.preference.mirror', { statement: signed }, { actor: e.relayActor }))).toBe('PRECONDITION_FAILED');
    expect(code(await e.relay.cmd('notify.preference.mirror', { statement: signed }, { actor: ANONYMOUS }))).toBe('UNAUTHENTICATED');
    await enableChannel(e);
    const mallory = await makeIdent();
    const forged = await mallory.sign(PREFERENCE_MIRROR_STATEMENT, payload, 1, null, e.relay.clock.iso());
    expect(code(await e.relay.cmd('notify.preference.mirror', { statement: forged }, { actor: e.relayActor }))).toBe('PRECONDITION_FAILED');
    // A statement carrying an in-app column is rejected outright.
    const withInApp = await e.user.sign(PREFERENCE_MIRROR_STATEMENT, { ...payload, cells: payload.cells.map(c => ({ ...c, inApp: true })) }, 1, null, e.relay.clock.iso());
    expect(code(await e.relay.cmd('notify.preference.mirror', { statement: withInApp }, { actor: e.relayActor }))).toBe('VALIDATION_FAILED');
    expect(val<unknown[]>(await e.relay.ask('test.mirror.dump', {}, { actor: e.relayActor }))).toEqual([]);
    // Third parties cannot read the vault matrix, and the relay resolve query is not open to users.
    expect(code(await e.vault.ask('notify.preference.get_matrix', {}, { actor: e.vault.user() }))).toBe('FORBIDDEN');
    expect(code(await e.vault.ask('notify.preference.get_matrix', {}, { actor: ANONYMOUS }))).toBe('UNAUTHENTICATED');
    val(await set(e, [{ category: 'offers', inApp: false, push: false, expectedRevision: 1 }]));
    const good = (await mirrors(e)).at(-1)?.envelope;
    val(await e.relay.cmd('notify.preference.mirror', { statement: good }, { actor: e.relayActor }));
    expect(code(await e.relay.ask('notify.preference.resolve', { userDid: e.user.did, category: 'offers', channel: 'push' }, { actor: e.relayActor }))).toBe('FORBIDDEN');
    expect(code(await e.relay.ask('notify.preference.resolve', { userDid: e.user.did, category: 'offers', channel: 'push' }, { actor: ANONYMOUS }))).toBe('UNAUTHENTICATED');
    // Relay storage and the statement contain only category, push and email: no in-app flag and no content.
    const stored = JSON.stringify(val(await e.relay.ask('test.mirror.dump', {}, { actor: e.relayActor })));
    expect(stored).not.toMatch(/inApp|in_app|inapp/i);
    expect(JSON.stringify(good)).not.toMatch(/inApp|in_app/i);
    expect(val<Array<{ cells: Array<Record<string, unknown>> }>>(await e.relay.ask('test.mirror.dump', {}, { actor: e.relayActor }))[0]?.cells.every(c => Object.keys(c).sort().join() === 'category,email,push')).toBe(true);
  });

  it('TEST-PS-106-09.T08 a replayed older mirror is ignored and edits of different cells from two devices are both kept in the merged mirror', async () => {
    const e = await setup();
    await enableChannel(e);
    const mk = (seq: number, push: boolean) => e.user.sign(PREFERENCE_MIRROR_STATEMENT, { userDid: e.user.did, seq, cells: CATEGORIES.map(category => ({ category, push, email: false })) }, seq, null, e.relay.clock.iso());
    const s5 = await mk(5, true);
    const s7 = await mk(7, false);
    expect(val<{ seq: number }>(await e.relay.cmd('notify.preference.mirror', { statement: s7 }, { actor: e.relayActor })).seq).toBe(7);
    expect(code(await e.relay.cmd('notify.preference.mirror', { statement: s5 }, { actor: e.relayActor }))).toBe('CONFLICT_STATE');
    expect(code(await e.relay.cmd('notify.preference.mirror', { statement: await mk(7, true) }, { actor: e.relayActor }))).toBe('CONFLICT_STATE'); // same seq, different content
    expect(val<{ seq: number }>(await e.relay.cmd('notify.preference.mirror', { statement: s7 }, { actor: e.relayActor })).seq).toBe(7); // idempotent replay of the same statement
    const snap = val<Array<{ seq: number; cells: Array<{ push: boolean }> }>>(await e.relay.ask('test.mirror.dump', {}, { actor: e.relayActor }));
    expect(snap).toHaveLength(1);
    expect(snap[0]?.seq).toBe(7);
    expect(snap[0]?.cells.every(c => c.push === false)).toBe(true);
    // Two devices edit different cells from the same starting revisions; per-cell revisions keep both and the later mirror carries both.
    const e2 = await setup();
    await enableChannel(e2);
    val(await set(e2, [{ category: 'offers', push: false, expectedRevision: 1 }]));
    val(await set(e2, [{ category: 'cycles', email: true, expectedRevision: 1 }]));
    const rows = await stored(e2);
    expect(rows.find(r => r.id === 'offers')).toMatchObject({ push: false, email: false, revision: 2 });
    expect(rows.find(r => r.id === 'cycles')).toMatchObject({ push: true, email: true, revision: 2 });
    const last = mirrorStatementSchema.parse((await verify((await mirrors(e2)).at(-1)?.envelope)).payload);
    expect(last.seq).toBe(3);
    expect(last.cells.find(c => c.category === 'offers')).toMatchObject({ push: false });
    expect(last.cells.find(c => c.category === 'cycles')).toMatchObject({ email: true });
  });

  it('TEST-PS-106-09.T10 the 61st edit in an hour is RATE_LIMITED and the next hour is open again', async () => {
    const e = await setup();
    let revision = 1;
    for (let i = 0; i < 60; i++) {
      val(await set(e, [{ category: 'offers', push: i % 2 === 1, expectedRevision: revision }]));
      revision = rev(await stored(e), 'offers');
    }
    const before = JSON.stringify(await stored(e));
    expect(code(await set(e, [{ category: 'offers', push: true, expectedRevision: revision }]))).toBe('RATE_LIMITED');
    expect(JSON.stringify(await stored(e))).toBe(before);
    e.vault.clock.advance(3_600_000);
    expect(code(await set(e, [{ category: 'offers', push: true, expectedRevision: revision }]))).toBe('ok');
  });
});
