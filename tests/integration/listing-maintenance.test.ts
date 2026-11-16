import { expect, it, vi } from 'vitest';
import { createTestKernel } from '../../packages/kernel/src/testing/index.ts';
import { createIdentity } from '../../packages/identity/src/index.ts';
import { signEnvelope, verifyEnvelope } from '../../packages/federation/src/index.ts';
import { bazaarDefinitions, listingRepo, publicationRepo } from '../../packages/bazaar/src/index.ts';
import { createListingMaintenance, type ListingMaintenanceStatus } from '../../apps/pwa/src/listing-maintenance.ts';

const page = (nextCursor?: string, expired = 0, archived = 0) => ({ processed: 100, expired, archived, envelopes: [], ...(nextCursor ? { nextCursor } : {}) });

it('limits a pass to five owner-scoped pages and resumes immediately to finish the same cycle', async () => {
  let at = 0;
  const command = vi.fn(async () => page(`cursor-${command.mock.calls.length}`, 1, 2));
  const statuses: ListingMaintenanceStatus[] = [];
  const maintenance = createListingMaintenance({ command, isActive: () => true, onStatus: status => statuses.push(status), now: () => at });
  const first = await maintenance.run();
  expect(first).toEqual({ phase: 'pending', processed: 500, expired: 5, archived: 10, pages: 5, pending: true, nextCursor: 'cursor-5' });
  expect(command).toHaveBeenNthCalledWith(1, 'bazaar.listing.sweep', { limit: 100 });
  expect(command).toHaveBeenNthCalledWith(5, 'bazaar.listing.sweep', { limit: 100, cursor: 'cursor-4' });
  command.mockImplementationOnce(async () => ({ processed: 13, expired: 3, archived: 1, envelopes: [] }));
  const final = await maintenance.run();
  expect(final).toEqual({ phase: 'complete', processed: 513, expired: 8, archived: 11, pages: 6, pending: false });
  expect(command).toHaveBeenNthCalledWith(6, 'bazaar.listing.sweep', { limit: 100, cursor: 'cursor-5' });
  await maintenance.run(); at = 59_999; await maintenance.run();
  expect(command).toHaveBeenCalledTimes(6);
  at = 60_000;
  command.mockImplementationOnce(async () => ({ processed: 1, expired: 0, archived: 0, envelopes: [] }));
  expect(await maintenance.run()).toMatchObject({ phase: 'complete', processed: 1, pages: 1 });
  expect(command).toHaveBeenNthCalledWith(7, 'bazaar.listing.sweep', { limit: 100 });
  expect(statuses.map(status => status.phase)).toEqual(['running', 'pending', 'running', 'complete', 'running', 'complete']);
});

it('shares concurrent runs and prevents a status callback from starting an overlapping pass', async () => {
  let resolve!: (value: unknown) => void;
  const pending = new Promise<unknown>(done => { resolve = done; });
  const command = vi.fn(() => pending);
  const maintenance = createListingMaintenance({ command, isActive: () => true,
    onStatus: status => { if (status.phase === 'running') void maintenance.run(); } });
  const first = maintenance.run();
  const second = maintenance.run();
  expect(first).toBe(second);
  await vi.waitFor(() => expect(command).toHaveBeenCalledTimes(1));
  resolve({ processed: 0, expired: 0, archived: 0 });
  expect(await first).toMatchObject({ phase: 'complete', pages: 1 });
  expect(await second).toEqual(await first);
  expect(command).toHaveBeenCalledTimes(1);
});

it('keeps confirmed progress and retries the failed page rather than skipping or restarting it', async () => {
  const command = vi.fn(async () => page())
    .mockResolvedValueOnce(page('page-two', 4, 1))
    .mockRejectedValueOnce(new Error('storage temporarily unavailable'))
    .mockResolvedValueOnce(page(undefined, 2, 3));
  const maintenance = createListingMaintenance({ command, isActive: () => true, onStatus: () => {} });
  expect(await maintenance.run()).toEqual({ phase: 'failed', processed: 100, expired: 4, archived: 1, pages: 1, pending: true, nextCursor: 'page-two' });
  expect(await maintenance.run()).toEqual({ phase: 'complete', processed: 200, expired: 6, archived: 4, pages: 2, pending: false });
  expect(command.mock.calls[1]).toEqual(command.mock.calls[2]);
});

it('reports first-page failure as pending and validates untrusted response counts', async () => {
  const command = vi.fn(async () => ({ processed: 100, expired: 101, archived: 0 }));
  const maintenance = createListingMaintenance({ command, isActive: () => true, onStatus: () => {} });
  expect(await maintenance.run()).toEqual({ phase: 'failed', processed: 0, expired: 0, archived: 0, pages: 0, pending: true });
  command.mockImplementationOnce(async () => ({ processed: 0, expired: 0, archived: 0 }));
  expect(await maintenance.run()).toMatchObject({ phase: 'complete', processed: 0 });
  expect(command).toHaveBeenNthCalledWith(2, 'bazaar.listing.sweep', { limit: 100 });
});

it('does not loop on a repeating cursor or erase earlier confirmed results', async () => {
  const command = vi.fn(async () => page('same', 1, 0));
  const maintenance = createListingMaintenance({ command, isActive: () => true, onStatus: () => {} });
  expect(await maintenance.run()).toEqual({ phase: 'failed', processed: 100, expired: 1, archived: 0, pages: 1, pending: true, nextCursor: 'same' });
  expect(command).toHaveBeenCalledTimes(2);
});

it.each(['dispose', 'replace'] as const)('stops late results and future dispatches after session %s', async mode => {
  let active = true;
  let resolve!: (value: unknown) => void;
  const pending = new Promise<unknown>(done => { resolve = done; });
  const command = vi.fn(() => pending);
  const status = vi.fn();
  const maintenance = createListingMaintenance({ command, isActive: () => active, onStatus: status });
  const work = maintenance.run();
  await vi.waitFor(() => expect(command).toHaveBeenCalledOnce());
  if (mode === 'dispose') maintenance.dispose(); else active = false;
  resolve(page('more', 5, 4));
  expect(await work).toMatchObject({ phase: 'stopped' });
  expect(status).toHaveBeenCalledTimes(1); // Only the earlier running state.
  expect(await maintenance.run()).toMatchObject({ phase: 'stopped' });
  expect(command).toHaveBeenCalledOnce();
});

it('does no work before the owner session is active and does not publish or download envelopes', async () => {
  let active = false;
  const envelope = { cid: 'retained-withdrawal' };
  const command = vi.fn(async () => ({ processed: 1, expired: 1, archived: 0, envelopes: [envelope] }));
  const onStatus = vi.fn();
  const maintenance = createListingMaintenance({ command, isActive: () => active, onStatus });
  expect(await maintenance.run()).toMatchObject({ phase: 'stopped' });
  expect(command).not.toHaveBeenCalled();
  active = true;
  const result = await maintenance.run();
  expect(result).not.toHaveProperty('envelopes');
  expect(JSON.stringify(onStatus.mock.calls)).not.toContain('retained-withdrawal');
  expect(envelope).toEqual({ cid: 'retained-withdrawal' });
});

it('runs real owner-authorized expiry and archive commands while retaining the signed withdrawal', async () => {
  const k = createTestKernel();
  const { identity } = await createIdentity('real lifecycle maintenance passphrase');
  const actor = { kind: 'user' as const, id: identity.principal, roles: ['member'] };
  k.registry.add(...bazaarDefinitions({ categoryAllowed: () => true,
    signProjection: async (type, payload, seq, prev) => ({ ...await signEnvelope(identity, { type, payload, seq, prev, createdAt: new Date(k.clock.now()).toISOString() }) }),
    verifyProjection: envelope => verifyEnvelope(envelope, { now: k.clock.now() }),
  }).all);
  const command = async (name: string, input: unknown) => {
    const result = await k.cmd(name, input, { actor });
    if (!result.ok) throw new Error(result.error.code);
    return result.value.value;
  };
  const listingId = k.ids.next();
  await command('bazaar.listing.create', { listingId, kind: 'sell', title: 'Maintenance bicycle', description: 'Saved local bicycle',
    categoryId: k.ids.next(), condition: 'good', regionCell: 'c2b2', barterOptIn: true, value: { amount: '100', currency: 'CAD' } });
  await command('bazaar.listing.publish', { listingId, expectedRevision: 1, expiryDays: 1 });
  k.clock.advance(86400000);
  let schedulerTime = 0;
  const maintenance = createListingMaintenance({ command, isActive: () => true, onStatus: () => {}, now: () => schedulerTime });
  expect(await maintenance.run()).toMatchObject({ phase: 'complete', processed: 1, expired: 1, archived: 0 });
  const expired = await k.storage.read(tx => tx.records.get(k.tenantId, listingRepo.type, listingId));
  expect(expired?.data).toMatchObject({ status: 'expired' });
  const withdrawalCid = (expired?.data as { publicationCid: string }).publicationCid;
  const signed = await k.storage.read(tx => tx.records.get(k.tenantId, publicationRepo.type, withdrawalCid));
  expect(signed?.data).toMatchObject({ listingId, envelope: { type: 'classrup.alpha.tombstone/v1', author: identity.principal } });
  k.clock.advance(30 * 86400000); schedulerTime = 60_000;
  expect(await maintenance.run()).toMatchObject({ phase: 'complete', processed: 1, expired: 0, archived: 1 });
  const archived = await k.storage.read(tx => tx.records.get(k.tenantId, listingRepo.type, listingId));
  expect(archived?.data).toMatchObject({ status: 'archived', publicationCid: withdrawalCid });
  maintenance.dispose(); identity.lock();
});
