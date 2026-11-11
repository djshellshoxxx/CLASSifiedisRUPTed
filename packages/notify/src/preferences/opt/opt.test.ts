import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { ANONYMOUS, canonicalJson, createFakeClock, createFixedWindowRateLimiter, defineCommand, defineEvent, defineQuery, ok, sha256Hex, z, type Actor, type SignedEnvelope } from '@classrup/kernel';
import { createTestKernel, type TestKernel } from '@classrup/kernel/testing';
import { decodeBase64url, didFromPublicKey, encodeBase64url, publicKeyFromDid } from '@classrup/security';
import { CHANNEL_CONSENT_STATEMENT, consentRepo, consentStatementSchema, hasActiveConsent, optDefinitions, optedIn, optedOut, type ChannelOptions, type VerifiedStatement } from './index.ts';

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
  const { sig, cid, ...body } = input as Record<string, unknown> & { sig: string; cid: string; author: string; seq: number; type: string; payload: unknown };
  if (cid !== `sha256-${await sha256Hex(canonicalJson(body))}`) throw new Error('cid');
  const key = await crypto.subtle.importKey('raw', publicKeyFromDid(body['author'] as string), 'Ed25519', false, ['verify']);
  if (!(await crypto.subtle.verify('Ed25519', key, decodeBase64url(sig, 64), enc.encode(canonicalJson({ ...body, cid }))))) throw new Error('sig');
  return { author: body['author'] as string, type: body['type'] as string, payload: body['payload'], cid, seq: body['seq'] as number };
}

const R = 'relay.example';
const R2 = 'relay2.example';
const channelsOf = (id: string): readonly string[] => (id === R ? ['push', 'email'] : id === R2 ? ['push'] : []);
const known = new Set(['pc-1', 'pc-2']);
const privacy = { check: (i: { consentId?: string }) => (i.consentId === undefined ? { granted: true, consentId: 'pc-1' } : { granted: known.has(i.consentId) }) };

interface Env { vault: TestKernel; relay: TestKernel; user: Ident; relayIdent: Ident; actor: Actor; relayActor: Actor; vdefs: ReturnType<typeof optDefinitions>; rdefs: ReturnType<typeof optDefinitions>; mint(consentId: string): Promise<string> }
async function setup(opts: { relayRate?: boolean; privacyOk?: boolean } = {}): Promise<Env> {
  const user = await makeIdent();
  const relayIdent = await makeIdent();
  const vault = createTestKernel();
  const base = (ident: Ident, k: TestKernel): ChannelOptions => ({
    localPrincipal: () => ident.did, relayChannels: channelsOf, privacy: opts.privacyOk === false ? { check: () => ({ granted: false }) } : privacy,
    signStatement: (type, payload, seq, prev) => ident.sign(type, payload, seq, prev, k.clock.iso()), verifyStatement: verify,
    isRelaySigner: (relayId, author) => relayId === R && author === relayIdent.did,
  });
  const relay = createTestKernel({ ...(opts.relayRate ? { rateLimit: createFixedWindowRateLimiter({ limit: 10, windowMs: 60_000, clock: createFakeClock('2026-11-04T10:00:00.000Z') }) } : {}) });
  const vdefs = optDefinitions(base(user, vault));
  const rdefs = optDefinitions({ ...base(relayIdent, relay), relay: { relayId: R, offers: ['push', 'email'], signReceipt: async p => `receipt:${await sha256Hex(canonicalJson(p))}`,
    randomBytes: n => crypto.getRandomValues(new Uint8Array(n)), returnDestination: did => `vault:${did}` } });
  const mintCmd = defineCommand({ name: 'test.token.mint', module: 'F99.S01.M01', capability: 'test.token.mint', idempotent: false, input: z.strictObject({ consentId: z.string() }),
    async handler(ctx, i) { const t = await rdefs.mintUnsubscribeToken(ctx, i.consentId); return t.ok ? ok({ token: t.value }) : t; } });
  const dump = defineQuery({ name: 'test.consent.dump', module: 'F99.S01.M01', capability: 'test.consent.dump', input: z.strictObject({}),
    handler: ctx => { const p = ctx.tx.repo(consentRepo).query({ limit: 500 }); return p.ok ? ok(p.value.items.map(r => ({ id: r.id, revision: r.revision, ...r.data }))) : p; } });
  const emitPrivacy = defineCommand({ name: 'test.privacy.emit', module: 'F99.S01.M01', capability: 'test.privacy.emit', idempotent: false,
    input: z.strictObject({ type: z.enum(['privacy.consent.withdrawn', 'privacy.deletion.requested']), consentId: z.string().optional() }),
    handler(ctx, i) { ctx.emit(defineEvent(i.type, 1, 'P2', z.looseObject({})), { aggregate: { type: 'privacy', id: ctx.ids.next() }, revision: 1, payload: i.consentId ? { consentId: i.consentId } : {} }); return ok(null); } });
  const applyRelay = defineCommand({ name: 'test.relay.statement', module: 'F99.S01.M01', capability: 'test.relay.statement', idempotent: false, input: z.strictObject({ statement: z.unknown() }),
    async handler(ctx, i) { const v = await verify(i.statement); const h = vdefs.statementHandlers[v.type as typeof CHANNEL_CONSENT_STATEMENT]; return h(ctx, v); } });
  vault.registry.add(...vdefs.all, dump, emitPrivacy, applyRelay);
  relay.registry.add(...rdefs.all, dump, mintCmd);
  const actor = { kind: 'user' as const, id: user.did, roles: ['member'] };
  const relayActor = relay.user(['relay_device']);
  return { vault, relay, user, relayIdent, actor, relayActor, vdefs, rdefs, mint: async consentId => { const r = await relay.cmd('test.token.mint', { consentId }, { actor: relayActor }); if (!r.ok) throw new Error(r.error.code); return (r.value.value as { token: string }).token; } };
}
const val = <T>(r: { ok: boolean; value?: unknown; error?: { code: string } }): T => { if (!r.ok) throw new Error(r.error?.code); return (r.value as { value: T }).value; };
const code = (r: { ok: boolean; error?: { code: string } }) => (r.ok ? 'ok' : r.error?.code);
type Out = { consentId: string; status: string; expiresAt: string; syncState: string };
const optIn = (e: Env, channel = 'push', relayId = R, extra: object = {}) => e.vault.cmd('notify.channel.opt_in', { channel, relayId, ...extra }, { actor: e.actor });
const vaultSync = (e: Env) => e.vault.storage.read(tx => tx.sync.list({}));
const relaySync = (e: Env) => e.relay.storage.read(tx => tx.sync.list({}));
const dumpOf = async (k: TestKernel, actor?: Actor) => val<Array<Record<string, unknown> & { id: string; revision: number; status: string }>>(await k.ask('test.consent.dump', {}, actor ? { actor } : {}));
const mineOf = async (e: Env) => val<{ items: Array<Record<string, unknown> & { id: string; revision: number; status: string }> }>(await e.vault.ask('notify.channel.get_mine', {}, { actor: e.actor })).items;
async function pump(e: Env, dest = R): Promise<string[]> {
  const entries = (await vaultSync(e)).filter(s => s.destination === dest);
  const out: string[] = [];
  for (const s of entries) out.push(code(await e.relay.cmd('notify.channel.register', { statement: s.envelope }, { actor: e.relayActor })) as string);
  return out;
}

describe('F13.S02.M03 channel opt-in/opt-out', () => {
  it('TEST-PS-107-09.T01 opt in to push on R, withdraw, re-grant: first record terminal withdrawn, re-grant is a new record, statements signed', async () => {
    const e = await setup();
    const first = val<Out>(await optIn(e));
    expect(first).toMatchObject({ status: 'granted', syncState: 'local_committed', expiresAt: '2027-11-04T10:00:00.000Z' });
    expect(val<Out>(await optIn(e)).consentId).toBe(first.consentId); // idempotent while granted
    const rev = (await mineOf(e))[0]?.revision ?? 0;
    const out = val<{ status: string; revision: number }>(await e.vault.cmd('notify.channel.opt_out', { consentId: first.consentId, expectedRevision: rev }, { actor: e.actor }));
    expect(out).toMatchObject({ status: 'withdrawn', revision: rev + 1 });
    const again = val<Out>(await optIn(e));
    expect(again.consentId).not.toBe(first.consentId);
    const items = await mineOf(e);
    expect(items.find(i => i.id === first.consentId)?.status).toBe('withdrawn');
    expect(items.find(i => i.id === again.consentId)?.status).toBe('granted');
    // The withdrawn record stays terminal: a repeated opt_out is idempotent and does not revive it.
    expect(val<{ status: string }>(await e.vault.cmd('notify.channel.opt_out', { consentId: first.consentId, expectedRevision: rev }, { actor: e.actor })).status).toBe('withdrawn');
    const statements = (await vaultSync(e)).map(s => s.envelope);
    expect(statements).toHaveLength(3);
    for (const s of statements) {
      const v = await verify(s);
      expect(v.author).toBe(e.user.did);
      expect(v.type).toBe(CHANNEL_CONSENT_STATEMENT);
      expect(consentStatementSchema.safeParse(v.payload).success).toBe(true);
    }
    expect(statements.map(s => (s['payload'] as { status: string }).status)).toEqual(['granted', 'withdrawn', 'granted']);
    expect(e.vault.events.map(x => x.type)).toEqual(['notify.channel.opted_in', 'notify.channel.opted_out', 'notify.channel.opted_in']);
  });

  it('TEST-PS-107-09.T02 each rule V01 to V07 violated in turn returns its documented code and leaves state unchanged', async () => {
    const e = await setup();
    // V01: email on a push-only relay, an unknown relay and an unknown channel.
    expect(code(await optIn(e, 'email', R2))).toBe('NOTIFY_CHANNEL_UNSUPPORTED');
    expect(code(await optIn(e, 'push', 'nowhere.example'))).toBe('NOTIFY_CHANNEL_UNSUPPORTED');
    expect(code(await optIn(e, 'sms'))).toBe('NOTIFY_CHANNEL_UNSUPPORTED');
    // V03: only the local principal may consent.
    expect(code(await e.vault.cmd('notify.channel.opt_in', { channel: 'push', relayId: R }, { actor: e.vault.user() }))).toBe('FORBIDDEN');
    // V04: unknown or ungranted privacy consent.
    expect(code(await optIn(e, 'push', R, { privacyConsentId: 'pc-unknown' }))).toBe('PRECONDITION_FAILED');
    const denied = await setup({ privacyOk: false });
    expect(code(await optIn(denied))).toBe('PRECONDITION_FAILED');
    expect(await mineOf(denied)).toEqual([]);
    // V02: the relay refuses a statement for another relay, a bad signature and a channel the relay does not offer.
    const good = val<Out>(await optIn(e));
    const stmt = (await vaultSync(e))[0]?.envelope as SignedEnvelope;
    const wrongRelay = await e.user.sign(CHANNEL_CONSENT_STATEMENT, { ...(stmt['payload'] as object), relayId: 'other.example' }, 1, null, e.vault.clock.iso());
    expect(code(await e.relay.cmd('notify.channel.register', { statement: wrongRelay }, { actor: e.relayActor }))).toBe('VALIDATION_FAILED');
    expect(code(await e.relay.cmd('notify.channel.register', { statement: { ...stmt, sig: 'AAAA' } }, { actor: e.relayActor }))).toBe('VALIDATION_FAILED');
    expect(code(await e.relay.cmd('notify.channel.register', { statement: { not: 'a statement' } }, { actor: e.relayActor }))).toBe('VALIDATION_FAILED');
    expect(await dumpOf(e.relay)).toEqual([]);
    // V05: unknown, malformed token.
    expect(code(await e.relay.cmd('notify.channel.unsubscribe', { token: encodeBase64url(new Uint8Array(32)) }, { actor: ANONYMOUS }))).toBe('NOTIFY_UNSUBSCRIBE_TOKEN_INVALID');
    expect(code(await e.relay.cmd('notify.channel.unsubscribe', { token: 'short' }, { actor: ANONYMOUS }))).toBe('NOTIFY_UNSUBSCRIBE_TOKEN_INVALID');
    expect(await dumpOf(e.relay)).toEqual([]);
    expect(await mineOf(e)).toHaveLength(1);
    expect(good.status).toBe('granted');
    // V06: 20 changes per day and relay (10 grant/withdraw cycles); the 21st is refused and stores nothing.
    const e2 = await setup();
    for (let i = 0; i < 10; i++) {
      const c = val<Out>(await optIn(e2));
      const rev = (await mineOf(e2)).find(x => x.id === c.consentId)?.revision ?? 0;
      expect(code(await e2.vault.cmd('notify.channel.opt_out', { consentId: c.consentId, expectedRevision: rev }, { actor: e2.actor }))).toBe('ok');
    }
    const stored = (await mineOf(e2)).length;
    expect(code(await optIn(e2))).toBe('RATE_LIMITED');
    expect((await mineOf(e2)).length).toBe(stored);
    e2.vault.clock.advance(86_400_000);
    expect(code(await optIn(e2))).toBe('ok');
    // opt_out edge codes.
    const c = val<Out>(await optIn(e2, 'email'));
    expect(code(await e2.vault.cmd('notify.channel.opt_out', { consentId: c.consentId, expectedRevision: 99 }, { actor: e2.actor }))).toBe('CONFLICT_REVISION');
    expect(code(await e2.vault.cmd('notify.channel.opt_out', { consentId: e2.vault.ids.next(), expectedRevision: 1 }, { actor: e2.actor }))).toBe('NOT_FOUND');
    e2.vault.clock.advance(366 * 86_400_000);
    expect(code(await e2.vault.cmd('notify.channel.opt_out', { consentId: c.consentId, expectedRevision: 1 }, { actor: e2.actor }))).toBe('CONFLICT_STATE');
  });

  it('TEST-PS-107-09.T02 V07: the 11th unsubscribe call in a minute is RATE_LIMITED', async () => {
    const e = await setup({ relayRate: true });
    const bad = encodeBase64url(new Uint8Array(32));
    const results: Array<string | undefined> = [];
    for (let i = 0; i < 11; i++) results.push(code(await e.relay.cmd('notify.channel.unsubscribe', { token: bad }, { actor: ANONYMOUS })));
    expect(results.slice(0, 10).every(c => c === 'NOTIFY_UNSUBSCRIBE_TOKEN_INVALID')).toBe(true);
    expect(results[10]).toBe('RATE_LIMITED');
  });

  it('TEST-PS-107-09.T03 random opt-in, opt-out, expiry, unsubscribe, withdrawal and late-grant sequences: terminal states never change and withdrawal wins', async () => {
    await fc.assert(fc.asyncProperty(fc.array(fc.constantFrom('optIn', 'optOut', 'register', 'expire', 'unsubscribe', 'lateGrant', 'privacy'), { minLength: 1, maxLength: 12 }), async ops => {
      const e = await setup();
      const terminal = new Map<string, string>();
      let firstGrantStatement: SignedEnvelope | undefined;
      for (const op of ops) {
        if (op === 'optIn') await optIn(e, 'push', R, { privacyConsentId: 'pc-1' });
        if (op === 'optOut') { const g = (await mineOf(e)).find(i => i.status === 'granted'); if (g) await e.vault.cmd('notify.channel.opt_out', { consentId: g.id, expectedRevision: g.revision }, { actor: e.actor }); }
        if (op === 'register') await pump(e);
        if (op === 'expire') { e.vault.clock.advance(200 * 86_400_000); e.relay.clock.advance(200 * 86_400_000); }
        if (op === 'unsubscribe') { const g = (await dumpOf(e.relay)).find(i => i.status === 'granted' && Date.parse(i['expiresAt'] as string) > e.relay.clock.now()); if (g) await e.relay.cmd('notify.channel.unsubscribe', { token: await e.mint(g.id) }, { actor: ANONYMOUS }); }
        if (op === 'lateGrant' && firstGrantStatement) await e.relay.cmd('notify.channel.register', { statement: firstGrantStatement }, { actor: e.relayActor });
        if (op === 'privacy') { await e.vault.cmd('test.privacy.emit', { type: 'privacy.consent.withdrawn', consentId: 'pc-1' }, { actor: e.actor }); await e.vault.drainOutbox(); }
        firstGrantStatement ??= (await vaultSync(e))[0]?.envelope;
        for (const k of [e.vault, e.relay]) {
          const rows = await dumpOf(k);
          const slotGranted = rows.filter(r => r['status'] === 'granted' && Date.parse(r['expiresAt'] as string) > k.clock.now());
          expect(slotGranted.length).toBeLessThanOrEqual(1);
          for (const r of rows) {
            const key = `${k === e.vault ? 'v' : 'r'}:${r.id}`;
            const was = terminal.get(key);
            if (was) expect(r.status).toBe(was);
            if (r.status === 'withdrawn' || r.status === 'expired') terminal.set(key, r.status);
          }
        }
      }
      // After the sequence: re-registering any old grant never turns a withdrawn relay record back to granted.
      const withdrawnAtRelay = (await dumpOf(e.relay)).filter(r => r.status === 'withdrawn').map(r => r.id);
      for (const s of (await vaultSync(e)).map(x => x.envelope)) await e.relay.cmd('notify.channel.register', { statement: s }, { actor: e.relayActor });
      const after = await dumpOf(e.relay);
      for (const id of withdrawnAtRelay) expect(after.find(r => r.id === id)?.status).toBe('withdrawn');
    }), { numRuns: 25 });
  });

  it('TEST-PS-107-09.T04 each command and query executes and its outputs, statements and events validate against the schemas', async () => {
    const e = await setup();
    const out = val<Out>(await optIn(e, 'email', R, { privacyConsentId: 'pc-2' }));
    expect(z.strictObject({ consentId: z.string(), status: z.literal('granted'), expiresAt: z.string(), syncState: z.literal('local_committed') }).safeParse(out).success).toBe(true);
    const [s] = await vaultSync(e);
    const parsed = consentStatementSchema.parse((await verify(s?.envelope)).payload);
    expect(parsed).toMatchObject({ consentId: out.consentId, channel: 'email', relayId: R, status: 'granted', privacyConsentId: 'pc-2' });
    const reg = val<{ consentId: string; status: string; relayRegisteredAt: string; relayReceiptSig: string }>(await e.relay.cmd('notify.channel.register', { statement: s?.envelope }, { actor: e.relayActor }));
    expect(z.strictObject({ consentId: z.string(), status: z.literal('granted'), relayRegisteredAt: z.string(), relayReceiptSig: z.string().min(1) }).safeParse(reg).success).toBe(true);
    const token = await e.mint(out.consentId);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const mine = val<{ items: unknown[] }>(await e.vault.ask('notify.channel.get_mine', { channel: 'email' }, { actor: e.actor }));
    expect(mine.items).toHaveLength(1);
    expect(JSON.stringify(mine)).not.toContain('unsubscribeTokenHash');
    expect(val<{ items: unknown[] }>(await e.vault.ask('notify.channel.get_mine', { channel: 'push' }, { actor: e.actor })).items).toEqual([]);
    expect(code(await e.vault.ask('notify.channel.get_mine', {}, { actor: e.vault.user() }))).toBe('FORBIDDEN');
    const un = val<{ channel: string; status: string }>(await e.relay.cmd('notify.channel.unsubscribe', { token }, { actor: ANONYMOUS }));
    expect(un).toEqual({ channel: 'email', status: 'withdrawn' });
    const rev = (await mineOf(e))[0]?.revision ?? 0;
    const o = val<{ consentId: string; status: string; revision: number }>(await e.vault.cmd('notify.channel.opt_out', { consentId: out.consentId, expectedRevision: rev }, { actor: e.actor }));
    expect(o).toEqual({ consentId: out.consentId, status: 'withdrawn', revision: rev + 1 });
    const wd = consentStatementSchema.parse((await verify((await vaultSync(e))[1]?.envelope)).payload);
    expect(wd).toMatchObject({ status: 'withdrawn', withdrawnVia: 'settings' });
    const [inEv, outEv] = e.vault.events;
    expect(optedIn.payload.safeParse(inEv?.payload).success).toBe(true);
    expect(optedOut.payload.safeParse(outEv?.payload).success).toBe(true);
    expect(outEv?.payload).toMatchObject({ via: 'settings', channel: 'email' });
    expect(inEv?.privacy).toBe('P2');
  });

  it('TEST-PS-107-09.T05 privacy.consent.withdrawn and privacy.deletion.requested withdraw linked channels locally and queue relay withdrawals', async () => {
    const e = await setup();
    const push = val<Out>(await optIn(e, 'push', R, { privacyConsentId: 'pc-1' }));
    const email = val<Out>(await optIn(e, 'email', R, { privacyConsentId: 'pc-1' }));
    const other = val<Out>(await optIn(e, 'push', R2, { privacyConsentId: 'pc-2' }));
    await e.vault.cmd('test.privacy.emit', { type: 'privacy.consent.withdrawn', consentId: 'pc-1' }, { actor: e.actor });
    await e.vault.drainOutbox();
    let items = await mineOf(e);
    const st = (id: string) => items.find(i => i.id === id);
    expect([st(push.consentId)?.status, st(email.consentId)?.status, st(other.consentId)?.status]).toEqual(['withdrawn', 'withdrawn', 'granted']);
    expect(st(push.consentId)?.['withdrawnVia']).toBe('privacy_withdrawal');
    const queued = (await vaultSync(e)).filter(s => (s.envelope['payload'] as { status: string }).status === 'withdrawn');
    expect(queued.map(q => q.destination)).toEqual([R, R]);
    for (const q of queued) expect((await verify(q.envelope)).author).toBe(e.user.did);
    await e.vault.cmd('test.privacy.emit', { type: 'privacy.deletion.requested' }, { actor: e.actor });
    await e.vault.drainOutbox();
    items = await mineOf(e);
    expect(items.every(i => i.status === 'withdrawn')).toBe(true);
    expect(st(other.consentId)?.['withdrawnVia']).toBe('account_deletion');
    expect((await vaultSync(e)).filter(s => s.destination === R2 && (s.envelope['payload'] as { status: string }).status === 'withdrawn')).toHaveLength(1);
    expect(e.vault.events.filter(x => x.type === 'notify.channel.opted_out')).toHaveLength(3);
    // Redelivery of the same events changes nothing.
    await e.vault.drainOutbox();
    expect(e.vault.events.filter(x => x.type === 'notify.channel.opted_out')).toHaveLength(3);
  });

  it('TEST-PS-107-09.T06 forged opt-in from another key, unsubscribe attempting to grant and a relay creating a consent are all rejected', async () => {
    const e = await setup();
    const mallory = await makeIdent();
    const victim = e.user.did;
    const payload = { consentId: 'c-forged', userDid: victim, relayId: R, channel: 'push', status: 'granted', grantedAtClaim: e.relay.clock.iso(), expiresAt: '2027-11-04T10:00:00.000Z' };
    const forged = await mallory.sign(CHANNEL_CONSENT_STATEMENT, payload, 1, null, e.relay.clock.iso());
    expect(code(await e.relay.cmd('notify.channel.register', { statement: forged }, { actor: e.relayActor }))).toBe('VALIDATION_FAILED');
    expect(code(await e.relay.cmd('notify.channel.register', { statement: forged }, { actor: ANONYMOUS }))).toBe('UNAUTHENTICATED');
    expect(await dumpOf(e.relay)).toEqual([]);
    // Unsubscribe can only withdraw: on a granted consent it withdraws, on a withdrawn one it stays withdrawn.
    const c = val<Out>(await optIn(e, 'email'));
    await pump(e);
    const token = await e.mint(c.consentId);
    expect((val<{ status: string }>(await e.relay.cmd('notify.channel.unsubscribe', { token }, { actor: ANONYMOUS }))).status).toBe('withdrawn');
    expect((await dumpOf(e.relay))[0]?.status).toBe('withdrawn');
    // A late grant statement replayed at the relay does not revive it.
    const grant = (await vaultSync(e))[0]?.envelope;
    expect((val<{ status: string }>(await e.relay.cmd('notify.channel.register', { statement: grant }, { actor: e.relayActor }))).status).toBe('withdrawn');
    expect((await dumpOf(e.relay))[0]?.status).toBe('withdrawn');
    // A relay-signed grant is never accepted by the vault; a withdrawal only from the relay that holds the consent.
    const fresh = val<Out>(await optIn(e, 'push'));
    const relayGrant = await e.relayIdent.sign(CHANNEL_CONSENT_STATEMENT, { consentId: 'x', userDid: victim, relayId: R, channel: 'push', status: 'granted', grantedAtClaim: e.vault.clock.iso(), expiresAt: '2027-11-04T10:00:00.000Z' }, 1, null, e.vault.clock.iso());
    expect(code(await e.vault.cmd('test.relay.statement', { statement: relayGrant }, { actor: e.actor }))).toBe('FORBIDDEN');
    const fakeWithdraw = await mallory.sign(CHANNEL_CONSENT_STATEMENT, { consentId: fresh.consentId, userDid: victim, relayId: R, channel: 'push', status: 'withdrawn', grantedAtClaim: e.vault.clock.iso(), expiresAt: '2027-11-04T10:00:00.000Z', withdrawnAtClaim: e.vault.clock.iso(), withdrawnVia: 'relay_policy' }, 2, null, e.vault.clock.iso());
    expect(code(await e.vault.cmd('test.relay.statement', { statement: fakeWithdraw }, { actor: e.actor }))).toBe('FORBIDDEN');
    expect((await mineOf(e)).find(i => i.id === fresh.consentId)?.status).toBe('granted');
  });

  it('TEST-PS-107-09.T07 register twice, unsubscribe twice, and a vault offline during relay unsubscribe applies the relay withdrawal on the next sync', async () => {
    const e = await setup();
    const c = val<Out>(await optIn(e, 'email'));
    const stmt = (await vaultSync(e))[0]?.envelope;
    const r1 = val<{ consentId: string; status: string; relayRegisteredAt: string }>(await e.relay.cmd('notify.channel.register', { statement: stmt }, { actor: e.relayActor }));
    e.relay.clock.advance(1000);
    const r2 = val<{ consentId: string; status: string; relayRegisteredAt: string }>(await e.relay.cmd('notify.channel.register', { statement: stmt }, { actor: e.relayActor }));
    expect(r2).toMatchObject({ consentId: r1.consentId, status: 'granted', relayRegisteredAt: r1.relayRegisteredAt });
    expect(await dumpOf(e.relay)).toHaveLength(1);
    const token = await e.mint(c.consentId);
    const u1 = await e.relay.cmd('notify.channel.unsubscribe', { token }, { actor: ANONYMOUS });
    const u2 = await e.relay.cmd('notify.channel.unsubscribe', { token }, { actor: ANONYMOUS });
    expect(val(u1)).toEqual({ channel: 'email', status: 'withdrawn' });
    expect(val(u2)).toEqual({ channel: 'email', status: 'withdrawn' });
    const relayRow = (await dumpOf(e.relay))[0];
    expect(relayRow).toMatchObject({ status: 'withdrawn', withdrawnVia: 'unsubscribe_link' });
    expect(relayRow?.revision).toBe(3); // register, token mint, one withdrawal; the second click wrote nothing
    expect(await relaySync(e)).toHaveLength(1); // exactly one relay-signed withdrawal queued for the vault
    // The vault was offline: it still shows granted until it applies the relay-signed statement.
    expect((await mineOf(e))[0]?.status).toBe('granted');
    const queued = (await relaySync(e))[0]?.envelope;
    expect((await verify(queued)).author).toBe(e.relayIdent.did);
    expect(val<{ status: string }>(await e.vault.cmd('test.relay.statement', { statement: queued }, { actor: e.actor })).status).toBe('withdrawn');
    expect((await mineOf(e))[0]).toMatchObject({ status: 'withdrawn', withdrawnVia: 'unsubscribe_link' });
    expect(e.vault.events.filter(x => x.type === 'notify.channel.opted_out')).toHaveLength(1);
    expect(val<{ status: string }>(await e.vault.cmd('test.relay.statement', { statement: queued }, { actor: e.actor })).status).toBe('withdrawn');
    expect(e.vault.events.filter(x => x.type === 'notify.channel.opted_out')).toHaveLength(1);
    // An unsubscribe for an expired consent is refused detail-free.
    const c2 = val<Out>(await optIn(e, 'push'));
    await pump(e);
    const t2 = await e.mint(c2.consentId);
    e.relay.clock.advance(366 * 86_400_000);
    expect(code(await e.relay.cmd('notify.channel.unsubscribe', { token: t2 }, { actor: ANONYMOUS }))).toBe('NOTIFY_UNSUBSCRIBE_TOKEN_INVALID');
  });

  it('TEST-PS-107-09.T08 token guessing run of 10 000 attempts never succeeds and no token reaches the logs', async () => {
    const e = await setup();
    const c = val<Out>(await optIn(e, 'email'));
    await pump(e);
    const token = await e.mint(c.consentId);
    const guesses: string[] = [];
    for (let i = 0; i < 10_000; i++) guesses.push(encodeBase64url(new Uint8Array(32).map((_, j) => (i * 31 + j * 7 + (i >> 8)) & 255)));
    let successes = 0;
    for (const g of guesses) { const r = await e.relay.cmd('notify.channel.unsubscribe', { token: g }, { actor: ANONYMOUS }); if (r.ok) successes++; }
    expect(successes).toBe(0);
    expect((await dumpOf(e.relay))[0]?.status).toBe('granted');
    const real = await e.relay.cmd('notify.channel.unsubscribe', { token }, { actor: ANONYMOUS });
    expect(code(real)).toBe('ok');
    const logs = e.relay.logs.lines().join('\n') + JSON.stringify(e.relay.audit);
    expect(logs).not.toContain(token);
    expect(logs).not.toContain(guesses[0] as string);
    expect(logs).not.toContain(await sha256Hex(token));
  }, 20_000);

  it('TEST-PS-107-09.T09 a send gate on the exported consent check sends nothing with no consent, withdrawn consent or expired consent', async () => {
    const e = await setup();
    const sent: string[] = [];
    e.relay.registry.add(defineQuery({ name: 'test.gate.allowed', module: 'F99.S01.M01', capability: 'test.gate.allowed', input: z.strictObject({ userDid: z.string(), channel: z.enum(['push', 'email']) }),
      handler: (ctx, i) => ok({ allowed: hasActiveConsent(ctx.tx, i.userDid, R, i.channel, ctx.clock.now()) }) }));
    e.relay.registry.add(defineCommand({ name: 'test.sweep.run', module: 'F99.S01.M01', capability: 'test.sweep.run', idempotent: false, input: z.strictObject({}), handler: ctx => ok({ swept: e.rdefs.sweepExpiredConsents(ctx) }) }));
    const gate = async (channel: 'push' | 'email') => { const r = await e.relay.ask('test.gate.allowed', { userDid: e.user.did, channel }, { actor: e.relayActor }); if (r.ok && (r.value.value as { allowed: boolean }).allowed) sent.push(channel); };
    await gate('push'); await gate('email');
    expect(sent).toEqual([]); // no consent record at all
    const push = val<Out>(await optIn(e, 'push'));
    val<Out>(await optIn(e, 'email'));
    expect(await pump(e)).toEqual(['ok', 'ok']);
    await gate('push'); await gate('email');
    expect(sent).toEqual(['push', 'email']); // the gate is open for granted, unexpired consent
    sent.length = 0;
    const rev = (await mineOf(e)).find(i => i.id === push.consentId)?.revision ?? 0;
    await e.vault.cmd('notify.channel.opt_out', { consentId: push.consentId, expectedRevision: rev }, { actor: e.actor });
    await pump(e);
    await gate('push');
    expect(sent).toEqual([]); // withdrawn
    await gate('email');
    expect(sent).toEqual(['email']);
    sent.length = 0;
    e.relay.clock.advance(366 * 86_400_000);
    await gate('email');
    expect(sent).toEqual([]); // expired, refused before the sweep has run
    expect(val<{ swept: number }>(await e.relay.cmd('test.sweep.run', {}, { actor: e.relayActor })).swept).toBe(1);
    expect((await dumpOf(e.relay)).map(r => r.status).sort()).toEqual(['expired', 'withdrawn']);
    expect(e.relay.events.filter(x => x.type === 'notify.channel.opted_out').map(x => (x.payload as { via: string }).via)).toEqual(['expired']);
  });
});
