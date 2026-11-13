import { beforeAll, describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { canonicalJson, defineCommand, z, type Actor, type SignedEnvelope } from '@classrup/kernel';
import { createTestKernel } from '@classrup/kernel/testing';
import { createHash, generateKeyPairSync, sign as edSign, verify as edVerify, createPublicKey } from 'node:crypto';
import {
  DEFAULT_RANKING_CONFIG, DEFAULT_RANKING_PARAMS, distanceBucketBetweenCells, distanceBucketForKm, explainComponents, rankCandidates, rankingConfigDefinitions,
  rankingConfigSchema, rankingConfigVaultDefinitions, rankingStatementPayloadSchema, readRankingConfigStatement, score, toScoringConfig, type RankingConfigOptions, type ScoreContext,
} from './index.ts';

// Test-only Ed25519 signer over canonical JSON: the module itself never implements cryptography (it takes callbacks).
interface TestKey { principal: string; privateKey: ReturnType<typeof generateKeyPairSync>['privateKey']; publicDer: string; }
function makeKey(): TestKey {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicDer = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  return { principal: `did:key:z6Mk${createHash('sha256').update(publicDer).digest('hex').slice(0, 40)}`, privateKey, publicDer };
}
const cidOf = (x: unknown) => `sha256-${createHash('sha256').update(canonicalJson(x)).digest('base64url')}`;
function signEnvelope(key: TestKey, input: { type: string; payload: unknown; seq: number; prev: string | null; createdAt: string }): SignedEnvelope {
  const body = { ...input, author: key.principal, key: key.publicDer };
  const sig = edSign(null, Buffer.from(canonicalJson(body)), key.privateKey).toString('base64');
  return { ...body, sig, cid: cidOf({ ...body, sig }) };
}
async function verifyEnvelope(envelope: unknown, _opts?: unknown): Promise<{ author: string; type: string; payload: unknown; cid: string; seq: number }> {
  const { sig, cid, ...body } = envelope as { sig: string; cid: string; key: string; author: string; type: string; payload: unknown; seq: number };
  const pub = createPublicKey({ key: Buffer.from(body.key, 'base64'), format: 'der', type: 'spki' });
  if (!edVerify(null, Buffer.from(canonicalJson(body)), pub, Buffer.from(sig, 'base64'))) throw new Error('bad signature');
  if (cid !== cidOf({ ...body, sig })) throw new Error('bad cid');
  if (body.author !== `did:key:z6Mk${createHash('sha256').update(body.key).digest('hex').slice(0, 40)}`) throw new Error('author does not match key');
  return { author: body.author, type: body.type, payload: body.payload, cid, seq: body.seq };
}
let identity: TestKey;
beforeAll(() => { identity = makeKey(); });

const NOW = Date.parse('2026-11-04T10:00:00Z');
const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();
const params = (over: Record<string, unknown> = {}) => ({ ...structuredClone(DEFAULT_RANKING_PARAMS), ...over });

function setup(relayId = 'relay-a') {
  const k = createTestKernel();
  const operator: Actor = { kind: 'user', id: 'did:key:z6MkOperatorA', roles: ['operator'] };
  const operatorB: Actor = { kind: 'user', id: 'did:key:z6MkOperatorB', roles: ['operator'] };
  const member = k.user(['member']);
  const operators = new Map([[operator.kind === 'user' ? operator.id : '', 'relay-a'], [operatorB.kind === 'user' ? operatorB.id : '', 'relay-b']]);
  const options: RankingConfigOptions = {
    relayId, relayAuthor: identity.principal, isOperator: (id, relay) => operators.get(id) === relay,
    signStatement: async (type, payload, seq, prev) => ({ ...signEnvelope(identity, { type, payload, seq, prev, createdAt: iso(k.clock.now()) }) }),
    verifyStatement: e => verifyEnvelope(e, { now: k.clock.now() }),
  };
  const defs = rankingConfigDefinitions(options);
  k.registry.add(...defs.all);
  const publish = (over: Record<string, unknown> = {}, expectedActiveVersion = 1, actor: Actor = operator) => k.cmd('discovery.ranking_config.publish', { ...params(), expectedActiveVersion, ...over }, { actor });
  const active = async (includeHistory = false) => {
    const r = await k.ask('discovery.ranking_config.get_active', { includeHistory }, { actor: { kind: 'anonymous' } });
    if (!r.ok) throw new Error(r.error.code);
    return r.value.value as { active: { version: number; status: string; origin: string; id: string }; statement?: unknown; history?: { version: number; status: string; id: string }[] };
  };
  return { k, operator, operatorB, member, options, publish, active };
}
const out = (r: { ok: boolean; value?: { value: unknown } }) => (r.value as { value: { configId: string; version: number; statementCid: string } }).value;

describe('ranking config publication', () => {
  it('TEST-PS-051-09.T01 publish valid config: version 4 active, version 3 retired, exactly one active row', async () => {
    const { k, publish, active } = setup();
    for (const v of [1, 2]) expect((await publish({}, v)).ok).toBe(true);
    k.clock.advance(DAY * 2);
    const r = await publish({ recencyHalfLifeDays: 20, promotionBoost: 0.1 }, 3); 
    expect(r.ok).toBe(true);
    expect(out(r as never).version).toBe(4);
    const a = await active(true);
    expect(a.active.version).toBe(4);
    expect(a.history?.map(h => [h.version, h.status])).toEqual([[4, 'active'], [3, 'retired'], [2, 'retired'], [1, 'retired']]);
    expect(a.history?.filter(h => h.status === 'active')).toHaveLength(1);
    expect(k.events.filter(e => e.type === 'discovery.ranking_config.published').map(e => (e.payload as { version: number }).version)).toEqual([2, 3, 4]);
  });

  it('TEST-PS-051-09.T02 invalid weights sum, boost, half-life and non-monotonic distance weights are rejected and nothing is stored', async () => {
    const { k, publish, active } = setup();
    const bad: Record<string, unknown>[] = [
      { weights: { text: 0.7, recency: 0.25, distance: 0.15 } },
      { promotionBoost: 0.3 },
      { recencyHalfLifeDays: 0 },
      { distanceWeights: { lt5: 1, '5_10': 0.5, '10_25': 0.65, '25_50': 0.4, gt50: 0.2 } },
      { weights: { text: 0.95, recency: 0.03, distance: 0.02 } },
      { bm25: { titleWeight: 11, bodyWeight: 1, k: 3 } },
      { recencyHalfLifeDays: 14.5 },
      { reasonNote: 'x'.repeat(281) },
      { weights: undefined },
    ];
    for (const over of bad) {
      const r = await publish(over);
      expect(r.ok, JSON.stringify(over)).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('RANKING_CONFIG_INVALID');
    }
    const a = await active(true);
    expect(a.active.origin).toBe('bundled');
    expect(a.history).toHaveLength(1);
    expect(k.events.filter(e => e.type === 'discovery.ranking_config.published')).toHaveLength(0);
  });

  it('rollback creates a new version copying an older one and never reactivates the retired row', async () => {
    const { publish, active, k, operator } = setup();
    await publish({ recencyHalfLifeDays: 30 }, 1);
    await publish({ recencyHalfLifeDays: 7 }, 2);
    const before = await active(true);
    const r = await k.cmd('discovery.ranking_config.rollback', { targetVersion: 2, expectedActiveVersion: 3, reasonNote: 'bad half-life' }, { actor: operator });
    expect(r.ok).toBe(true);
    expect(out(r as never).version).toBe(4);
    const after = await active(true);
    expect(after.active.version).toBe(4);
    expect((after.active as unknown as { recencyHalfLifeDays: number }).recencyHalfLifeDays).toBe(30);
    expect(after.history?.find(h => h.version === 2)?.status).toBe('retired');
    expect(after.history?.find(h => h.version === 2)?.id).toBe(before.history?.find(h => h.version === 2)?.id);
    expect(after.history?.filter(h => h.status === 'active')).toHaveLength(1);
  });

  it('rollback to a version that never existed or to the active version is NOT_FOUND; stale expectedActiveVersion is CONFLICT_REVISION', async () => {
    const { publish, k, operator, active } = setup();
    await publish({}, 1);
    const rb = (targetVersion: number, expectedActiveVersion: number) => k.cmd('discovery.ranking_config.rollback', { targetVersion, expectedActiveVersion }, { actor: operator });
    const missing = await rb(9, 2); expect(!missing.ok && missing.error.code).toBe('NOT_FOUND');
    const same = await rb(2, 2); expect(!same.ok && same.error.code).toBe('NOT_FOUND');
    const stale = await rb(1, 1); expect(!stale.ok && stale.error.code).toBe('CONFLICT_REVISION');
    const stalePublish = await publish({}, 1); expect(!stalePublish.ok && stalePublish.error.code).toBe('CONFLICT_REVISION');
    expect((await active()).active.version).toBe(2);
    const fresh = setup();
    const noStore = await fresh.k.cmd('discovery.ranking_config.rollback', { targetVersion: 1, expectedActiveVersion: 1 }, { actor: fresh.operator });
    expect(!noStore.ok && noStore.error.code).toBe('NOT_FOUND');
  });
});

describe('scoring', () => {
  const ctx: ScoreContext = { now: NOW, hasText: true, hasDistance: true, promotionEnabled: true };
  const cand = (over: Record<string, unknown> = {}) => ({ documentId: 'doc-1', firstSeenAt: iso(NOW - 14 * DAY), bm25: -3, distanceBucket: '5_10', ...over });
  const s = (c: unknown, cfg = DEFAULT_RANKING_CONFIG, x = ctx) => { const r = score(c, cfg, x); if (!r.ok) throw new Error(r.error.code); return r.value; };

  it('TEST-PS-051-09.T03 golden score vectors for text, recency, distance and promotion match to six decimals; promoted multiplier never exceeds 1.25', () => {
    expect(s(cand())).toBe(0.5525);
    expect(s(cand({ promoted: true, promotedUntil: iso(NOW + DAY) }))).toBe(0.635375);
    expect(s(cand({ bm25: 0, firstSeenAt: iso(NOW), distanceBucket: 'lt5' }))).toBe(0.4);
    expect(s(cand({ bm25: -9, firstSeenAt: iso(NOW - 28 * DAY), distanceBucket: 'gt50' }))).toBe(0.5425);
    // browse query without text terms: weights renormalized to 0.625 recency and 0.375 distance
    expect(s(cand({ bm25: undefined, distanceBucket: '10_25' }), DEFAULT_RANKING_CONFIG, { ...ctx, hasText: false })).toBe(0.55625);
    // a boost above the cap cannot be applied even if a config object bypassed validation
    const rogue = { ...DEFAULT_RANKING_CONFIG, promotionBoost: 0.3 };
    expect(s(cand({ promoted: true, promotedUntil: iso(NOW + DAY) }), rogue)).toBe(0.690625);
    fc.assert(fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), fc.integer({ min: 0, max: 200 }), fc.double({ min: 0, max: 0.25, noNaN: true }), (b, age, boost) => {
      const cfg = { ...DEFAULT_RANKING_CONFIG, promotionBoost: boost };
      const plain = explainComponents(cand({ bm25: -b, firstSeenAt: iso(NOW - age * DAY) }), cfg, ctx);
      const promo = explainComponents(cand({ bm25: -b, firstSeenAt: iso(NOW - age * DAY), promoted: true, promotedUntil: iso(NOW + DAY) }), cfg, ctx);
      if (!plain.ok || !promo.ok) return false;
      return promo.value.components.multiplier <= 1.25 && promo.value.components.final <= Math.round(plain.value.components.base * 1.25 * 1e6) / 1e6 && promo.value.components.final >= plain.value.components.final;
    }), { numRuns: 200 });
  });

  it('rejects NaN, positive bm25, missing required terms and unknown fields', () => {
    for (const bad of [cand({ bm25: Number.NaN }), cand({ bm25: 2 }), cand({ bm25: undefined }), cand({ distanceBucket: undefined }), cand({ userId: 'u1' }), cand({ firstSeenAt: 'yesterday' }), cand({ distanceBucket: '1_2' })]) {
      const r = score(bad, DEFAULT_RANKING_CONFIG, ctx);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('VALIDATION_FAILED');
    }
    expect(score(cand(), DEFAULT_RANKING_CONFIG, { ...ctx, now: Number.NaN }).ok).toBe(false);
  });

  it('TEST-PS-051-09.T05 200 runs of the same ranking give identical order, ties by firstSeenAt then documentId', () => {
    const doc = fc.record({
      documentId: fc.stringMatching(/^d[0-9]{3}$/), firstSeenAt: fc.constantFrom(0, 1, 3).map(d => iso(NOW - d * DAY)),
      bm25: fc.constantFrom(0, -1, -3), distanceBucket: fc.constantFrom('lt5', '5_10', 'gt50'),
    });
    fc.assert(fc.property(fc.uniqueArray(doc, { selector: d => d.documentId, minLength: 1, maxLength: 30 }), fc.integer({ min: 1, max: 1000 }), (docs, seed) => {
      const baseline = rankCandidates(docs, DEFAULT_RANKING_CONFIG, ctx);
      if (!baseline.ok) return false;
      const shuffled = [...docs].sort((a, b) => ((a.documentId.charCodeAt(2) * seed) % 7) - ((b.documentId.charCodeAt(2) * seed) % 7) || (a.documentId < b.documentId ? 1 : -1));
      const again = rankCandidates(shuffled, DEFAULT_RANKING_CONFIG, ctx);
      if (!again.ok || again.value.map(x => x.documentId).join() !== baseline.value.map(x => x.documentId).join()) return false;
      for (let i = 1; i < baseline.value.length; i++) {
        const a = baseline.value[i - 1]!; const b = baseline.value[i]!;
        if (a.score < b.score) return false;
        if (a.score === b.score) {
          const fa = Date.parse(a.firstSeenAt); const fb = Date.parse(b.firstSeenAt);
          if (fa < fb || (fa === fb && a.documentId > b.documentId)) return false;
        }
      }
      return true;
    }), { numRuns: 200 });
  });

  it('rankCandidates rejects duplicate document ids', () => {
    const r = rankCandidates([cand(), cand()], DEFAULT_RANKING_CONFIG, ctx);
    expect(!r.ok && r.error.code).toBe('VALIDATION_FAILED');
  });

  it('TEST-PS-051-09.T09 future claimedPublishedAt gains nothing and an expired promotion gets no multiplier and no label', () => {
    const honest = explainComponents(cand(), DEFAULT_RANKING_CONFIG, ctx);
    const future = explainComponents(cand({ claimedPublishedAt: iso(NOW + 10 * DAY) }), DEFAULT_RANKING_CONFIG, ctx);
    expect(honest.ok && future.ok).toBe(true);
    if (!honest.ok || !future.ok) return;
    expect(future.value.components.recency).toBe(honest.value.components.recency);
    expect(future.value.components.ageDays).toBeCloseTo(14, 9);
    // a backdated claim can only lower recency
    const backdated = explainComponents(cand({ claimedPublishedAt: iso(NOW - 60 * DAY) }), DEFAULT_RANKING_CONFIG, ctx);
    expect(backdated.ok && backdated.value.components.recency < honest.value.components.recency).toBe(true);
    const expired = explainComponents(cand({ promoted: true, promotedUntil: iso(NOW - 1000) }), DEFAULT_RANKING_CONFIG, ctx);
    expect(expired.ok).toBe(true);
    if (!expired.ok) return;
    expect(expired.value.components.multiplier).toBe(1);
    expect(expired.value.components.final).toBe(0.5525);
    expect(expired.value.promotedLabel).toBe(false);
    expect(expired.value.explain.some(e => e.key === 'discovery.explain.promoted')).toBe(false);
    // flag without promotedUntil and promotion not sold by this index: also neither multiplier nor label
    for (const [c, x] of [[cand({ promoted: true }), ctx], [cand({ promoted: true, promotedUntil: iso(NOW + DAY) }), { ...ctx, promotionEnabled: false }]] as const) {
      const e = explainComponents(c, DEFAULT_RANKING_CONFIG, x);
      expect(e.ok && e.value.components.multiplier === 1 && !e.value.promotedLabel).toBe(true);
    }
    const live = explainComponents(cand({ promoted: true, promotedUntil: iso(NOW + DAY) }), DEFAULT_RANKING_CONFIG, ctx);
    expect(live.ok && live.value.promotedLabel && live.value.explain.some(e => e.key === 'discovery.explain.promoted')).toBe(true);
  });

  it('distance bucket helpers map kilometres through the injected region port', () => {
    expect([0, 4.99, 5, 9.99, 10, 24.9, 25, 49.9, 50, 900].map(distanceBucketForKm)).toEqual(['lt5', 'lt5', '5_10', '5_10', '10_25', '10_25', '25_50', '25_50', 'gt50', 'gt50']);
    expect(distanceBucketForKm(Number.NaN)).toBeUndefined();
    const region = { cellDistanceKm: (a: string, b: string) => (a === b ? 0 : 12) };
    expect(distanceBucketBetweenCells(region, 'c2b2', 'c2b2')).toEqual({ ok: true, value: 'lt5' });
    expect(distanceBucketBetweenCells(region, 'c2b2', 'c2b3')).toEqual({ ok: true, value: '10_25' });
    expect(distanceBucketBetweenCells(region, 'c2b2', 'NOT A CELL').ok).toBe(false);
  });
});

describe('statements, authorization and idempotency', () => {
  it('TEST-PS-051-09.T06 commands, query and event outputs validate against schemas and the statement signature verifies', async () => {
    const { k, publish, active, options } = setup();
    const r1 = await publish({}, 1); const r2 = await publish({ promotionBoost: 0.2, reasonNote: 'more promotion headroom' }, 2);
    expect(r1.ok && r2.ok).toBe(true);
    const o2 = out(r2 as never);
    expect(o2).toEqual({ configId: expect.any(String), version: 3, statementCid: expect.any(String) });
    const a = await active(true);
    expect(a.active.version).toBe(3);
    for (const h of a.history ?? []) {
      const { id: _id, revision: _rev, ...data } = h as unknown as Record<string, unknown>;
      expect(rankingConfigSchema.safeParse(data).success).toBe(true);
    }
    const read = await readRankingConfigStatement(a.statement, options.verifyStatement, { relayAuthor: identity.principal });
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(rankingStatementPayloadSchema.safeParse(read.value).success).toBe(true);
    expect(read.value).toMatchObject({ configId: o2.configId, version: 3, relayId: 'relay-a', promotionBoost: 0.2, reasonNote: 'more promotion headroom' });
    const verified = await verifyEnvelope(a.statement, { now: k.clock.now() });
    expect(verified.type).toBe('classrup.discovery.ranking_config/v1');
    expect(verified.seq).toBe(2);
    expect(verified.cid).toBe(o2.statementCid);
    const events = k.events.filter(e => e.type === 'discovery.ranking_config.published');
    expect(events).toHaveLength(2);
    expect(events[1]?.payload).toMatchObject({ configId: o2.configId, version: 3, origin: 'relay_published', relayId: 'relay-a', statementCid: o2.statementCid });
    expect(events[1]?.privacy).toBe('P0');
  });

  it('TEST-PS-051-09.T07 member publish and operator of another relay are FORBIDDEN; anonymous read is allowed', async () => {
    const { k, publish, member, operatorB, active, operator } = setup('relay-a');
    const asMember = await publish({}, 1, member); expect(!asMember.ok && asMember.error.code).toBe('FORBIDDEN');
    const asOther = await publish({}, 1, operatorB); expect(!asOther.ok && asOther.error.code).toBe('FORBIDDEN');
    const anon = await publish({}, 1, { kind: 'anonymous' }); expect(anon.ok).toBe(false);
    const rb = await k.cmd('discovery.ranking_config.rollback', { targetVersion: 1, expectedActiveVersion: 1 }, { actor: member });
    expect(!rb.ok && rb.error.code).toBe('FORBIDDEN');
    expect((await publish({}, 1, operator)).ok).toBe(true);
    const read = await k.ask('discovery.ranking_config.get_active', {}, { actor: { kind: 'anonymous' } });
    expect(read.ok).toBe(true);
    expect((await active()).active.version).toBe(2);
  });

  it('rejects a statement signed by a key other than the relay key and statements that fail verification', async () => {
    const { k, options, operator } = setup();
    const other = makeKey();
    const wrongSigner: RankingConfigOptions = { ...options, signStatement: async (type, payload, seq, prev) => ({ ...signEnvelope(other, { type, payload, seq, prev, createdAt: iso(k.clock.now()) }) }) };
    const k2 = createTestKernel(); k2.registry.add(...rankingConfigDefinitions(wrongSigner).all);
    const r = await k2.cmd('discovery.ranking_config.publish', { ...params(), expectedActiveVersion: 1 }, { actor: operator });
    expect(!r.ok && r.error.code).toBe('FORBIDDEN');
    const broken: RankingConfigOptions = { ...options, signStatement: async () => { throw new Error('hsm offline'); } };
    const k3 = createTestKernel(); k3.registry.add(...rankingConfigDefinitions(broken).all);
    const r3 = await k3.cmd('discovery.ranking_config.publish', { ...params(), expectedActiveVersion: 1 }, { actor: operator });
    expect(!r3.ok && r3.error.code).toBe('DEPENDENCY_UNAVAILABLE');
    const a = await k3.ask('discovery.ranking_config.get_active', { includeHistory: true }, { actor: { kind: 'anonymous' } });
    expect(a.ok && (a.value.value as { history: unknown[] }).history).toHaveLength(1);
  });

  it('rejects a correctly signed successor with the wrong sequence or previous CID', async () => {
    const { options, operator } = setup();
    for (const wrongField of ['seq', 'prev']) {
      const k = createTestKernel();
      const defs = rankingConfigDefinitions({
        ...options,
        signStatement: (type, payload, seq, prev) => options.signStatement(
          type, payload, seq === 2 && wrongField === 'seq' ? seq + 1 : seq,
          seq === 2 && wrongField === 'prev' ? 'different-cid' : prev,
        ),
      });
      k.registry.add(...defs.all);
      const publish = (expectedActiveVersion: number) => k.cmd(defs.publish.name, { ...params(), expectedActiveVersion }, { actor: operator });
      expect((await publish(1)).ok).toBe(true);
      expect(await publish(2)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
      expect(await k.ask(defs.getActive.name, {})).toMatchObject({ ok: true, value: { value: { active: { version: 2 } } } });
      expect(k.events).toHaveLength(1);
    }
  });

  it('TEST-PS-051-09.T08 replayed Idempotency-Key returns the original response; an aborted activation leaves exactly one active version', async () => {
    const { k, operator, options, active } = setup();
    const body = { ...params(), expectedActiveVersion: 1 };
    const key = k.ids.next();
    const first = await k.cmd('discovery.ranking_config.publish', body, { actor: operator, idempotencyKey: key });
    const replay = await k.cmd('discovery.ranking_config.publish', body, { actor: operator, idempotencyKey: key });
    expect(first.ok && replay.ok).toBe(true);
    if (!first.ok || !replay.ok) return;
    expect(replay.value.value).toEqual(first.value.value);
    expect((await active(true)).history).toHaveLength(2);
    expect(k.events.filter(e => e.type === 'discovery.ranking_config.published')).toHaveLength(1);
    // crash after the new version is inserted and the old one retired, before the transaction commits
    const interruptedPublish = rankingConfigDefinitions(options).publish;
    k.registry.add(defineCommand({ name: 'test.ranking.crash', module: 'F06.S03.M01', capability: 'test.ranking.crash', idempotent: true, input: z.strictObject({}),
      async handler(ctx) {
        const result = await interruptedPublish.handler(ctx, { ...DEFAULT_RANKING_PARAMS, expectedActiveVersion: 2 });
        if (!result.ok) return result;
        throw new Error('crash');
      } }));
    const crashed = await k.cmd('test.ranking.crash', {}, { actor: operator });
    expect(crashed).toMatchObject({ ok: false, error: { code: 'INTERNAL' } });
    const a = await active(true);
    expect(a.active.version).toBe(2);
    expect(a.history?.filter(h => h.status === 'active')).toHaveLength(1);
    expect(a.history).toHaveLength(2);
    expect(k.events.filter(e => e.type === 'discovery.ranking_config.published')).toHaveLength(1);
  });

  it('TEST-PS-051-09.T10 the 11th publication in 24 h is RATE_LIMITED and a tampered statement is rejected by the client', async () => {
    const { k, publish, active, options } = setup();
    for (let v = 1; v <= 10; v++) expect((await publish({}, v)).ok, `publication ${v}`).toBe(true);
    const eleventh = await publish({}, 11);
    expect(!eleventh.ok && eleventh.error.code).toBe('RATE_LIMITED');
    expect(!eleventh.ok && eleventh.error.retryAfterMs).toBeGreaterThan(0);
    expect((await active()).active.version).toBe(11);
    k.clock.advance(DAY - 1);
    expect(await publish({}, 11)).toMatchObject({ ok: false, error: { code: 'RATE_LIMITED', retryAfterMs: 1 } });
    k.clock.advance(1);
    expect((await publish({}, 11)).ok).toBe(true);
    const a = await active();
    const tampered = structuredClone(a.statement) as { payload: { promotionBoost: number } };
    tampered.payload.promotionBoost = 0.25;
    const bad = await readRankingConfigStatement(tampered, options.verifyStatement, { relayAuthor: identity.principal });
    expect(bad.ok).toBe(false);
    const wrongKey = await readRankingConfigStatement(a.statement, options.verifyStatement, { relayAuthor: 'did:key:z6MkSomebodyElse' });
    expect(!wrongKey.ok && wrongKey.error.code).toBe('FORBIDDEN');
  });

  it('TEST-PS-051-09.T04 random concurrent publish and rollback attempts keep exactly one active version and never reactivate a retired row', async () => {
    const op = fc.record({ kind: fc.constantFrom('publish', 'rollback'), target: fc.integer({ min: 1, max: 6 }), stale: fc.boolean(), half: fc.integer({ min: 1, max: 90 }) });
    await fc.assert(fc.asyncProperty(fc.array(fc.array(op, { minLength: 1, maxLength: 3 }), { minLength: 1, maxLength: 4 }), async batches => {
      const { k, operator, active } = setup();
      const retiredEver = new Set<string>();
      for (const batch of batches) {
        const cur = (await active()).active.version;
        await Promise.all(batch.map(o => o.kind === 'publish'
          ? k.cmd('discovery.ranking_config.publish', { ...params({ recencyHalfLifeDays: o.half }), expectedActiveVersion: o.stale ? cur + 1 : cur }, { actor: operator })
          : k.cmd('discovery.ranking_config.rollback', { targetVersion: o.target, expectedActiveVersion: o.stale ? cur + 1 : cur }, { actor: operator })));
        k.clock.advance(3 * 3_600_000);
        const a = await active(true);
        const hist = a.history ?? [a.active];
        if (hist.filter(h => h.status === 'active').length !== 1) return false;
        if (hist[0]?.status !== 'active' || hist[0].version !== Math.max(...hist.map(h => h.version))) return false;
        if (new Set(hist.map(h => h.version)).size !== hist.length) return false;
        for (const h of hist) { if (retiredEver.has(h.id) && h.status === 'active') return false; if (h.status === 'retired') retiredEver.add(h.id); }
      }
      return true;
    }), { numRuns: 15 });
  }, 60_000);
});

describe('vault', () => {
  it('always reads its bundled configuration even with relay publication records in its tenant', async () => {
    const { options, operator } = setup();
    const vault = rankingConfigVaultDefinitions();
    const relay = rankingConfigDefinitions(options);
    const k = createTestKernel({ definitions: [relay.publish, ...vault.all] });
    const publish = await k.cmd(relay.publish.name, { ...params({ recencyHalfLifeDays: 85 }), expectedActiveVersion: 1 }, { actor: operator });
    expect(publish.ok).toBe(true);
    const r = await k.ask(vault.getActive.name, { includeHistory: true });
    expect(r).toMatchObject({ ok: true, value: { value: {
      active: { version: 1, origin: 'bundled', recencyHalfLifeDays: 14 },
      history: [{ version: 1, origin: 'bundled' }],
    } } });
    if (!r.ok) throw new Error(r.error.code);
    expect(r.value.value).not.toHaveProperty('statement');
    expect(await k.ask(vault.getActive.name, {}, { actor: { kind: 'anonymous' } })).toMatchObject({
      ok: false, error: { code: 'UNAUTHENTICATED' },
    });
  });

  it('protects the nested bundled ranking parameters from accidental changes by consumers', () => {
    for (const field of ['weights', 'bm25', 'distanceWeights'] as const) {
      expect(Object.isFrozen(DEFAULT_RANKING_PARAMS[field])).toBe(true);
      expect(Object.isFrozen(DEFAULT_RANKING_CONFIG[field])).toBe(true);
    }
    expect(Reflect.set(DEFAULT_RANKING_CONFIG.weights, 'text', 0)).toBe(false);
    expect(DEFAULT_RANKING_PARAMS.weights.text).toBe(0.6);
  });

  it('TEST-PS-051-09.T12 a vault without relay config uses the bundled default and the explanation says default ranking', async () => {
    const k = createTestKernel();
    const defs = rankingConfigVaultDefinitions();
    k.registry.add(...defs.all);
    const r = await k.ask('discovery.ranking_config.get_active', { includeHistory: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const v = r.value.value as { active: { version: number; origin: string; status: string } & Record<string, unknown>; history: unknown[] };
    expect(v.active).toMatchObject({ version: 1, origin: 'bundled', status: 'active', weights: { text: 0.6, recency: 0.25, distance: 0.15 }, promotionBoost: 0.15 });
    expect(v.history).toHaveLength(1);
    const cfg = toScoringConfig(v.active as never);
    expect(cfg).toEqual(DEFAULT_RANKING_CONFIG);
    const e = explainComponents({ documentId: 'd', firstSeenAt: iso(NOW - DAY), bm25: -2, distanceBucket: 'lt5' }, cfg, { now: NOW, hasText: true, hasDistance: true, promotionEnabled: false });
    expect(e.ok && e.value.explain.map(x => x.key)).toEqual(['discovery.explain.text_match', 'discovery.explain.recent', 'discovery.explain.distance_bucket', 'discovery.explain.default_ranking']);
    // a vault registers no publication commands
    const pub = await k.cmd('discovery.ranking_config.publish', { ...params(), expectedActiveVersion: 1 });
    expect(pub.ok).toBe(false);
    expect(defs.all.map(d => d.name)).toEqual(['discovery.ranking_config.get_active']);
  });
});
