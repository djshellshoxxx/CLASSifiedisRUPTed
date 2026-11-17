import { afterEach, describe, expect, it, vi } from 'vitest';
import { didFromPublicKey, type UnlockedIdentity } from '../../packages/identity/src/index.ts';
import { signEnvelope } from '../../packages/federation/src/index.ts';
import { admitSignedGraph, WANT_TYPE } from '../../packages/mutiny/src/cycle_matching/admission.ts';
import { discoverCycles } from '../../packages/mutiny/src/cycle_matching/index.ts';
import { executeMatchingRequest, matchingRequest, parseMatchingResponse, prepareMatchingRequest, type MatchingInput, type MatchingRequest } from '../../apps/pwa/src/matching-worker-protocol.ts';
import { createMatchingWorkerClient, MATCH_WORKER_TIMEOUT_MS, type MatchingWorkerPort } from '../../apps/pwa/src/matching-worker-client.ts';
import { mountBarter } from '../../apps/pwa/src/barter.ts';
import type { UnlockedVault } from '../../packages/vault/src/index.ts';

const now = Date.parse('2026-11-16T20:00:00Z');
const empty: MatchingInput = { listingStatements: [], wantStatements: [], options: { now, localPrincipal: 'local', optedIn: true } };
async function identity(): Promise<UnlockedIdentity> {
  const keys = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']) as CryptoKeyPair;
  return { principal: didFromPublicKey(new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey))), sign: async bytes => new Uint8Array(await crypto.subtle.sign('Ed25519', keys.privateKey, bytes.slice())), lock() {} };
}
async function fixture(): Promise<MatchingInput> {
  const owners = await Promise.all([identity(), identity()]);
  const createdAt = new Date(now - 3600000).toISOString();
  const listings = await Promise.all(owners.map((owner, i) => signEnvelope(owner, { type: 'classrup.bazaar.listing/v1', createdAt, seq: 1, prev: null,
    payload: { listingId: `0192f3a4-0000-7000-8000-00000000000${i + 1}`, ownerId: owner.principal, revision: 1, kind: 'sell', title: 'Signed item', description: 'A public signed listing', categoryId: '0192f3a4-0000-7000-8000-000000000999', condition: 'good', tags: [], locale: 'en-CA', regionCell: 'c2b2q', barterOptIn: true, availability: 'available', value: { amount: '100', currency: 'CAD' }, expiresAt: new Date(now + 86400000).toISOString() },
  })));
  const wants = await Promise.all(owners.map((owner, i) => signEnvelope(owner, { type: WANT_TYPE, createdAt, seq: 1, prev: null, payload: { offeringListingCid: listings[i]!.cid, requestedListingCid: listings[1 - i]!.cid, expiresAt: new Date(now + 86400000).toISOString() } })));
  return { listingStatements: listings, wantStatements: wants, options: { now, localPrincipal: owners[0]!.principal, optedIn: true, includeUnknownIdentities: true } };
}
class FakeWorker implements MatchingWorkerPort {
  onmessage: MatchingWorkerPort['onmessage'] = null;
  onerror: MatchingWorkerPort['onerror'] = null;
  onmessageerror: MatchingWorkerPort['onmessageerror'] = null;
  requests: unknown[] = [];
  terminated = false;
  postMessage(value: unknown): void { this.requests.push(value); }
  terminate(): void { this.terminated = true; }
  emit(data: unknown): void { this.onmessage?.({ data } as MessageEvent<unknown>); }
  async complete(): Promise<void> { this.emit(await executeMatchingRequest(this.requests[0])); }
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('worker matching admission and bounded protocol', () => {
  it('retains exactly the direct engine result for real signed public records', async () => {
    const input = await fixture();
    const graph = await admitSignedGraph(input.listingStatements, input.wantStatements, input.options);
    const direct = await discoverCycles(graph.edges, { now, localPrincipal: input.options.localPrincipal });
    const response = parseMatchingResponse(await executeMatchingRequest(matchingRequest(input, 7)));
    expect(response.kind).toBe('result');
    if (response.kind !== 'result') throw new Error('No result');
    expect(response.id).toBe(7);
    expect(response.outcome.result).toEqual({ ...direct, stats: { ...direct.stats, durationMs: response.outcome.result.stats.durationMs } });
    expect(response.outcome.result.suggestions).toHaveLength(1);
    expect(response.outcome.rejected).toBe(graph.rejected);
  });

  it('re-verifies signatures in the worker and applies blocks before searching', async () => {
    const input = await fixture();
    const listing = input.listingStatements[0] as { author: string; payload: Record<string, unknown> };
    const tampered = { ...listing, payload: { ...listing.payload, title: 'Tampered' } };
    expect(await executeMatchingRequest(matchingRequest({ ...input, listingStatements: [tampered, input.listingStatements[1]] }, 2))).toEqual({ v: 1, kind: 'error', id: 2, code: 'MATCH_FAILED' });
    const blocked = await executeMatchingRequest(matchingRequest({ ...input, options: { ...input.options, blockedOwners: [listing.author] } }, 3));
    expect(blocked.kind === 'result' && blocked.outcome.result.suggestions).toEqual([]);
  });

  it('rejects oversized input, injected policy fields and malformed worker requests independently', async () => {
    expect(() => matchingRequest({ ...empty, listingStatements: Array.from({ length: 4001 }, () => ({})) }, 1)).toThrow();
    expect(() => matchingRequest({ ...empty, options: { ...empty.options, privateKey: 'must not cross' } as MatchingInput['options'] }, 1)).toThrow();
    const request = matchingRequest(empty, 1);
    for (const invalid of [{ ...request, listings: ['x'.repeat(1024 * 1024 + 1)] }, { ...request, admission: { ...request.admission, optedIn: false } }, { ...request, search: { expansionBudget: 100001 } }, { ...request, secret: 'extra field' }]) {
      expect((await executeMatchingRequest(invalid)).kind).toBe('error');
    }
    const large = { ...request, listings: Array.from({ length: 33 }, () => '"' + 'x'.repeat(1024 * 1024 - 2) + '"') };
    expect(await executeMatchingRequest(large)).toEqual({ v: 1, kind: 'error', id: 1, code: 'MATCH_FAILED' });
  });

  it('yields bounded encoding batches and aborts preparation before starting a worker', async () => {
    let active = true;
    const yieldNow = vi.fn(async () => { active = false; });
    const check = (): void => { if (!active) throw new Error('cancelled during preparation'); };
    await expect(prepareMatchingRequest({ ...empty, listingStatements: Array.from({ length: 100 }, () => ({})) }, 1, check, yieldNow)).rejects.toThrow('cancelled during preparation');
    expect(yieldNow).toHaveBeenCalledOnce();
    const factory = vi.fn(() => new FakeWorker());
    const client = createMatchingWorkerClient(factory);
    const pending = client.run({ ...empty, listingStatements: Array.from({ length: 100 }, () => ({})) });
    const rejected = expect(pending).rejects.toMatchObject({ code: 'CANCELLED' });
    client.dispose(); await rejected;
    expect(factory).not.toHaveBeenCalled();
  });

  it('yields by encoded bytes before a full count batch of large envelopes blocks cancellation', async () => {
    let active = true;
    const yieldNow = vi.fn(async () => { active = false; });
    const input = { ...empty, listingStatements: [{ payload: 'x'.repeat(300_000) }, { payload: 'y'.repeat(300_000) }] };
    await expect(prepareMatchingRequest(input, 1, () => { if (!active) throw new Error('cancelled'); }, yieldNow)).rejects.toThrow('cancelled');
    expect(yieldNow).toHaveBeenCalledOnce();
  });

  it('sends no vault, identity, storage, or private listing rows to the worker', async () => {
    const worker = new FakeWorker();
    const client = createMatchingWorkerClient(() => worker);
    const enriched = { ...empty, identity: { secret: 'private key' }, listings: [{ privateDescription: 'draft' }], vault: 'private' };
    const pending = client.run(enriched);
    await Promise.resolve();
    expect(worker.requests[0]).toEqual(matchingRequest(empty, 1));
    await worker.complete(); await pending;
    expect(worker.terminated).toBe(true);
    expect(worker.onmessage).toBeNull();
  });

  it('terminates the previous generation and ignores its late response', async () => {
    const workers: FakeWorker[] = [];
    const client = createMatchingWorkerClient(() => { const worker = new FakeWorker(); workers.push(worker); return worker; });
    const first = client.run(empty);
    const firstRejected = expect(first).rejects.toMatchObject({ code: 'CANCELLED' });
    await Promise.resolve();
    const late = workers[0]!.onmessage!;
    const second = client.run(empty);
    await Promise.resolve();
    await firstRejected;
    expect(workers[0]!.terminated).toBe(true);
    late({ data: await executeMatchingRequest(workers[0]!.requests[0]) } as MessageEvent<unknown>);
    expect(workers[1]!.terminated).toBe(false);
    await workers[1]!.complete();
    expect((await second).result.suggestions).toEqual([]);
  });

  it('cancels on session disposal and never reopens a disposed client', async () => {
    const worker = new FakeWorker(); const factory = vi.fn(() => worker);
    const client = createMatchingWorkerClient(factory);
    const pending = client.run(empty); const rejected = expect(pending).rejects.toMatchObject({ code: 'CANCELLED' });
    await Promise.resolve();
    client.dispose(); await rejected;
    expect(worker.terminated).toBe(true);
    await expect(client.run(empty)).rejects.toMatchObject({ code: 'CANCELLED' });
    expect(factory).toHaveBeenCalledOnce();
  });

  it('enforces a separate whole-worker deadline without extending engine budgets', async () => {
    vi.useFakeTimers();
    const worker = new FakeWorker(); const client = createMatchingWorkerClient(() => worker);
    const pending = client.run(empty); const rejected = expect(pending).rejects.toMatchObject({ code: 'TIMEOUT' });
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(MATCH_WORKER_TIMEOUT_MS); await rejected;
    expect(worker.terminated).toBe(true);
    expect((worker.requests[0] as MatchingRequest).search).toEqual({});
  });

  it('fails closed when worker startup, message transport, or result validation fails', async () => {
    await expect(createMatchingWorkerClient(() => { throw new Error('native secret'); }).run(empty)).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    for (const failure of ['post', 'error', 'messageerror', 'shape', 'id'] as const) {
      const worker = new FakeWorker();
      if (failure === 'post') worker.postMessage = () => { throw new Error('native secret'); };
      const pending = createMatchingWorkerClient(() => worker).run(empty);
      const rejected = expect(pending).rejects.toMatchObject({ code: 'FAILED', message: 'Matching failed. Review the signed records and retry.' });
      await Promise.resolve();
      if (failure === 'error') worker.onerror?.(new Event('error') as ErrorEvent);
      if (failure === 'messageerror') worker.onmessageerror?.({ data: 'secret' } as MessageEvent<unknown>);
      if (failure === 'shape') worker.emit({ v: 1, kind: 'result', id: 1, outcome: { result: { suggestions: Array(501).fill({}) } } });
      if (failure === 'id') worker.emit({ ...await executeMatchingRequest(matchingRequest(empty, 99)), id: 99 });
      await rejected; expect(worker.terminated).toBe(true);
    }
  });
});

it('reports explicit PWA matching cancellation as ordinary status instead of an operation failure', async () => {
  class NodeStub {
    textContent = ''; value = ''; type = ''; checked = false; disabled = false;
    children: NodeStub[] = []; parent: NodeStub | undefined;
    readonly listeners = new Map<string, () => void>();
    setAttribute() {}
    addEventListener(type: string, listener: () => void) { this.listeners.set(type, listener); }
    append(...nodes: NodeStub[]) { for (const node of nodes) { this.children.push(node); node.parent = this; } }
    replaceChildren(...nodes: NodeStub[]) { this.children = []; this.append(...nodes); }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(n => n !== this); }
    click() { this.listeners.get('click')?.(); }
  }
  const nodes: NodeStub[] = [];
  vi.stubGlobal('document', {
    createElement() { const n = new NodeStub(); nodes.push(n); return n; },
    createTextNode(text: string) { const n = new NodeStub(); n.textContent = text; return n; },
  });
  const worker = new FakeWorker();
  vi.stubGlobal('Worker', class { constructor() { return worker; } });
  const tasks: Promise<void>[] = [], failures: unknown[] = [];
  const message = vi.fn(); const command = vi.fn(async () => ({}));
  const mount = mountBarter({ container: new NodeStub() as unknown as HTMLElement,
    session: { principal: 'local' } as UnlockedVault, command,
    query: async () => ({ listings: [], retained: [], wants: [], listingStatements: [], wantStatements: [] }),
    action(fn) { const task = Promise.resolve().then(fn).catch(error => { failures.push(error); }); tasks.push(task); return task; },
    message, download: vi.fn(), refreshListings: async () => {}, setMatchingPolicy: vi.fn(),
  });
  nodes.find(n => n.type === 'checkbox')!.checked = true;
  nodes.find(n => n.textContent === 'Discover compatible cycles')!.click();
  await vi.waitFor(() => expect(worker.requests).toHaveLength(1));
  nodes.find(n => n.textContent === 'Cancel matching')!.click();
  await Promise.all(tasks);
  expect(failures).toEqual([]);
  expect(message).toHaveBeenCalledWith('Matching was cancelled. No proposal or inventory commitment was created.');
  expect(command).not.toHaveBeenCalled(); expect(worker.terminated).toBe(true);
  expect(nodes.some(n => n.textContent === 'Matching stopped. Discover again to retry.')).toBe(true);
  mount.destroy();
});
