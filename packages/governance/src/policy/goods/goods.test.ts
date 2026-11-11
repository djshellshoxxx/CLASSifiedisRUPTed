import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { appError, canonicalJson, createSyncSender, defineQuery, err, isUuidV7, ok, sha256Hex, z, type SignedEnvelope } from '@classrup/kernel';
import { createTestKernel } from '@classrup/kernel/testing';
import {
  categoryAllowedFrom, categoryChanged, categoryRepo, goodsDefinitions, packEntrySchema, packPayloadSchema, packRepo, readTaxonomyView, seedTaxonomyEntries, stagedRepo, stateRepo, trustRepo,
  validateTree, TAXONOMY_PACK_TYPE, type PackEntry, type TreeNode, type VerifiedPackStatement,
} from './index.ts';
import { collectAll } from './view.ts';

const PK1 = 'did:key:z6MkPublisherOneAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const PK2 = 'did:key:z6MkPublisherTwoBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
const AT = '2026-11-04T10:00:00.000Z';
const DAY = 86_400_000;

// Deterministic stand-in for Ed25519 over JCS: the real signer is injected by the composition root.
async function sign(author: string, type: string, payload: unknown, seq = 1, prev: string | null = null): Promise<SignedEnvelope> {
  const sig = await sha256Hex(`${author}|${type}|${canonicalJson(payload)}`);
  return { cid: `sha256-${sig.slice(0, 40)}`, type, author, payload, seq, prev, sig };
}
async function verify(envelope: unknown): Promise<VerifiedPackStatement> {
  const e = envelope as { cid: string; type: string; author: string; payload: unknown; sig: string };
  const sig = await sha256Hex(`${e.author}|${e.type}|${canonicalJson(e.payload)}`);
  if (sig !== e.sig || e.cid !== `sha256-${sig.slice(0, 40)}`) throw new Error('bad signature');
  return { type: e.type, author: e.author, cid: e.cid, payload: e.payload };
}

const hex = (n: number) => n.toString(16).padStart(12, '0');
const cid = (n: number) => `0192f3a4-2222-7000-8000-${hex(n)}`;
function cat(n: number, over: Partial<PackEntry> = {}): PackEntry {
  return { id: cid(n), key: `cat_${n}`, depth: 1, names: { en: `Category ${n}` }, restricted: false, status: 'active', sortOrder: n % 1000, ...over };
}
function payloadOf(publisherId: string, version: number, categories: PackEntry[], over: Record<string, unknown> = {}) {
  return { publisherId, version, fullSnapshot: true, changelogEntry: `v${version}`, releasedAt: AT, categories, ...over };
}
const packFrom = (author: string, version: number, categories: PackEntry[], over: Record<string, unknown> = {}) => sign(author, TAXONOMY_PACK_TYPE, payloadOf(author, version, categories, over), version);

interface VaultOptions { publisher?: string; approved?: string[] }
function vault(o: VaultOptions = {}) {
  const k = createTestKernel();
  const signed: SignedEnvelope[] = [];
  const spy = { verifyCalls: 0 };
  const approved = new Set(o.approved ?? []);
  const defs = goodsDefinitions({
    localPublisherId: () => o.publisher,
    signPack: async (type, payload, seq, prev) => { const e = await sign(o.publisher ?? PK1, type, payload, seq, prev); signed.push(e); return e; },
    verifyPack: async (e) => { spy.verifyCalls += 1; return verify(e); },
    proposalApproved: (proposalId, categoryId) => approved.has(`${proposalId}:${categoryId}`),
  });
  const dump = defineQuery({
    name: 'goodstest.state.dump', module: 'F18.S01.M03', capability: 'goodstest.state.read', input: z.strictObject({}),
    handler: (ctx) => ok({
      staged: collectAll(ctx.tx.repo(stagedRepo)), mirror: collectAll(ctx.tx.repo(categoryRepo)), packs: collectAll(ctx.tx.repo(packRepo)),
      trust: collectAll(ctx.tx.repo(trustRepo)), state: collectAll(ctx.tx.repo(stateRepo)),
    }),
  });
  k.registry.add(...defs.all, dump);
  const cmd = async (name: string, input: unknown, opts?: Parameters<typeof k.cmd>[2]) => k.cmd(name, input, opts);
  const val = async (name: string, input: unknown) => { const r = await k.cmd(name, input); if (!r.ok) throw new Error(`${name}: ${r.error.code}`); return r.value.value as Record<string, any>; };
  const dumpAll = async () => { const r = await k.ask('goodstest.state.dump', {}); if (!r.ok) throw new Error('dump'); return r.value.value as Record<string, any[]>; };
  const apply = (envelope: SignedEnvelope, trustPublisher?: boolean) =>
    k.cmd('governance.category.apply_pack', { envelope, provenance: { originRelay: 'relay:berlin.example', receivedAt: AT }, ...(trustPublisher === undefined ? {} : { trustPublisher }) });
  const code = (r: Awaited<ReturnType<typeof cmd>>) => (r.ok ? 'OK' : r.error.code);
  return { k, defs, signed, spy, cmd, val, dumpAll, apply, code };
}
const names = (en: string, more: Record<string, string> = {}) => ({ en, ...more });

describe('governance.category authoring (PS-144)', () => {
  it('TEST-PS-144-09.T01 create category with names and key: stable id, key unique for the publisher, en name required', async () => {
    const v = vault({ publisher: PK1 });
    const first = await v.val('governance.category.create', { key: 'road_bikes', names: names('Road bikes', { de: 'Rennraeder' }) });
    expect(isUuidV7(first['categoryId'])).toBe(true);
    expect(first['revision']).toBe(1);
    expect(first['stagedInPack']).toBe(1);
    const child = await v.val('governance.category.create', { key: 'gravel', parentId: first['categoryId'], names: names('Gravel') });
    expect(child['categoryId']).not.toBe(first['categoryId']);
    const dup = await v.cmd('governance.category.create', { key: 'road_bikes', names: names('Other') });
    expect(v.code(dup)).toBe('VALIDATION_FAILED');
    expect(v.code(await v.cmd('governance.category.create', { key: 'no_english', names: { de: 'Nur deutsch' } }))).toBe('VALIDATION_FAILED');
    const staged = (await v.dumpAll())['staged']!;
    expect(staged.map((r) => r.id).sort()).toEqual([first['categoryId'], child['categoryId']].sort());
    expect(staged.find((r) => r.id === child['categoryId'])!.data).toMatchObject({ depth: 2, parentId: first['categoryId'], publisherId: PK1, restricted: false, status: 'active' });
  });

  it('TEST-PS-144-09.T02 violating each rule V01-V10 returns the documented code and nothing is staged or applied', async () => {
    const author = vault({ publisher: PK1 });
    const root = await author.val('governance.category.create', { key: 'root', names: names('Root') });
    let parent = root['categoryId'] as string;
    const chain = [parent];
    for (let d = 2; d <= 4; d++) { parent = (await author.val('governance.category.create', { key: `level_${d}`, parentId: parent, names: names(`L${d}`) }))['categoryId']; chain.push(parent); }
    const stagedBefore = (await author.dumpAll())['staged']!.length;
    // V01 key format and uniqueness; V02 names (en, 1..60 code points, no control characters).
    for (const key of ['A', 'x', 'UPPER', 'has space', 'a'.repeat(41)]) expect(author.code(await author.cmd('governance.category.create', { key, names: names('X') }))).toBe('VALIDATION_FAILED');
    expect(author.code(await author.cmd('governance.category.create', { key: 'root', names: names('Dup') }))).toBe('VALIDATION_FAILED');
    for (const bad of [{ de: 'x' }, { en: '' }, { en: 'x'.repeat(61) }, { en: 'bad\u0007name' }, { en: 'ok', 'not a locale': 'x' }]) expect(author.code(await author.cmd('governance.category.create', { key: 'names_bad', names: bad }))).toBe('VALIDATION_FAILED');
    // V03 depth 5 is refused; V04 children limit (50 per parent).
    expect(author.code(await author.cmd('governance.category.create', { key: 'too_deep', parentId: chain[3], names: names('Deep') }))).toBe('GOVERNANCE_CATEGORY_TREE_INVALID');
    expect(author.code(await author.cmd('governance.category.create', { key: 'orphan', parentId: cid(999), names: names('Orphan') }))).toBe('NOT_FOUND');
    const wide = vault({ publisher: PK1 });
    const top = (await wide.val('governance.category.create', { key: 'top', names: names('Top') }))['categoryId'];
    for (let i = 0; i < 50; i++) await wide.val('governance.category.create', { key: `child_${i}`, parentId: top, names: names(`C${i}`) });
    expect(wide.code(await wide.cmd('governance.category.create', { key: 'child_50', parentId: top, names: names('C50') }))).toBe('GOVERNANCE_CATEGORY_TREE_INVALID');
    // V05 retire needs a non-retired merge target; V06 restricted flag needs a verified proposal.
    const second = (await author.val('governance.category.create', { key: 'second', names: names('Second') }))['categoryId'];
    const secondRev = 1;
    expect(author.code(await author.cmd('governance.category.set_status', { categoryId: second, expectedRevision: secondRev, to: 'retired' }))).toBe('GOVERNANCE_CATEGORY_TREE_INVALID');
    expect(author.code(await author.cmd('governance.category.set_status', { categoryId: second, expectedRevision: secondRev, to: 'retired', mergedInto: second }))).toBe('GOVERNANCE_CATEGORY_TREE_INVALID');
    expect(author.code(await author.cmd('governance.category.create', { key: 'restricted_one', names: names('R'), restricted: true, restrictedReasonKey: 'policy.restricted.test' }))).toBe('GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED');
    expect(author.code(await author.cmd('governance.category.update', { categoryId: second, expectedRevision: secondRev, restricted: true, restrictedReasonKey: 'policy.restricted.test', proposalId: cid(5000) }))).toBe('GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED');
    expect((await author.dumpAll())['staged']!.length).toBe(stagedBefore + 1); // only "second" was staged
    expect((await author.dumpAll())['mirror']!.length).toBe(0);

    // V03 (pack side), V04 (2 000), V05, V09 and V08: a user vault trusts PK1 and applies broken packs.
    const user = vault();
    const good = await user.apply(await packFrom(PK1, 1, [cat(1), cat(2, { parentId: cid(1), depth: 2 })]), true);
    expect(good.ok).toBe(true);
    const mirrorBefore = (await user.dumpAll())['mirror']!;
    const eventsBefore = user.k.events.length;
    const broken: [string, Record<string, unknown>, string][] = [
      ['depth 5', { categories: [cat(1), cat(2, { parentId: cid(1), depth: 2 }), cat(3, { parentId: cid(2), depth: 3 }), cat(4, { parentId: cid(3), depth: 4 }), cat(5, { parentId: cid(4), depth: 5 })] }, 'VALIDATION_FAILED'],
      ['parent missing', { categories: [cat(1), cat(2, { parentId: cid(77), depth: 2 })] }, 'GOVERNANCE_CATEGORY_TREE_INVALID'],
      ['cycle', { categories: [cat(1), cat(2, { parentId: cid(3), depth: 2 }), cat(3, { parentId: cid(2), depth: 2 })] }, 'GOVERNANCE_CATEGORY_TREE_INVALID'],
      ['wrong depth', { categories: [cat(1), cat(2, { parentId: cid(1), depth: 3 })] }, 'GOVERNANCE_CATEGORY_TREE_INVALID'],
      ['51 children', { categories: [cat(1), ...Array.from({ length: 51 }, (_, i) => cat(10 + i, { parentId: cid(1), depth: 2 }))] }, 'GOVERNANCE_CATEGORY_TREE_INVALID'],
      ['retire without target', { categories: [cat(1), cat(2, { parentId: cid(1), depth: 2, status: 'retired' })] }, 'GOVERNANCE_CATEGORY_TREE_INVALID'],
      ['retire into retired', { categories: [cat(1), cat(2, { parentId: cid(1), depth: 2, status: 'retired', mergedInto: cid(3) }), cat(3, { parentId: cid(1), depth: 2, status: 'retired', mergedInto: cid(2) })] }, 'GOVERNANCE_CATEGORY_TREE_INVALID'],
      ['duplicate key', { categories: [cat(1), cat(2, { key: 'cat_1' })] }, 'VALIDATION_FAILED'],
      ['id reuse with other key', { categories: [cat(1), cat(2, { parentId: cid(1), depth: 2, key: 'renamed_key' })] }, 'GOVERNANCE_CATEGORY_TREE_INVALID'],
      ['dropped id', { categories: [cat(1)] }, 'GOVERNANCE_CATEGORY_TREE_INVALID'],
      ['restricted without reason', { categories: [cat(1), cat(2, { parentId: cid(1), depth: 2, restricted: true })] }, 'VALIDATION_FAILED'],
    ];
    for (const [label, over, expected] of broken) {
      const envelope = await packFrom(PK1, 2, [], { ...over });
      expect(user.code(await user.apply(envelope)), label).toBe(expected);
    }
    // V08 stale and non-snapshot packs.
    expect(user.code(await user.apply(await packFrom(PK1, 1, [cat(1), cat(2, { parentId: cid(1), depth: 2, names: names('Changed') })])))).toBe('GOVERNANCE_CATEGORY_PACK_STALE');
    expect(user.code(await user.apply(await packFrom(PK1, 2, [cat(1), cat(2, { parentId: cid(1), depth: 2 })], { fullSnapshot: false })))).toBe('GOVERNANCE_CATEGORY_PACK_STALE');
    // V07 tampered pack: signature failure; an untrusted publisher stays pending (edge case) and is not applied.
    const tampered = await packFrom(PK1, 2, [cat(1), cat(2, { parentId: cid(1), depth: 2 }), cat(3)]);
    (tampered['payload'] as { changelogEntry: string }).changelogEntry = 'edited after signing';
    expect(user.code(await user.apply(tampered))).toBe('GOVERNANCE_CATEGORY_PACK_UNTRUSTED');
    // V10 unsupported schema version and oversized pack.
    const v2 = await sign(PK1, 'classrup.governance.taxonomy_pack/v2', payloadOf(PK1, 2, [cat(1), cat(2, { parentId: cid(1), depth: 2 })]), 2);
    expect(user.code(await user.apply(v2))).toBe('UNSUPPORTED_SCHEMA_VERSION');
    const huge = await packFrom(PK1, 2, [cat(1), cat(2, { parentId: cid(1), depth: 2 })], { changelogEntry: 'x'.repeat(100) });
    (huge as Record<string, unknown>)['padding'] = 'p'.repeat(1_100_000);
    expect(user.code(await user.apply(huge))).toBe('UNSUPPORTED_SCHEMA_VERSION');
    expect((await user.dumpAll())['mirror']!.map((r) => [r.id, r.revision])).toEqual(mirrorBefore.map((r) => [r.id, r.revision]));
    expect(user.k.events.length).toBe(eventsBefore);
    expect((await user.dumpAll())['packs']!.filter((p) => p.data.version === 2)).toEqual([]);
  });

  it('TEST-PS-144-09.T03 random trees and moves keep depth <= 4, no cycles, child limit and restricted-implies-reason', async () => {
    const opArb = fc.oneof(
      fc.record({ t: fc.constant('create' as const), parent: fc.option(fc.nat(30), { nil: undefined }), restricted: fc.boolean() }),
      fc.record({ t: fc.constant('move' as const), id: fc.nat(30), parent: fc.option(fc.nat(30), { nil: undefined }) }),
    );
    await fc.assert(fc.asyncProperty(fc.array(opArb, { maxLength: 14 }), async (ops) => {
      const v = vault({ publisher: PK1 });
      const created: string[] = [];
      let n = 0;
      const rev = async (id: string) => (await v.dumpAll())['staged']!.find((r) => r.id === id)!.revision;
      for (const op of ops) {
        if (op.t === 'create') {
          const parentId = op.parent === undefined || created.length === 0 ? undefined : created[op.parent % created.length];
          const r = await v.cmd('governance.category.create', { key: `k_${n++}`, names: names('N'), ...(parentId ? { parentId } : {}), ...(op.restricted ? { restricted: true, restrictedReasonKey: 'policy.restricted.x', proposalId: cid(1) } : {}) });
          if (r.ok) created.push((r.value.value as Record<string, string>)['categoryId']!);
          else expect(['GOVERNANCE_CATEGORY_TREE_INVALID', 'GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED']).toContain(r.error.code);
        } else if (created.length > 0) {
          const id = created[op.id % created.length]!;
          const newParentId = op.parent === undefined ? undefined : created[op.parent % created.length];
          const r = await v.cmd('governance.category.move', { categoryId: id, expectedRevision: await rev(id), ...(newParentId ? { newParentId } : {}) });
          if (!r.ok) expect(['GOVERNANCE_CATEGORY_TREE_INVALID']).toContain(r.error.code);
        }
        const staged = (await v.dumpAll())['staged']!;
        const byId = new Map(staged.map((r) => [r.id, r.data]));
        const perParent = new Map<string, number>();
        for (const [id, d] of byId) {
          expect(d.depth).toBeGreaterThanOrEqual(1);
          expect(d.depth).toBeLessThanOrEqual(4);
          let cursor = d; let hops = 1;
          while (cursor.parentId) { cursor = byId.get(cursor.parentId)!; expect(cursor).toBeDefined(); hops += 1; expect(hops).toBeLessThanOrEqual(4); }
          expect(hops).toBe(d.depth);
          if (d.restricted) expect(d.restrictedReasonKey).toBeTruthy();
          perParent.set(d.parentId ?? 'root', (perParent.get(d.parentId ?? 'root') ?? 0) + 1);
          expect(id).toBeTruthy();
        }
        for (const c of perParent.values()) expect(c).toBeLessThanOrEqual(50);
      }
    }), { numRuns: 200 });
    // validateTree against an independent oracle on arbitrary (including cyclic and over-deep) graphs.
    const nodeArb = fc.record({ parent: fc.option(fc.nat(9), { nil: undefined }), depth: fc.integer({ min: 1, max: 4 }), restricted: fc.boolean(), reason: fc.boolean() });
    fc.assert(fc.property(fc.array(nodeArb, { minLength: 1, maxLength: 10 }), (raw) => {
      const nodes: TreeNode[] = raw.map((r, i) => ({ id: cid(i), key: `key_${i}`, parentId: r.parent === undefined || r.parent >= raw.length ? undefined : cid(r.parent), depth: r.depth, status: 'active', restricted: r.restricted, ...(r.reason ? { restrictedReasonKey: 'policy.restricted.x' } : {}) }));
      const oracle = (): boolean => {
        for (const n of nodes) {
          if (n.restricted && !n.restrictedReasonKey) return false;
          let hops = 1; let cur: TreeNode | undefined = n; const seen = new Set<string>();
          while (cur?.parentId) { if (seen.has(cur.id)) return false; seen.add(cur.id); cur = nodes.find((x) => x.id === cur!.parentId); if (!cur) return false; hops += 1; if (hops > 5) return false; }
          if (hops !== n.depth) return false;
        }
        return true;
      };
      expect(validateTree(nodes).ok).toBe(oracle());
    }), { numRuns: 300 });
  }, 60_000);

  it('TEST-PS-144-09.T04 random status changes follow only declared transitions; retired needs mergedInto and never reverts', async () => {
    const opArb = fc.oneof(
      fc.record({ t: fc.constant('status' as const), id: fc.nat(3), to: fc.constantFrom('deprecated', 'active', 'retired') as fc.Arbitrary<'deprecated' | 'active' | 'retired'>, target: fc.nat(3) }),
      fc.record({ t: fc.constant('wait' as const), days: fc.integer({ min: 1, max: 40 }) }),
    );
    const allowed = new Set(['active>deprecated', 'deprecated>active', 'deprecated>retired', 'active>retired']);
    await fc.assert(fc.asyncProperty(fc.array(opArb, { maxLength: 16 }), async (ops) => {
      const v = vault({ publisher: PK1 });
      const ids: string[] = [];
      for (let i = 0; i < 4; i++) ids.push((await v.val('governance.category.create', { key: `s_${i}`, names: names(`S${i}`) }))['categoryId']);
      const status = new Map(ids.map((id) => [id, 'active']));
      const everRetired = new Set<string>();
      for (const op of ops) {
        if (op.t === 'wait') { v.k.clock.advance(op.days * DAY); continue; }
        const id = ids[op.id]!;
        const rev = (await v.dumpAll())['staged']!.find((r) => r.id === id)!.revision;
        const mergedInto = op.to === 'retired' ? ids[op.target] : undefined;
        const r = await v.cmd('governance.category.set_status', { categoryId: id, expectedRevision: rev, to: op.to, ...(mergedInto ? { mergedInto } : {}) });
        const from = status.get(id)!;
        if (r.ok) {
          expect(allowed.has(`${from}>${op.to}`)).toBe(true);
          if (op.to === 'retired') {
            const row = (await v.dumpAll())['staged']!.find((x) => x.id === id)!.data;
            expect(row.mergedInto).toBeTruthy();
            expect(status.get(row.mergedInto)).not.toBe('retired');
            everRetired.add(id);
          }
          status.set(id, op.to);
        } else {
          expect(['CONFLICT_STATE', 'GOVERNANCE_CATEGORY_TREE_INVALID']).toContain(r.error.code);
          if (!allowed.has(`${from}>${op.to}`)) expect(r.error.code).toBe('CONFLICT_STATE');
        }
        for (const retired of everRetired) expect(status.get(retired)).toBe('retired');
      }
    }), { numRuns: 200 });
  }, 60_000);
});

describe('governance.category packs (PS-144)', () => {
  it('TEST-PS-144-09.T05 a pack with one invalid category is rejected as a whole; the previous version stays active', async () => {
    const user = vault();
    const base = Array.from({ length: 20 }, (_, i) => cat(i + 1));
    expect((await user.apply(await packFrom(PK1, 1, base), true)).ok).toBe(true);
    const eventsAfterV1 = user.k.events.length;
    const next = base.map((c) => ({ ...c, names: names(`Renamed ${c.key}`) }));
    next[19] = { ...next[19]!, depth: 3, parentId: cid(1) }; // wrong depth for its parent
    expect(user.code(await user.apply(await packFrom(PK1, 2, next)))).toBe('GOVERNANCE_CATEGORY_TREE_INVALID');
    const tree = await user.k.ask('governance.category.tree', {});
    expect(tree.ok && tree.value.value).toMatchObject({ packVersion: 1 });
    expect((tree.ok ? (tree.value.value as { items: { names: { en: string } }[] }).items : []).every((i) => i.names.en.startsWith('Category'))).toBe(true);
    expect(user.k.events.length).toBe(eventsAfterV1);
    expect((await user.dumpAll())['packs']!.map((p) => p.data.version)).toEqual([1]);
  });

  it('TEST-PS-144-09.T06 release and apply: pack validates against taxonomy_pack/v1, signature verifies, changed events validate', async () => {
    const pub = vault({ publisher: PK1 });
    const user = vault();
    const root = (await pub.val('governance.category.create', { key: 'bikes', names: names('Bikes', { de: 'Fahrraeder' }) }))['categoryId'];
    await pub.val('governance.category.create', { key: 'road_bikes', parentId: root, names: names('Road bikes') });
    const release = await pub.val('governance.category.release_pack', { expectedPackVersion: 0, changelogEntry: 'Initial', relayIds: ['relay:berlin.example'] });
    expect(release).toMatchObject({ packVersion: 1, categoryCount: 2, syncState: 'prepared' });
    const envelope = pub.signed[0]!;
    expect(envelope.cid).toBe(release['packCid']);
    const verified = await verify(envelope);
    expect(verified.type).toBe(TAXONOMY_PACK_TYPE);
    const payload = packPayloadSchema.parse(verified.payload);
    expect(payload.categories.every((c) => packEntrySchema.safeParse(c).success)).toBe(true);
    const queued = await pub.k.storage.read((tx) => tx.sync.list({ state: 'prepared' }));
    expect(queued.map((q) => [q.destination, q.envelope.cid])).toEqual([['relay:berlin.example', envelope.cid]]);
    const pubEvents = pub.k.events.filter((e) => e.type === 'governance.category.changed');
    expect(pubEvents).toHaveLength(2);

    const applied = await user.apply(envelope, true);
    expect(applied.ok && applied.value.value).toMatchObject({ applied: true, packVersion: 1 });
    const events = user.k.events.filter((e) => e.type === 'governance.category.changed');
    expect(events).toHaveLength(2);
    for (const e of events) {
      expect(categoryChanged.payload.safeParse(e.payload).success).toBe(true);
      expect(e).toMatchObject({ type: 'governance.category.changed', privacy: 'P0', payload: { change: 'created', packVersion: 1, publisherId: PK1 } });
    }
    const got = await user.k.ask('governance.category.get', { categoryId: root });
    expect(got.ok && (got.value.value as { category: Record<string, unknown> }).category).toMatchObject({ key: 'bikes', publisherId: PK1, packVersion: 1, provenance: { packCid: envelope.cid, originRelay: 'relay:berlin.example' } });
    const resolved = await user.k.ask('governance.category.resolve', { categoryId: root });
    expect(resolved.ok && resolved.value.value).toMatchObject({ resolvedId: root, path: [root], restricted: false });
    // Own mirror in the publisher vault carries the same content.
    expect(((await pub.dumpAll())['mirror']!).map((r) => r.id).sort()).toEqual(((await user.dumpAll())['mirror']!).map((r) => r.id).sort());
  });

  it('TEST-PS-144-09.T08 non-publisher authoring is FORBIDDEN; an untrusted publisher stays pending; tampered or mis-signed packs are rejected', async () => {
    const stranger = vault();
    for (const [name, input] of [
      ['governance.category.create', { key: 'sneaky', names: names('Sneaky') }],
      ['governance.category.update', { categoryId: cid(1), expectedRevision: 1, names: names('X') }],
      ['governance.category.move', { categoryId: cid(1), expectedRevision: 1 }],
      ['governance.category.set_status', { categoryId: cid(1), expectedRevision: 1, to: 'deprecated' }],
      ['governance.category.release_pack', { expectedPackVersion: 0, changelogEntry: 'x', relayIds: [] }],
    ] as const) expect(stranger.code(await stranger.cmd(name, input))).toBe('FORBIDDEN');
    expect((await stranger.dumpAll())['staged']).toEqual([]);

    const user = vault();
    const pk2Pack = await packFrom(PK2, 1, [cat(1)]);
    const pending = await user.apply(pk2Pack);
    expect(pending.ok && pending.value.value).toMatchObject({ applied: false, packVersion: 1, changedCategoryIds: [], pendingReason: 'untrusted_publisher' });
    expect((await user.dumpAll())['mirror']).toEqual([]);
    expect((await user.dumpAll())['packs']!.map((p) => [p.data.publisherId, p.data.status])).toEqual([[PK2, 'pending']]);
    expect(user.k.events.filter((e) => e.type === 'governance.category.changed')).toHaveLength(0);
    // The user trusts PK2 afterwards: the same pack now applies, once.
    const trusted = await user.apply(pk2Pack, true);
    expect(trusted.ok && trusted.value.value).toMatchObject({ applied: true, changedCategoryIds: [cid(1)] });
    // A signed pack whose payload names another publisher is refused even with a valid signature.
    const forged = await sign(PK1, TAXONOMY_PACK_TYPE, payloadOf(PK2, 2, [cat(1)]), 2);
    expect(user.code(await user.apply(forged, true))).toBe('GOVERNANCE_CATEGORY_PACK_UNTRUSTED');
    const tampered = await packFrom(PK2, 2, [cat(1, { names: names('Changed') })]);
    (tampered['payload'] as { categories: PackEntry[] }).categories[0]!.restricted = true;
    expect(user.code(await user.apply(tampered, true))).toBe('GOVERNANCE_CATEGORY_PACK_UNTRUSTED');
    // A relay actor must not change the user's mirror.
    const relay = await user.k.cmd('governance.category.apply_pack', { envelope: await packFrom(PK2, 3, [cat(1)]), provenance: { receivedAt: AT } }, { actor: { kind: 'relay', id: 'relay:berlin.example', roles: ['operator'] } });
    expect(user.code(relay)).toBe('FORBIDDEN');
  });

  it('TEST-PS-144-09.T09 replaying release and apply of the same pack yields one packCid and no duplicate events', async () => {
    const pub = vault({ publisher: PK1 });
    await pub.val('governance.category.create', { key: 'only_one', names: names('Only') });
    const input = { expectedPackVersion: 0, changelogEntry: 'Initial', relayIds: ['relay:a'] };
    const key = '0192f3a4-0000-7000-8000-000000000091';
    const a = await pub.k.cmd('governance.category.release_pack', input, { idempotencyKey: key });
    const b = await pub.k.cmd('governance.category.release_pack', input, { idempotencyKey: key });
    expect(a.ok && b.ok && a.value.value).toEqual(b.ok && b.value.value);
    expect(b.ok && b.value.events).toEqual([]);
    // Same release under a new key is refused by the version check instead of producing a second pack.
    expect(pub.code(await pub.cmd('governance.category.release_pack', input))).toBe('CONFLICT_REVISION');
    expect(pub.signed).toHaveLength(1);
    expect(await pub.k.storage.read((tx) => tx.sync.list({}))).toHaveLength(1);
    expect(pub.k.events.filter((e) => e.type === 'governance.category.changed')).toHaveLength(1);

    const user = vault();
    const envelope = pub.signed[0]!;
    const first = await user.apply(envelope, true);
    const second = await user.apply(envelope, true);
    expect(first.ok && first.value.value).toMatchObject({ applied: true, changedCategoryIds: expect.any(Array) });
    expect(second.ok && second.value.value).toMatchObject({ applied: true, changedCategoryIds: [] });
    expect(user.k.events.filter((e) => e.type === 'governance.category.changed')).toHaveLength(1);
    expect((await user.dumpAll())['packs']).toHaveLength(1);
  });

  it('TEST-PS-144-09.T10 offline vault keeps its last pack; a release stays prepared while the relay is down and is acknowledged only with a receipt', async () => {
    const pub = vault({ publisher: PK1 });
    const root = (await pub.val('governance.category.create', { key: 'tools', names: names('Tools') }))['categoryId'];
    await pub.val('governance.category.release_pack', { expectedPackVersion: 0, changelogEntry: 'v1', relayIds: ['relay:down'] });
    let up = false;
    const sender = createSyncSender({
      storage: pub.k.storage, clock: pub.k.clock, random: () => 0.5,
      transport: { send: async () => (up ? ok({ receipt: { relay: 'relay:down', signed: 'receipt-1' } }) : err(appError('DEPENDENCY_UNAVAILABLE'))) },
    });
    await sender.runOnce();
    let [entry] = await pub.k.storage.read((tx) => tx.sync.list({}));
    expect(entry).toMatchObject({ state: 'prepared', receipt: null });
    expect(entry!.attempts).toBe(1);
    expect((await pub.k.ask('governance.category.get', { categoryId: root })).ok).toBe(true); // local state intact
    up = true;
    pub.k.clock.advance(60 * 60 * 1000);
    await sender.runOnce();
    [entry] = await pub.k.storage.read((tx) => tx.sync.list({}));
    expect(entry!.state).toBe('transport_acknowledged');
    expect(entry!.receipt).toMatchObject({ transport: { signed: 'receipt-1' } });

    const user = vault();
    expect((await user.apply(pub.signed[0]!, true)).ok).toBe(true);
    user.k.clock.advance(120 * DAY); // offline for months
    const tree = await user.k.ask('governance.category.tree', { locale: 'en' });
    expect(tree.ok && tree.value.value).toMatchObject({ packVersion: 1, items: [{ id: root, name: 'Tools' }] });
    const [pack] = (await user.dumpAll())['packs']!;
    expect(Date.parse(user.k.clock.iso()) - Date.parse(pack.data.appliedAt)).toBe(120 * DAY); // the UI shows the pack age
  });

  it('TEST-PS-144-09.T11 no personal data beyond the publisher fingerprint is stored or logged; oversized packs are rejected before storage', async () => {
    const pub = vault({ publisher: PK1 });
    const user = vault();
    await pub.val('governance.category.create', { key: 'books', names: names('Books') });
    await pub.val('governance.category.release_pack', { expectedPackVersion: 0, changelogEntry: 'v1', relayIds: [] });
    await user.apply(pub.signed[0]!, true);
    for (const v of [pub, user]) {
      // Stored records, event payloads and diagnostics; the kernel's own envelope actor field is outside this module.
      const everything = JSON.stringify([await v.dumpAll(), v.k.events.map((e) => e.payload), v.k.logs.records()]);
      expect(everything).not.toContain((v.k.actor as { id: string }).id);
      expect(v.k.logs.records().length).toBeGreaterThan(0);
      const dids = new Set(everything.match(/did:key:[A-Za-z0-9]+/g) ?? []);
      expect([...dids]).toEqual([PK1]); // the only identifier is the publisher key (public by design)
    }
    // 2 001 categories (under 1 MiB): rejected by the tree limit, nothing stored.
    const tooMany = await packFrom(PK1, 2, [cat(1), ...Array.from({ length: 2000 }, (_, i) => cat(100 + i, { parentId: undefined, key: `many_${i}` }))].map((c, i) => ({ ...c, id: cid(i + 1), key: `many_${i}` })));
    expect(JSON.stringify(tooMany).length).toBeLessThan(1_048_576);
    expect(user.code(await user.apply(tooMany))).toBe('GOVERNANCE_CATEGORY_TREE_INVALID');
    // 1.5 MiB: refused before verification or parsing.
    const calls = user.spy.verifyCalls;
    const big = await packFrom(PK1, 3, [cat(1)]);
    (big as Record<string, unknown>)['padding'] = 'x'.repeat(1_500_000);
    expect(user.code(await user.apply(big))).toBe('UNSUPPORTED_SCHEMA_VERSION');
    expect(user.spy.verifyCalls).toBe(calls);
    expect((await user.dumpAll())['packs']).toHaveLength(1);
  });
});

describe('governance.category behaviour from the spec edge cases', () => {
  it('retired categories resolve to their merge target; deprecated ones are hidden for new listings', async () => {
    const user = vault();
    const base = [cat(1), cat(2, { parentId: cid(1), depth: 2 }), cat(3, { parentId: cid(1), depth: 2 })];
    await user.apply(await packFrom(PK1, 1, base), true);
    await user.apply(await packFrom(PK1, 2, [base[0]!, { ...base[1]!, status: 'retired', mergedInto: cid(3) }, { ...base[2]!, status: 'deprecated' }]));
    const resolved = await user.k.ask('governance.category.resolve', { categoryId: cid(2) });
    expect(resolved.ok && resolved.value.value).toMatchObject({ categoryId: cid(2), resolvedId: cid(3), path: [cid(1), cid(3)] });
    const kids = await user.k.ask('governance.category.list_children', { parentId: cid(1) });
    expect(kids.ok && (kids.value.value as { items: unknown[] }).items).toEqual([]);
    const withDep = await user.k.ask('governance.category.list_children', { parentId: cid(1), includeDeprecated: true });
    expect(withDep.ok && (withDep.value.value as { items: { id: string }[] }).items.map((i) => i.id)).toEqual([cid(3)]);
    const events = user.k.events.filter((e) => e.type === 'governance.category.changed' && (e.payload as { packVersion: number }).packVersion === 2).map((e) => (e.payload as { change: string }).change).sort();
    expect(events).toEqual(['deprecated', 'retired']);
    // Retired is terminal: a later pack may not revive it.
    expect(user.code(await user.apply(await packFrom(PK1, 3, [base[0]!, base[1]!, { ...base[2]!, status: 'deprecated' }])))).toBe('GOVERNANCE_CATEGORY_TREE_INVALID');
  });

  it('restricted changes in a pack need a proposal verified by F18.S02.M01; the first pack from a publisher is the adoption baseline', async () => {
    const proposal = cid(7000);
    const user = vault({ approved: [`${proposal}:${cid(2)}`] });
    await user.apply(await packFrom(PK1, 1, [cat(1), cat(2, { parentId: cid(1), depth: 2 })]), true);
    const flip = (over: Partial<PackEntry>) => [cat(1), cat(2, { parentId: cid(1), depth: 2, restricted: true, restrictedReasonKey: 'policy.restricted.test', ...over })];
    expect(user.code(await user.apply(await packFrom(PK1, 2, flip({}))))).toBe('GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED');
    expect(user.code(await user.apply(await packFrom(PK1, 2, flip({ proposalId: cid(7001) }))))).toBe('GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED');
    const ok2 = await user.apply(await packFrom(PK1, 2, flip({ proposalId: proposal })));
    expect(ok2.ok).toBe(true);
    expect(user.k.events.map((e) => (e.payload as { change?: string }).change)).toContain('restricted_changed');
  });

  it('authoring: update, move (with subtree depth), deprecate then retire after 30 days, release and a second release', async () => {
    const pub = vault({ publisher: PK1, approved: [`${cid(8000)}:${cid(0)}`] });
    const a = (await pub.val('governance.category.create', { key: 'a_root', names: names('A') }))['categoryId'];
    const b = (await pub.val('governance.category.create', { key: 'b_root', names: names('B') }))['categoryId'];
    const c = (await pub.val('governance.category.create', { key: 'c_child', parentId: a, names: names('C') }))['categoryId'];
    const moved = await pub.val('governance.category.move', { categoryId: c, expectedRevision: 1, newParentId: b, sortOrder: 3 });
    expect(moved).toMatchObject({ depth: 2, revision: 2 });
    expect(pub.code(await pub.cmd('governance.category.move', { categoryId: b, expectedRevision: 1, newParentId: c }))).toBe('GOVERNANCE_CATEGORY_TREE_INVALID'); // cycle
    expect(pub.code(await pub.cmd('governance.category.move', { categoryId: c, expectedRevision: 1, newParentId: a }))).toBe('CONFLICT_REVISION');
    const renamed = await pub.val('governance.category.update', { categoryId: a, expectedRevision: 1, names: names('A renamed') });
    expect(renamed['revision']).toBe(2);
    expect(pub.code(await pub.cmd('governance.category.update', { categoryId: a, expectedRevision: 1, names: names('stale') }))).toBe('CONFLICT_REVISION');
    expect(pub.code(await pub.cmd('governance.category.update', { categoryId: cid(404), expectedRevision: 1, names: names('x') }))).toBe('NOT_FOUND');
    await pub.val('governance.category.set_status', { categoryId: a, expectedRevision: 2, to: 'deprecated' });
    expect(pub.code(await pub.cmd('governance.category.set_status', { categoryId: a, expectedRevision: 3, to: 'retired', mergedInto: b }))).toBe('CONFLICT_STATE'); // before 30 days
    pub.k.clock.advance(31 * DAY);
    expect(pub.code(await pub.cmd('governance.category.set_status', { categoryId: a, expectedRevision: 3, to: 'retired', mergedInto: b }))).toBe('OK');
    expect(pub.code(await pub.cmd('governance.category.set_status', { categoryId: a, expectedRevision: 4, to: 'active' }))).toBe('CONFLICT_STATE'); // terminal
    const r1 = await pub.val('governance.category.release_pack', { expectedPackVersion: 0, changelogEntry: 'one', relayIds: [] });
    expect(r1['packVersion']).toBe(1);
    expect(pub.code(await pub.cmd('governance.category.release_pack', { expectedPackVersion: 1, changelogEntry: 'nothing changed', relayIds: [] }))).toBe('PRECONDITION_FAILED');
    await pub.val('governance.category.update', { categoryId: b, expectedRevision: 1, names: names('B again') });
    const r2 = await pub.val('governance.category.release_pack', { expectedPackVersion: 1, changelogEntry: 'two', relayIds: [] });
    expect(r2['packVersion']).toBe(2);
    expect((await pub.dumpAll())['packs']!.map((p) => [p.data.version, p.data.status]).sort()).toEqual([[1, 'superseded'], [2, 'applied']]);
  });

  it('keeps only the last three packs, and a vault applies at most 20 packs per day', async () => {
    const user = vault();
    for (let version = 1; version <= 5; version++) expect((await user.apply(await packFrom(PK1, version, [cat(1, { names: names(`Name ${version}`) })]), true)).ok).toBe(true);
    expect((await user.dumpAll())['packs']!.map((p) => p.data.version).sort()).toEqual([3, 4, 5]);
    for (let version = 6; version <= 20; version++) expect((await user.apply(await packFrom(PK1, version, [cat(1, { names: names(`Name ${version}`) })]))).ok).toBe(true);
    expect(user.code(await user.apply(await packFrom(PK1, 21, [cat(1, { names: names('Name 21') })])))).toBe('RATE_LIMITED');
    user.k.clock.advance(DAY + 1000);
    expect(user.code(await user.apply(await packFrom(PK1, 21, [cat(1, { names: names('Name 21') })])))).toBe('OK');
  });

  it('pending packs are discarded after 30 days; at most 10 publishers are trusted', async () => {
    const user = vault();
    const other = 'did:key:z6MkPublisherThreeCCCCCCCCCCCCCCCCCCCCCCCCCCCC';
    await user.apply(await packFrom(other, 1, [cat(1)]));
    expect((await user.dumpAll())['packs']).toHaveLength(1);
    user.k.clock.advance(31 * DAY);
    await user.apply(await packFrom(PK2, 1, [cat(2)]));
    expect((await user.dumpAll())['packs']!.map((p) => p.data.publisherId)).toEqual([PK2]);
    for (let i = 0; i < 10; i++) expect((await user.apply(await packFrom(`did:key:z6MkTrusted${i}${'D'.repeat(30)}`, 1, [cat(100 + i)]), true)).ok).toBe(true);
    expect(user.code(await user.apply(await packFrom(`did:key:z6MkTrustedExtra${'E'.repeat(30)}`, 1, [cat(300)]), true))).toBe('PRECONDITION_FAILED');
  });

  it('two publishers with the same key string coexist; ids, not keys, identify categories; id reuse across publishers is rejected', async () => {
    const user = vault();
    await user.apply(await packFrom(PK1, 1, [cat(1, { key: 'shared_key' })]), true);
    expect((await user.apply(await packFrom(PK2, 1, [cat(2, { key: 'shared_key' })]), true)).ok).toBe(true);
    expect(user.code(await user.apply(await packFrom(PK2, 2, [cat(2, { key: 'shared_key' }), cat(1, { key: 'other_key' })])))).toBe('GOVERNANCE_CATEGORY_TREE_INVALID');
    const mirror = (await user.dumpAll())['mirror']!;
    expect(mirror.map((r) => [r.id, r.data.publisherId]).sort()).toEqual([[cid(1), PK1], [cid(2), PK2]]);
  });

  it('adapter: categoryAllowed is true only for active categories of the active publisher and fails closed otherwise; seed pack is a valid tree', async () => {
    const seed = seedTaxonomyEntries();
    expect(validateTree(seed).ok).toBe(true);
    expect(seed.filter((e) => e.depth === 1)).toHaveLength(12);
    const user = vault();
    const probe = defineQuery({ name: 'goodstest.view.read', module: 'F18.S01.M03', capability: 'goodstest.view.read', input: z.strictObject({}), handler: (ctx) => { views.push(readTaxonomyView(ctx.tx)); return ok(null); } });
    const views: ReturnType<typeof readTaxonomyView>[] = [];
    user.k.registry.add(probe);
    let current: ReturnType<typeof readTaxonomyView> | undefined;
    const allowed = categoryAllowedFrom(() => current);
    expect(allowed(seed[0]!.id)).toBe(false);
    await user.apply(await packFrom(PK1, 1, seed), true);
    await user.k.ask('goodstest.view.read', {});
    current = views.at(-1);
    expect(allowed(seed[0]!.id)).toBe(true);
    expect(allowed(cid(12345))).toBe(false);
    expect(allowed('not-an-id')).toBe(false);
    const next = seed.map((e, i) => (i === 1 ? { ...e, status: 'deprecated' as const } : e));
    await user.apply(await packFrom(PK1, 2, next));
    await user.k.ask('goodstest.view.read', {});
    current = views.at(-1);
    expect(allowed(seed[1]!.id)).toBe(false);
    expect(allowed(seed[2]!.id)).toBe(true);
  });
});
