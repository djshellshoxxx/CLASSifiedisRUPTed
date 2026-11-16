import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { canonicalJson, defineCommand, defineQuery, ok, sha256Hex, z, type SignedEnvelope } from '@classrup/kernel';
import { createTestKernel } from '@classrup/kernel/testing';
import { goodsDefinitions, TAXONOMY_PACK_TYPE, readTaxonomyView, type PackEntry } from '../goods/index.ts';
import {
  RULE_PACK_TYPE, categoryPolicyFrom, evaluateRules, expireEmergencyRules, normalizeText, prohibitedDefinitions, readRuleSetView, ruleChanged, ruleEntrySchema, ruleRepo, rulePayloadSchema, packRepo,
  stateRepo, trustRepo, type RuleData, type RuleEntry, type RuleLike, type VerifiedRuleStatement,
} from './index.ts';
import { collectAll } from '../goods/index.ts';

const PK1 = 'did:key:z6MkPublisherOneAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const PK2 = 'did:key:z6MkPublisherTwoBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
const AT = '2026-11-04T10:00:00.000Z';
const DAY = 86_400_000;
const PROPOSAL = '0192f3b2-0000-7000-8000-000000000001';

async function sign(author: string, type: string, payload: unknown, seq = 1, prev: string | null = null): Promise<SignedEnvelope> {
  const sig = await sha256Hex(`${author}|${type}|${canonicalJson(payload)}`);
  return { cid: `sha256-${sig.slice(0, 40)}`, type, author, payload, seq, prev, sig };
}
async function verify(envelope: unknown): Promise<VerifiedRuleStatement> {
  const e = envelope as { cid: string; type: string; author: string; payload: unknown; sig: string };
  const sig = await sha256Hex(`${e.author}|${e.type}|${canonicalJson(e.payload)}`);
  if (sig !== e.sig || e.cid !== `sha256-${sig.slice(0, 40)}`) throw new Error('bad signature');
  return { type: e.type, author: e.author, cid: e.cid, payload: e.payload };
}
const hex = (n: number) => n.toString(16).padStart(12, '0');
const cid = (n: number) => `0192f3a4-2222-7000-8000-${hex(n)}`;
const ELECTRONICS = cid(1);
const PHONES = cid(2);
const ALCOHOL = cid(3);
const OLD_PHONES = cid(4);
const TAXONOMY: PackEntry[] = [
  { id: ELECTRONICS, key: 'electronics', depth: 1, names: { en: 'Electronics' }, restricted: false, status: 'active', sortOrder: 0 },
  { id: PHONES, key: 'phones', parentId: ELECTRONICS, depth: 2, names: { en: 'Phones' }, restricted: false, status: 'active', sortOrder: 0 },
  { id: ALCOHOL, key: 'alcohol', depth: 1, names: { en: 'Alcohol' }, restricted: true, restrictedReasonKey: 'policy.restricted.alcohol', status: 'active', sortOrder: 1 },
  { id: OLD_PHONES, key: 'old_phones', parentId: ELECTRONICS, depth: 2, names: { en: 'Old phones' }, restricted: false, status: 'retired', mergedInto: PHONES, sortOrder: 1 },
];

function entry(key: string, over: Partial<RuleEntry> = {}): RuleEntry {
  return { ruleKey: key, version: 1, categoryIds: [], keywords: ['replica'], matchMode: 'whole_word', action: 'block', kinds: [], jurisdictionProfileIds: [], reasonKey: 'policy.test', sensitive: false, proposalId: PROPOSAL, ...over };
}
const payloadOf = (publisherId: string, version: number, rules: RuleEntry[], over: Record<string, unknown> = {}) => ({ publisherId, version, fullSnapshot: true, changelogEntry: `v${version}`, releasedAt: AT, rules, ...over });
const packFrom = (author: string, version: number, rules: RuleEntry[], over: Record<string, unknown> = {}) => sign(author, RULE_PACK_TYPE, payloadOf(author, version, rules, over), version);

interface Opts { publisher?: string; approved?: string[] }
async function vault(o: Opts = {}) {
  const k = createTestKernel();
  const signed: SignedEnvelope[] = [];
  const spy = { verifyCalls: 0 };
  const approved = new Set(o.approved ?? [PROPOSAL]);
  const defs = prohibitedDefinitions({
    localPublisherId: () => o.publisher,
    signPack: async (type, payload, seq, prev) => { const e = await sign(o.publisher ?? PK1, type, payload, seq, prev); signed.push(e); return e; },
    verifyPack: async (e) => { spy.verifyCalls += 1; return verify(e); },
    proposalApproved: (id) => approved.has(id),
  });
  const goods = goodsDefinitions({ localPublisherId: () => undefined, signPack: async () => { throw new Error('unused'); }, verifyPack: verify, proposalApproved: () => false });
  const dump = defineQuery({
    name: 'ruletest.state.dump', module: 'F18.S01.M02', capability: 'ruletest.state.read', input: z.strictObject({}),
    handler: (ctx) => ok({ rules: collectAll(ctx.tx.repo(ruleRepo)), packs: collectAll(ctx.tx.repo(packRepo)), trust: collectAll(ctx.tx.repo(trustRepo)), state: collectAll(ctx.tx.repo(stateRepo)) }),
  });
  const sweep = defineCommand({ name: 'ruletest.emergency.sweep', module: 'F18.S01.M02', capability: 'ruletest.emergency.sweep', idempotent: false, input: z.strictObject({}), handler: (ctx) => { const r = expireEmergencyRules(ctx); return r.ok ? ok(r.value) : r; } });
  const views: { rules: ReturnType<typeof readRuleSetView>; taxonomy: ReturnType<typeof readTaxonomyView> }[] = [];
  const view = defineQuery({ name: 'ruletest.view.read', module: 'F18.S01.M02', capability: 'ruletest.view.read', input: z.strictObject({}), handler: (ctx) => { views.push({ rules: readRuleSetView(ctx.tx), taxonomy: readTaxonomyView(ctx.tx) }); return ok(null); } });
  k.registry.add(...defs.all, ...goods.all, dump, sweep, view);
  const taxonomy = await sign(PK1, TAXONOMY_PACK_TYPE, { publisherId: PK1, version: 1, fullSnapshot: true, changelogEntry: 'seed', releasedAt: AT, categories: TAXONOMY }, 1);
  const t = await k.cmd('governance.category.apply_pack', { envelope: taxonomy, provenance: { receivedAt: AT }, trustPublisher: true });
  if (!t.ok) throw new Error(`taxonomy: ${t.error.code}`);
  const cmd = (name: string, input: unknown, opts?: Parameters<typeof k.cmd>[2]) => k.cmd(name, input, opts);
  const val = async (name: string, input: unknown) => { const r = await k.cmd(name, input); if (!r.ok) throw new Error(`${name}: ${r.error.code}`); return r.value.value as Record<string, any>; };
  const dumpAll = async () => { const r = await k.ask('ruletest.state.dump', {}); if (!r.ok) throw new Error('dump'); return r.value.value as Record<string, any[]>; };
  const apply = (envelope: SignedEnvelope, trustPublisher?: boolean) => k.cmd('governance.prohibited_rule.apply_pack', { envelope, provenance: { originRelay: 'relay:berlin.example', receivedAt: AT }, ...(trustPublisher === undefined ? {} : { trustPublisher }) });
  const code = (r: Awaited<ReturnType<typeof cmd>>) => (r.ok ? 'OK' : r.error.code);
  const evaluate = async (input: Record<string, unknown>) => { const r = await k.ask('governance.prohibited_rule.evaluate', { kind: 'sell', categoryId: PHONES, title: 'Used phone', ...input }); if (!r.ok) throw new Error(`evaluate: ${r.error.code}`); return r.value.value as { verdict: string; matches: { ruleKey: string; action: string; reasonKey: string; noticeId?: string }[]; rulesetVersion: number }; };
  const draft = (key: string, over: Record<string, unknown> = {}) => cmd('governance.prohibited_rule.draft', { ruleKey: key, categoryIds: [], keywords: ['replica'], matchMode: 'whole_word', action: 'block', kinds: [], jurisdictionProfileIds: [], reasonKey: 'policy.test', ...over });
  const release = (expected: number, over: Record<string, unknown> = {}) => cmd('governance.prohibited_rule.release_pack', { expectedPackVersion: expected, proposalId: PROPOSAL, changelogEntry: 'change', relayIds: [], ...over });
  return { k, defs, signed, spy, cmd, val, dumpAll, apply, code, evaluate, draft, release, views };
}

describe('governance.prohibited_rule authoring (PS-146)', () => {
  it('TEST-PS-146-09.T01 drafting a valid rule stores an immutable version; a rule with 51 keywords is rejected with the documented code', async () => {
    const v = await vault({ publisher: PK1 });
    const first = await v.val('governance.prohibited_rule.draft', { ruleKey: 'counterfeit_goods', categoryIds: [], keywords: ['Fake Designer', 'REPLICA'], matchMode: 'whole_word', action: 'block', kinds: ['sell'], jurisdictionProfileIds: [], reasonKey: 'policy.counterfeit' });
    expect(first).toMatchObject({ revision: 1, version: 1, status: 'draft' });
    const stored = (await v.dumpAll())['rules']![0]!.data as RuleData;
    expect(stored).toMatchObject({ ruleKey: 'counterfeit_goods', keywords: ['fake designer', 'replica'], status: 'draft', version: 1, publisherId: PK1 });
    const tooMany = await v.draft('too_many', { keywords: Array.from({ length: 51 }, (_, i) => `keyword number ${i}`) });
    expect(v.code(tooMany)).toBe('VALIDATION_FAILED');
    expect((await v.dumpAll())['rules']).toHaveLength(1);
    // Release, then a change is a new version; the released version stays untouched.
    await v.val('governance.prohibited_rule.release_pack', { expectedPackVersion: 0, proposalId: PROPOSAL, changelogEntry: 'one', relayIds: [] });
    const activeBefore = (await v.dumpAll())['rules']!.find((r) => r.data.status === 'active')!;
    const second = await v.val('governance.prohibited_rule.draft', { ruleKey: 'counterfeit_goods', categoryIds: [], keywords: ['replica', 'knockoff'], matchMode: 'whole_word', action: 'block', kinds: [], jurisdictionProfileIds: [], reasonKey: 'policy.counterfeit' });
    expect(second['version']).toBe(2);
    expect(second['ruleId']).not.toBe(activeBefore.id);
    expect((await v.dumpAll())['rules']!.find((r) => r.id === activeBefore.id)).toEqual(activeBefore);
  });

  it('TEST-PS-146-09.T02 violating each rule V01-V09 returns the documented code; nothing is released or applied', async () => {
    const v = await vault({ publisher: PK1 });
    // V01, V02, V04 (shape rules) on draft.
    for (const over of [{ ruleKey: 'ab' }, { ruleKey: 'UPPER_KEY' }, { ruleKey: 'k'.repeat(41) }, { reasonKey: '' }, { reasonKey: 'Bad Key' }]) expect(v.code(await v.draft('valid_key', over)), JSON.stringify(over)).toBe('VALIDATION_FAILED');
    expect(v.code(await v.draft('no_scope', { keywords: [], categoryIds: [] }))).toBe('VALIDATION_FAILED');
    for (const keywords of [['x'], ['y'.repeat(61)], [' - '], Array.from({ length: 51 }, (_, i) => `kw ${i}`)]) expect(v.code(await v.draft('bad_words', { keywords }))).toBe('VALIDATION_FAILED');
    expect(v.code(await v.draft('bad_action', { action: 'delete' }))).toBe('VALIDATION_FAILED');
    expect(v.code(await v.draft('no_notice', { action: 'review' }))).toBe('VALIDATION_FAILED');
    expect(v.code(await v.draft('no_notice2', { action: 'allow_with_notice' }))).toBe('VALIDATION_FAILED');
    // V03: unknown category scope; a retired category resolves through mergedInto and is accepted.
    expect(v.code(await v.draft('bad_scope', { categoryIds: [cid(999)] }))).toBe('GOVERNANCE_RULE_SCOPE_INVALID');
    expect(v.code(await v.draft('retired_scope', { categoryIds: [OLD_PHONES], keywords: [] }))).toBe('OK');
    // V06: emergency must be review-level and at most 7 days.
    const soon = new Date(v.k.clock.now() + DAY).toISOString();
    expect(v.code(await v.draft('emerg_block', { emergencyUntil: soon }))).toBe('GOVERNANCE_RULE_EMERGENCY_INVALID');
    expect(v.code(await v.draft('emerg_long', { action: 'review', noticeId: 'notice.scam', emergencyUntil: new Date(v.k.clock.now() + 7 * DAY + 1).toISOString() }))).toBe('GOVERNANCE_RULE_EMERGENCY_INVALID');
    expect(v.code(await v.draft('emerg_past', { action: 'review', noticeId: 'notice.scam', emergencyUntil: new Date(v.k.clock.now() - 1).toISOString() }))).toBe('GOVERNANCE_RULE_EMERGENCY_INVALID');
    // V05: activation needs a verified approved proposal.
    expect(v.code(await v.release(0, { proposalId: undefined }))).toBe('GOVERNANCE_RULE_PROPOSAL_REQUIRED');
    expect(v.code(await v.release(0, { proposalId: '0192f3b2-0000-7000-8000-0000000000ff' }))).toBe('GOVERNANCE_RULE_PROPOSAL_REQUIRED');
    expect((await v.dumpAll())['packs']).toEqual([]);
    expect(v.signed).toEqual([]);
    expect((await v.dumpAll())['rules']!.every((r) => r.data.status === 'draft')).toBe(true);
    // V07/V09 on a user vault: bad signature, more than 2 000 rules, stale and non-snapshot packs.
    const user = await vault();
    const tampered = await packFrom(PK1, 1, [entry('some_rule')]);
    (tampered['payload'] as { changelogEntry: string }).changelogEntry = 'edited';
    expect(user.code(await user.apply(tampered, true))).toBe('GOVERNANCE_RULE_PACK_REJECTED');
    const many = await packFrom(PK1, 1, Array.from({ length: 2001 }, (_, i) => entry(`rule_${i}`, { keywords: [`phrase ${i}`] })));
    expect(user.code(await user.apply(many, true))).toBe('GOVERNANCE_RULE_PACK_REJECTED');
    const wrongType = await sign(PK1, 'classrup.governance.rule_pack/v2', payloadOf(PK1, 1, [entry('some_rule')]));
    expect(user.code(await user.apply(wrongType, true))).toBe('UNSUPPORTED_SCHEMA_VERSION');
    expect((await user.dumpAll())['packs']).toEqual([]);
    expect((await user.apply(await packFrom(PK1, 5, [entry('some_rule')]), true)).ok).toBe(true);
    expect(user.code(await user.apply(await packFrom(PK1, 5, [entry('some_rule'), entry('other_rule', { keywords: ['other'] })])))).toBe('GOVERNANCE_RULE_PACK_REJECTED');
    expect(user.code(await user.apply(await packFrom(PK1, 4, [entry('some_rule')])))).toBe('GOVERNANCE_RULE_PACK_REJECTED');
    expect(user.code(await user.apply(await packFrom(PK1, 6, [entry('some_rule')], { fullSnapshot: false })))).toBe('GOVERNANCE_RULE_PACK_REJECTED');
    expect((await user.dumpAll())['rules']).toHaveLength(1);
    // V08: evaluation input over 8 000 code points; 100 000 is refused before matching.
    for (const size of [8001, 100_000]) {
      const r = await user.k.ask('governance.prohibited_rule.evaluate', { kind: 'sell', categoryId: PHONES, title: 'ok', description: 'd'.repeat(size) });
      expect(r.ok ? 'OK' : r.error.code).toBe('VALIDATION_FAILED');
    }
    expect((await user.k.ask('governance.prohibited_rule.evaluate', { kind: 'sell', categoryId: PHONES, title: 't', description: 'd'.repeat(7998) })).ok).toBe(true);
  });

  it('TEST-PS-146-09.T03 verdicts are deterministic and stable under look-alike, zero-width, case and diacritic obfuscation; whole-word mode avoids substring matches', () => {
    const rules: RuleLike[] = [
      { status: 'active', ruleKey: 'counterfeit_goods', categoryIds: [], keywords: ['replica', 'fake designer'], matchMode: 'whole_word', action: 'block', kinds: [], jurisdictionProfileIds: [], reasonKey: 'policy.counterfeit' },
      { status: 'active', ruleKey: 'asbestos_notice', categoryIds: [], keywords: ['ass'], matchMode: 'whole_word', action: 'review', kinds: [], jurisdictionProfileIds: [], reasonKey: 'policy.ass', noticeId: 'notice.ass' },
    ];
    const input = (fields: string[]) => ({ kind: 'sell', categoryPath: new Set<string>(), profiles: new Set<string>(), fields, nowMs: Date.parse(AT) });
    const idScope = (id: string) => id;
    const filler = fc.array(fc.constantFrom('bike', 'used', 'good shape', 'classic', 'pass', 'glass', 'phone', 'table', 'the', 'new'), { maxLength: 6 });
    const seed = fc.record({ before: filler, after: filler, hit: fc.constantFrom('replica', 'fake designer', null) });
    const obfuscate = (s: string, picks: number[]): string => {
      let out = ''; let i = 0;
      for (const ch of s) {
        const p = picks[i++ % picks.length]!;
        let c = ch;
        if (c === 'a' && p % 4 === 0) c = 'а'; // Cyrillic a
        else if (c === 'e' && p % 4 === 1) c = 'é';
        else if (c === 'o' && p % 4 === 2) c = 'ο'; // Greek omicron
        else if (/[a-z]/.test(c) && p % 5 === 0) c = c.toUpperCase();
        out += c;
        if (c !== ' ' && p % 3 === 0) out += '​';
      }
      return out;
    };
    fc.assert(fc.asyncProperty(seed, fc.array(fc.nat(), { minLength: 1, maxLength: 8 }), async (s, picks) => {
      const title = [...s.before, ...(s.hit ? [s.hit] : []), ...s.after].join(' ');
      const clean = await evaluateRules(rules, input([title]), idScope);
      const dirty = await evaluateRules(rules, input([obfuscate(title, picks)]), idScope);
      expect(dirty).toEqual(clean);
      expect(await evaluateRules([...rules].reverse(), input([title]), idScope)).toEqual(clean);
      expect(clean.verdict === 'block').toBe(s.hit !== null);
      expect(clean.matches.some((m) => m.ruleKey === 'asbestos_notice')).toBe(false); // "classic", "glass", "pass" never match "ass"
    }), { numRuns: 300 }).then(async () => {
      const phraseRule: RuleLike = { ...rules[1]!, matchMode: 'phrase' };
      expect((await evaluateRules([phraseRule], input(['a classic chair']), idScope)).verdict).toBe('review');
      expect((await evaluateRules([rules[1]!], input(['a classic chair']), idScope)).verdict).toBe('allow');
      expect(normalizeText('R​ерlica!')).toBe('replica');
    });
  });
});

describe('governance.prohibited_rule packs and evaluation (PS-146)', () => {
  const releaseCounterfeit = async (pub: Awaited<ReturnType<typeof vault>>) => {
    await pub.val('governance.prohibited_rule.draft', { ruleKey: 'counterfeit_goods', categoryIds: [], keywords: ['fake designer', 'replica'], matchMode: 'whole_word', action: 'block', kinds: [], jurisdictionProfileIds: [], reasonKey: 'policy.counterfeit' });
    await pub.val('governance.prohibited_rule.draft', { ruleKey: 'used_electronics_notice', categoryIds: [ELECTRONICS], keywords: [], matchMode: 'whole_word', action: 'allow_with_notice', noticeId: 'notice.used_electronics', kinds: ['sell'], jurisdictionProfileIds: [], reasonKey: 'policy.used_electronics' });
    return pub.val('governance.prohibited_rule.release_pack', { expectedPackVersion: 0, proposalId: PROPOSAL, changelogEntry: 'Add rules', relayIds: ['relay:berlin.example'] });
  };

  it('TEST-PS-146-09.T05 an emergency rule that passes its expiry is ignored by evaluation, retired by the sweep and announced', async () => {
    const pub = await vault({ publisher: PK1 });
    const until = new Date(pub.k.clock.now() + 7 * DAY).toISOString();
    await pub.val('governance.prohibited_rule.draft', { ruleKey: 'new_scam_wave', categoryIds: [], keywords: ['crypto giveaway'], matchMode: 'whole_word', action: 'review', noticeId: 'notice.scam', kinds: [], jurisdictionProfileIds: [], reasonKey: 'policy.scam', emergencyUntil: until });
    await pub.val('governance.prohibited_rule.release_pack', { expectedPackVersion: 0, changelogEntry: 'Emergency', relayIds: [] }); // no proposal: emergency
    expect((await pub.evaluate({ title: 'Crypto giveaway now' })).verdict).toBe('review');
    pub.k.clock.advance(7 * DAY - 1);
    expect((await pub.evaluate({ title: 'Crypto giveaway now' })).verdict).toBe('review');
    pub.k.clock.advance(1);
    expect((await pub.evaluate({ title: 'Crypto giveaway now' })).verdict).toBe('allow'); // honoured before any sweep
    expect((await pub.dumpAll())['rules']![0]!.data.status).toBe('active');
    const swept = await pub.val('ruletest.emergency.sweep', {});
    expect(swept).toEqual(['new_scam_wave']);
    expect((await pub.dumpAll())['rules']![0]!.data.status).toBe('retired');
    const events = pub.k.events.filter((e) => e.type === 'governance.prohibited_rule.changed').map((e) => (e.payload as { change: string }).change);
    expect(events).toEqual(['activated', 'emergency_expired']);
    expect(await pub.val('ruletest.emergency.sweep', {})).toEqual([]);
    // A block-level emergency rule and a sixth emergency rule are refused.
    for (let i = 0; i < 6; i++) await pub.draft(`emergency_${i}`, { action: 'review', noticeId: 'notice.scam', keywords: [`scam ${i}`], emergencyUntil: new Date(pub.k.clock.now() + DAY).toISOString() });
    expect(pub.code(await pub.cmd('governance.prohibited_rule.release_pack', { expectedPackVersion: 1, changelogEntry: 'six', relayIds: [] }))).toBe('GOVERNANCE_RULE_EMERGENCY_INVALID');
  });

  it('TEST-PS-146-09.T06 release, apply and evaluate: pack validates against rule_pack/v1, signature verifies, results carry no matched text, events validate', async () => {
    const pub = await vault({ publisher: PK1 });
    const user = await vault();
    const release = await releaseCounterfeit(pub);
    expect(release).toMatchObject({ packVersion: 1, activeRuleCount: 2, syncState: 'prepared' });
    const envelope = pub.signed[0]!;
    const verified = await verify(envelope);
    expect(verified.type).toBe(RULE_PACK_TYPE);
    const payload = rulePayloadSchema.parse(verified.payload);
    expect(payload.rules.every((r) => ruleEntrySchema.safeParse(r).success)).toBe(true);
    expect((await pub.k.storage.read((tx) => tx.sync.list({ state: 'prepared' }))).map((s) => s.destination)).toEqual(['relay:berlin.example']);
    const applied = await user.apply(envelope, true);
    expect(applied.ok && applied.value.value).toMatchObject({ applied: true, packVersion: 1 });
    const text = 'Fake designer bag replica, barely used';
    const result = await user.evaluate({ title: text });
    expect(result).toMatchObject({ verdict: 'block', rulesetVersion: 1, matches: [{ ruleKey: 'counterfeit_goods', action: 'block', reasonKey: 'policy.counterfeit' }, { ruleKey: 'used_electronics_notice', action: 'allow_with_notice' }] });
    expect(JSON.stringify(result)).not.toMatch(/designer|replica|barely/i);
    const phone = await user.evaluate({ title: 'Used phone', categoryId: PHONES });
    expect(phone).toMatchObject({ verdict: 'allow_with_notice', matches: [{ ruleKey: 'used_electronics_notice', noticeId: 'notice.used_electronics' }] });
    expect((await user.evaluate({ title: 'Used phone', categoryId: PHONES, kind: 'wanted' })).verdict).toBe('allow'); // kind scope
    expect((await user.evaluate({ title: 'Used phone', categoryId: ALCOHOL })).verdict).toBe('allow'); // category scope
    expect((await user.evaluate({ title: 'Old phone', categoryId: OLD_PHONES })).verdict).toBe('allow_with_notice'); // retired category follows mergedInto
    const events = user.k.events.filter((e) => e.type === 'governance.prohibited_rule.changed');
    expect(events).toHaveLength(2);
    for (const e of events) { expect(ruleChanged.payload.safeParse(e.payload).success).toBe(true); expect(e).toMatchObject({ privacy: 'P0', payload: { change: 'activated', rulesetVersion: 1, publisherId: PK1 } }); }
    const listed = await user.k.ask('governance.prohibited_rule.list_active', { limit: 1 });
    expect(listed.ok && listed.value.value).toMatchObject({ rulesetVersion: 1, items: [{ ruleKey: expect.any(String) }], nextCursor: expect.any(String) });
    const got = await user.k.ask('governance.prohibited_rule.get', { ruleKey: 'counterfeit_goods' });
    expect(got.ok && (got.value.value as { rule: RuleData }).rule).toMatchObject({ status: 'active', provenance: { packCid: envelope.cid } });
    expect((await user.k.ask('governance.prohibited_rule.get', { ruleKey: 'nope_rule' })).ok).toBe(false);
    expect(user.code(await user.cmd('governance.prohibited_rule.draft', { ruleKey: 'x_rule', keywords: ['abc'], matchMode: 'phrase', action: 'block', reasonKey: 'policy.x' }))).toBe('FORBIDDEN');
  });

  it('TEST-PS-146-09.T09 replaying a release yields one packCid; packs applied concurrently with evaluate are seen as the old or the new pack only', async () => {
    const pub = await vault({ publisher: PK1 });
    await pub.val('governance.prohibited_rule.draft', { ruleKey: 'counterfeit_goods', categoryIds: [], keywords: ['replica'], matchMode: 'whole_word', action: 'block', kinds: [], jurisdictionProfileIds: [], reasonKey: 'policy.counterfeit' });
    const input = { expectedPackVersion: 0, proposalId: PROPOSAL, changelogEntry: 'one', relayIds: ['relay:a'] };
    const key = '0192f3a4-0000-7000-8000-000000000092';
    const a = await pub.k.cmd('governance.prohibited_rule.release_pack', input, { idempotencyKey: key });
    const b = await pub.k.cmd('governance.prohibited_rule.release_pack', input, { idempotencyKey: key });
    expect(a.ok && b.ok && a.value.value).toEqual(b.ok && b.value.value);
    expect(pub.signed).toHaveLength(1);
    expect(await pub.k.storage.read((tx) => tx.sync.list({}))).toHaveLength(1);
    expect(pub.k.events.filter((e) => e.type === 'governance.prohibited_rule.changed')).toHaveLength(1);
    expect(pub.code(await pub.cmd('governance.prohibited_rule.release_pack', input))).toBe('CONFLICT_REVISION');

    const user = await vault();
    const v1 = await packFrom(PK1, 1, [entry('rule_one', { keywords: ['alpha'] })]);
    const v2 = await packFrom(PK1, 2, [entry('rule_one', { keywords: ['alpha'] }), entry('rule_two', { keywords: ['beta'] })]);
    const text = 'alpha beta';
    const outcomes = await Promise.all([user.apply(v1, true), user.evaluate({ title: text }), user.apply(v2), user.evaluate({ title: text }), user.apply(v1), user.evaluate({ title: text })]);
    const consistent = new Set(['0:allow:', '1:block:rule_one', '2:block:rule_one,rule_two']);
    for (const o of [outcomes[1], outcomes[3], outcomes[5]] as Awaited<ReturnType<typeof user.evaluate>>[]) {
      expect(consistent.has(`${o.rulesetVersion}:${o.verdict}:${o.matches.map((m) => m.ruleKey).join(',')}`), JSON.stringify(o)).toBe(true);
    }
    expect(outcomes[4]!.ok).toBe(true); // replay of v1 is idempotent by packCid
    expect((await user.dumpAll())['packs']!.filter((p) => p.data.version === 1)).toHaveLength(1);
    expect(user.k.events.filter((e) => e.type === 'governance.prohibited_rule.changed' && (e.payload as { ruleKey: string }).ruleKey === 'rule_one')).toHaveLength(1);
  });

  it('TEST-PS-146-09.T11 evaluation stores and logs no listing text or keywords; sensitive keywords appear only as hashes in the public pack and mirrors', async () => {
    const pub = await vault({ publisher: PK1 });
    const user = await vault();
    await pub.val('governance.prohibited_rule.draft', { ruleKey: 'harmful_term', categoryIds: [], keywords: ['zorbulax'], matchMode: 'whole_word', action: 'block', kinds: [], jurisdictionProfileIds: [], reasonKey: 'policy.harmful', sensitive: true });
    await pub.val('governance.prohibited_rule.draft', { ruleKey: 'public_term', categoryIds: [], keywords: ['replica'], matchMode: 'whole_word', action: 'block', kinds: [], jurisdictionProfileIds: [], reasonKey: 'policy.counterfeit' });
    await pub.val('governance.prohibited_rule.release_pack', { expectedPackVersion: 0, proposalId: PROPOSAL, changelogEntry: 'one', relayIds: [] });
    const envelope = pub.signed[0]!;
    expect(JSON.stringify(envelope)).not.toContain('zorbulax');
    expect(JSON.stringify(envelope)).toContain('replica');
    await user.apply(envelope, true);
    // The sensitive rule still blocks, including through look-alike and zero-width evasion, without ever holding the plaintext.
    for (const title of ['Zorbulax for sale', 'z​orbulax', 'ZØRBULAX'.replace('Ø', 'o')]) expect((await user.evaluate({ title })).matches.map((m) => m.ruleKey)).toEqual(['harmful_term']);
    expect((await user.evaluate({ title: 'zorbulaxes are fine' })).verdict).toBe('allow');
    const secretText = 'Quirkytext listing about a unicorn saddle';
    await user.evaluate({ title: secretText, description: 'private details about plumbing', tags: ['unicorntag'] });
    for (const v of [pub, user]) {
      const everything = JSON.stringify([await v.dumpAll(), v.k.events.map((e) => e.payload), v.k.logs.records()]);
      expect(everything).not.toMatch(/zorbulax/i);
      expect(everything).not.toMatch(/quirkytext|unicorn|plumbing/i);
    }
    expect(user.k.logs.records().some((r) => r['message'] === 'prohibited_rule.evaluated' || JSON.stringify(r).includes('prohibited_rule.evaluated'))).toBe(true);
  });
});

describe('governance.prohibited_rule behaviour from the spec edge cases', () => {
  it('strictest action wins, all matches are reported up to 10, and an untrusted publisher stays pending', async () => {
    const user = await vault();
    const rules = [
      entry('allow_notice', { action: 'allow_with_notice', noticeId: 'notice.a', keywords: ['bike'] }),
      entry('review_rule', { action: 'review', noticeId: 'notice.b', keywords: ['bike'] }),
      entry('block_rule', { keywords: ['bike'] }),
      ...Array.from({ length: 12 }, (_, i) => entry(`extra_${String(i).padStart(2, '0')}`, { action: 'allow_with_notice', noticeId: 'notice.c', keywords: ['bike'] })),
    ];
    const pending = await user.apply(await packFrom(PK2, 1, rules));
    expect(pending.ok && pending.value.value).toMatchObject({ applied: false, pendingReason: 'untrusted_publisher' });
    expect((await user.evaluate({ title: 'bike' })).verdict).toBe('allow');
    expect((await user.apply(await packFrom(PK2, 1, rules), true)).ok).toBe(true);
    const r = await user.evaluate({ title: 'A bike' });
    expect(r.verdict).toBe('block');
    expect(r.matches).toHaveLength(10);
    expect(r.matches.map((m) => m.ruleKey).slice(0, 2)).toEqual(['block_rule', 'review_rule']);
  });

  it('a new version retires the previous one in the same transaction; activation needs a proposal verified by F18.S02.M01', async () => {
    const user = await vault();
    expect(user.code(await user.apply(await packFrom(PK1, 1, [entry('some_rule', { proposalId: undefined })]), true))).toBe('GOVERNANCE_RULE_PROPOSAL_REQUIRED');
    const unapproved = await vault({ approved: [] });
    expect(unapproved.code(await unapproved.apply(await packFrom(PK1, 1, [entry('some_rule')]), true))).toBe('GOVERNANCE_RULE_PROPOSAL_REQUIRED');
    expect((await unapproved.dumpAll())['rules']).toEqual([]);
    expect((await user.apply(await packFrom(PK1, 1, [entry('some_rule')]), true)).ok).toBe(true);
    expect((await user.apply(await packFrom(PK1, 2, [entry('some_rule', { version: 2, keywords: ['changed'] })]))).ok).toBe(true);
    const rows = (await user.dumpAll())['rules']!;
    expect(rows.map((r) => [r.data.version, r.data.status]).sort()).toEqual([[1, 'retired'], [2, 'active']]);
    expect(user.code(await user.apply(await packFrom(PK1, 3, [entry('some_rule', { version: 1 })])))).toBe('GOVERNANCE_RULE_PACK_REJECTED'); // downgrade
    expect((await user.apply(await packFrom(PK1, 3, []))).ok).toBe(true); // dropping a rule retires it
    expect((await user.dumpAll())['rules']!.every((r) => r.data.status === 'retired')).toBe(true);
  });

  it('adapter: a category-only block rule removes the category for new listings; the taxonomy gate fails closed', async () => {
    const user = await vault();
    await user.apply(await packFrom(PK1, 1, [entry('no_alcohol', { keywords: [], categoryIds: [ALCOHOL], reasonKey: 'policy.alcohol' }), entry('kw_only', { keywords: ['bike'] })]), true);
    await user.k.ask('ruletest.view.read', {});
    const { taxonomy, rules } = user.views.at(-1)!;
    const allowed = categoryPolicyFrom({ taxonomy: () => taxonomy, rules: () => rules, now: () => user.k.clock.now() });
    expect(allowed(PHONES)).toBe(true);
    expect(allowed(ELECTRONICS)).toBe(true);
    expect(allowed(ALCOHOL)).toBe(false);
    expect(allowed(cid(999))).toBe(false);
    expect(categoryPolicyFrom({ taxonomy: () => undefined, rules: () => rules, now: () => 0 })(PHONES)).toBe(false);
  });

  it('retire stages a retirement of an active rule and discards a draft; release then retires it', async () => {
    const pub = await vault({ publisher: PK1 });
    await pub.val('governance.prohibited_rule.draft', { ruleKey: 'to_retire', categoryIds: [], keywords: ['replica'], matchMode: 'whole_word', action: 'block', kinds: [], jurisdictionProfileIds: [], reasonKey: 'policy.x' });
    await pub.val('governance.prohibited_rule.release_pack', { expectedPackVersion: 0, proposalId: PROPOSAL, changelogEntry: 'one', relayIds: [] });
    const active = (await pub.dumpAll())['rules']![0]!;
    expect(pub.code(await pub.cmd('governance.prohibited_rule.retire', { ruleKey: 'to_retire', expectedRevision: active.revision + 5 }))).toBe('CONFLICT_REVISION');
    expect(pub.code(await pub.cmd('governance.prohibited_rule.retire', { ruleKey: 'unknown_rule', expectedRevision: 1 }))).toBe('NOT_FOUND');
    expect(await pub.val('governance.prohibited_rule.retire', { ruleKey: 'to_retire', expectedRevision: active.revision })).toEqual({ ruleKey: 'to_retire', stagedRetirement: true });
    expect((await pub.evaluate({ title: 'replica' })).verdict).toBe('block'); // still in force until released
    expect(pub.code(await pub.cmd('governance.prohibited_rule.retire', { ruleKey: 'to_retire', expectedRevision: active.revision + 1 }))).toBe('CONFLICT_STATE');
    await pub.val('governance.prohibited_rule.release_pack', { expectedPackVersion: 1, changelogEntry: 'retire', relayIds: [] });
    expect((await pub.evaluate({ title: 'replica' })).verdict).toBe('allow');
    expect(pub.k.events.filter((e) => e.type === 'governance.prohibited_rule.changed').map((e) => (e.payload as { change?: string }).change)).toEqual(['activated', 'retired']);
    await pub.val('governance.prohibited_rule.draft', { ruleKey: 'scratch_rule', categoryIds: [], keywords: ['abc'], matchMode: 'phrase', action: 'block', kinds: [], jurisdictionProfileIds: [], reasonKey: 'policy.x' });
    const scratch = (await pub.dumpAll())['rules']!.find((r) => r.data.ruleKey === 'scratch_rule')!;
    await pub.val('governance.prohibited_rule.retire', { ruleKey: 'scratch_rule', expectedRevision: scratch.revision });
    expect((await pub.dumpAll())['rules']!.find((r) => r.id === scratch.id)!.data.status).toBe('retired');
  });
});
