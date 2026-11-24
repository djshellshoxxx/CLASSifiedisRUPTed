import { afterEach, expect, it, vi } from 'vitest';
import { createTestKernel } from '../../packages/kernel/src/testing/index.ts';
import { didFromPublicKey, type UnlockedIdentity } from '../../packages/identity/src/index.ts';
import { signEnvelope, verifyEnvelope } from '../../packages/federation/src/index.ts';
import { bazaarDefinitions } from '../../packages/bazaar/src/index.ts';
import { discoveryDefinitions } from '../../packages/discovery/src/index.ts';
import { WANT_TYPE } from '../../packages/mutiny/src/index.ts';
import type { UnlockedVault } from '../../packages/vault/src/index.ts';
import { createBarterRuntime, type BarterInputs } from '../../apps/pwa/src/barter-runtime.ts';
import { mountBarter } from '../../apps/pwa/src/barter.ts';
import { NodeStub } from '../support/node-stub.ts';

// Real Ed25519 and domain handlers; only the DOM and action/read timing are controlled.
async function realIdentity(): Promise<UnlockedIdentity> {
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']) as CryptoKeyPair;
  let locked = false;
  return {
    principal: didFromPublicKey(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))),
    sign: vi.fn(async (bytes: Uint8Array) => {
      if (locked) throw new Error('locked');
      return new Uint8Array(await crypto.subtle.sign('Ed25519', pair.privateKey, bytes.slice()));
    }),
    lock() { locked = true; },
  };
}
const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const close of cleanup.splice(0)) await close(); vi.unstubAllGlobals(); });

async function fixture() {
  const identity = await realIdentity();
  const peer = await realIdentity();
  const k = createTestKernel({ start: Date.now(), authz: { authorize: (actor, _cap, _resource, ctx) =>
    actor.kind === 'user' && actor.id === identity.principal && ctx.tenantId === identity.principal
      ? { allow: true } : { allow: false, code: 'FORBIDDEN' } } });
  const session: UnlockedVault = { principal: identity.principal, identity, storage: k.storage,
    async lock() { identity.lock(); await k.storage.close(); },
    async backupCoverage() { throw new Error('Backup is outside this fixture'); },
    async attachmentCoverage() { throw new Error('Attachment coverage is outside this fixture'); },
    async exportBackup() { throw new Error('Backup is outside this fixture'); },
    async exportAttachmentManifest() { throw new Error('Attachment manifest is outside this fixture'); },
    async verifyAttachmentManifestOwners() { throw new Error('Attachment owner reconciliation is outside this fixture'); },
    async exportAttachmentZeroRefTransition() { throw new Error('Attachment transitions are outside this fixture'); },
    async verifyAttachmentZeroRefTransition() { throw new Error('Attachment transitions are outside this fixture'); },
    async importPublicAttachmentBatch() { throw new Error('Public attachment import is outside this fixture'); },
  };
  const runtime = createBarterRuntime(session);
  const categoryId = k.ids.next();
  k.registry.add(...runtime.definitions, ...bazaarDefinitions({ categoryAllowed: id => id === categoryId,
    signProjection: async (type, payload, seq, prev) => ({ ...await signEnvelope(identity, { type, payload, seq, prev, createdAt: k.clock.iso() }) }),
    verifyProjection: envelope => verifyEnvelope(envelope, { now: k.clock.now() }),
  }).all, ...discoveryDefinitions({ verifyEnvelope: envelope => verifyEnvelope(envelope, { now: k.clock.now() }) }).all);
  const context = { actor: { kind: 'user' as const, id: identity.principal, roles: ['member'] }, tenantId: identity.principal };
  const command = async (name: string, input: unknown) => {
    const result = await k.cmd(name, input, context);
    if (!result.ok) throw new Error(result.error.code);
    return result.value.value;
  };
  const read = async (name: string, input: unknown) => {
    const result = await k.ask(name, input, context);
    if (!result.ok) throw new Error(result.error.code);
    return result.value.value;
  };
  const local: Array<{ id: string; cid: string }> = [];
  const remote: string[] = [];
  for (let i = 0; i < 2; i++) {
    const listingId = k.ids.next();
    const fields = { kind: 'sell' as const, title: `Item ${i}`, description: 'An explicitly selected barter item',
      categoryId, condition: 'good' as const, regionCell: 'c2b2q', barterOptIn: true, value: { amount: '100', currency: 'CAD' } };
    await command('bazaar.listing.create', { ...fields, listingId });
    const published = await command('bazaar.listing.publish', { listingId, expectedRevision: 1 }) as { envelope: unknown };
    local.push({ id: listingId, cid: (await verifyEnvelope(published.envelope)).cid });
    const envelope = await signEnvelope(peer, { type: 'classrup.bazaar.listing/v1', createdAt: k.clock.iso(), seq: 1, prev: null,
      payload: { ...fields, listingId: k.ids.next(), ownerId: peer.principal, revision: 1, tags: [], locale: 'en',
        availability: 'available', expiresAt: new Date(k.clock.now() + 30 * 86400000).toISOString() } });
    await command('discovery.listing.retain', { envelope }); remote.push(envelope.cid);
  }
  const nodes: NodeStub[] = [];
  vi.stubGlobal('document', { createElement(tag: string) { const n = new NodeStub(tag); nodes.push(n); return n; },
    createTextNode(text: string) { const n = new NodeStub(); n.textContent = text; return n; } });
  const queued: Array<() => Promise<void>> = [];
  const query = vi.fn(read);
  const download = vi.fn(); const message = vi.fn();
  const view = mountBarter({ container: new NodeStub('section') as unknown as HTMLElement, session, command, query,
    action: async fn => { queued.push(fn); }, download, message, refreshListings: async () => {}, setMatchingPolicy: runtime.setMatchingPolicy });
  cleanup.push(async () => { view.destroy(); peer.lock(); await session.lock(); });
  await view.refresh();
  vi.mocked(identity.sign).mockClear();
  const [offered, requested] = nodes.filter(n => n.tag === 'select') as [NodeStub, NodeStub];
  function select(index: number) { offered.value = local[index]!.cid; requested.value = remote[index]!; }
  select(0);
  const flush = async () => { for (const work of queued.splice(0)) await work(); };
  return { local, remote, select, command, read, query, identity, download, message, view,
    submit: () => nodes.find(n => n.tag === 'form')!.fire('submit'), flush,
    inputs: async () => await read('mutiny.alpha.inputs', {}) as BarterInputs,
  };
}

it.each(['queued', 'reading'] as const)('signs the exact submitted want when selections change while %s', async phase => {
  const f = await fixture();
  let release!: () => void;
  let started!: () => void;
  const pendingRead = new Promise<void>(resolve => { started = resolve; });
  if (phase === 'reading') f.query.mockImplementationOnce(async (name, input) => {
    const result = await f.read(name, input);
    started(); await new Promise<void>(resolve => { release = resolve; }); return result;
  });
  f.submit();
  let completed: Promise<void>;
  if (phase === 'reading') { completed = f.flush(); await pendingRead; f.select(1); release(); }
  else { f.select(1); completed = f.flush(); }
  await completed;
  expect(f.download).toHaveBeenCalledOnce();
  const envelope = await verifyEnvelope(f.download.mock.calls[0]![1], { expectedType: WANT_TYPE, expectedAuthor: f.identity.principal });
  expect(envelope.payload).toMatchObject({ offeringListingCid: f.local[0]!.cid, requestedListingCid: f.remote[0]! });
  const retained = (await f.inputs()).wants;
  expect(retained).toHaveLength(1);
  expect(retained[0]!.data.envelope).toEqual(envelope);
  expect(f.identity.sign).toHaveBeenCalledOnce();
});

it('rejects a no-longer-published submitted item instead of substituting a later valid selection', async () => {
  const f = await fixture(); f.submit();
  await f.command('bazaar.listing.unpublish', { listingId: f.local[0]!.id, expectedRevision: 2 });
  vi.mocked(f.identity.sign).mockClear();
  f.select(1);
  await expect(f.flush()).rejects.toThrow('Choose currently published own and peer items.');
  expect(f.identity.sign).not.toHaveBeenCalled(); expect(f.download).not.toHaveBeenCalled();
  expect(f.message).not.toHaveBeenCalled(); expect((await f.inputs()).wants).toEqual([]);
});

it('drops a queued want after the barter view is destroyed', async () => {
  const f = await fixture(); f.submit(); f.view.destroy();
  await expect(f.flush()).rejects.toThrow('This vault is locked');
  expect(f.identity.sign).not.toHaveBeenCalled(); expect(f.download).not.toHaveBeenCalled();
  expect((await f.inputs()).wants).toEqual([]);
});
