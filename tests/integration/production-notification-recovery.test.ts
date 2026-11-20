import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import {
  createBus, createDeterministicIds, createFakeClock, createOutboxDispatcher, createRegistry,
  type FakeClock, type IdGen,
} from '../../packages/kernel/src/index.ts';
import { inApp, localNotificationDefinitions, preferences } from '../../packages/notify/src/index.ts';
import { openVault, type UnlockedVault, type Vault } from '../../packages/vault/src/index.ts';
import { productionBackupCodecs } from '../../apps/pwa/src/backup-codecs.ts';

const passphrase = 'production notification recovery acceptance passphrase';
const peer = 'did:key:notification-source';
type NotificationView = inApp.Notification & { id: string; revision: number };
interface NotificationPage { items: NotificationView[]; nextCursor?: string }
interface PreferenceMatrix {
  cells: Array<preferences.NotificationPreference & { id: string; revision: number }>;
  channelStatus: { push: boolean; email: boolean };
  defaultsVersion: number;
  mirrorRef: string | null;
}

function runtime(session: UnlockedVault, clock: FakeClock, ids: IdGen) {
  const definitions = localNotificationDefinitions({
    localPrincipal: () => session.principal, isBlocked: () => false, isThreadMuted: () => false,
  });
  const registry = createRegistry().add(...definitions.all);
  const origin = `vault:${session.principal}`;
  const bus = createBus({
    registry, storage: session.storage, clock, ids, origin,
    authz: { authorize: (actor, _capability, _resource, context) =>
      actor.kind === 'user' && actor.id === session.principal && context.tenantId === session.principal
        ? { allow: true } : { allow: false, code: 'FORBIDDEN' } },
  });
  const outbox = createOutboxDispatcher({ registry, storage: session.storage, clock, ids, origin, random: () => 0.5 });
  const context = { actor: { kind: 'user' as const, id: session.principal, roles: ['member'] }, tenantId: session.principal };
  const dispatch = (name: string, input: unknown) => bus.dispatch(context, name, input, { idempotencyKey: ids.next() });
  return {
    dispatch,
    async command<T = unknown>(name: string, input: unknown): Promise<T> {
      const result = await dispatch(name, input);
      if (!result.ok) throw new Error(`${name}: ${result.error.code}`);
      return result.value.value as T;
    },
    async query<T = unknown>(name: string, input: unknown): Promise<T> {
      const result = await bus.query(context, name, input);
      if (!result.ok) throw new Error(`${name}: ${result.error.code}`);
      return result.value.value as T;
    },
    drain: () => outbox.drain(),
  };
}

describe('production notification record recovery', () => {
  it('reopens the local inbox and preferences, then continues dedupe, collapse and read actions', async () => {
    const indexedDB = new IDBFactory();
    const vaults: Vault[] = [];
    async function open(name: string) {
      const vault = await openVault({ name, indexedDB, codecs: productionBackupCodecs });
      vaults.push(vault);
      return vault;
    }
    try {
      const source = await open('production-notification-source');
      const original = await source.create(passphrase);
      const principal = original.principal;
      const clock = createFakeClock('2026-11-20T10:00:00.000Z');
      const ids = createDeterministicIds({ seed: 99, now: () => clock.now() });
      const owner = runtime(original, clock, ids);
      const subjectId = ids.next();
      const firstSourceId = ids.next();
      const cycle = { category: 'cycles', templateKey: 'notify.tpl.cycles.coordination_updated',
        ref: { type: 'cycle', id: subjectId }, actorDid: peer, collapseKey: 'recovery-cycle' };

      // The vault-internal notification command creates accepted local inbox state.
      // This fixture does not simulate an upstream signed barter producer or external delivery.
      await owner.command('notify.preference.set', { cells: [{ category: 'offers', inApp: false, expectedRevision: 1 }] });
      expect(await owner.drain()).toMatchObject({ delivered: 1, retried: 0, deadLettered: 0 });
      const first = await owner.command<inApp.CreateOutput>('notify.notification.create', { ...cycle, sourceEventId: firstSourceId });
      expect(first).toMatchObject({ created: true, collapsed: false, count: 1 });
      clock.advance(1000);
      const collapsed = await owner.command<inApp.CreateOutput>('notify.notification.create', { ...cycle, sourceEventId: ids.next() });
      expect(collapsed).toEqual({ notificationId: first.notificationId, created: false, collapsed: true, count: 2 });
      await owner.command('notify.notification.mark_read', { notificationId: first.notificationId, expectedRevision: 2 });
      const hidden = await owner.command<inApp.CreateOutput>('notify.notification.create', {
        sourceEventId: ids.next(), category: 'offers', templateKey: 'notify.tpl.offers.made', actorDid: peer,
      });
      expect(hidden).toEqual({ notificationId: null, created: false, collapsed: false, count: 0 });
      clock.advance(1000);
      const security = await owner.command<inApp.CreateOutput>('notify.notification.create', {
        sourceEventId: ids.next(), category: 'security', templateKey: 'notify.tpl.security.device_added', urgency: 'urgent',
      });
      clock.advance(1000);
      const unreadCycle = await owner.command<inApp.CreateOutput>('notify.notification.create', { ...cycle, sourceEventId: ids.next() });
      expect(unreadCycle.notificationId).not.toBe(first.notificationId);

      async function views(current: ReturnType<typeof runtime>) {
        const firstPage = await current.query<NotificationPage>('notify.notification.list_mine', { status: 'all', limit: 2 });
        expect(firstPage.nextCursor).toBeDefined();
        const secondPage = await current.query<NotificationPage>('notify.notification.list_mine', {
          status: 'all', limit: 2, cursor: firstPage.nextCursor,
        });
        expect(secondPage.nextCursor).toBeUndefined();
        return {
          pages: [firstPage, secondPage],
          unread: await current.query<NotificationPage>('notify.notification.list_mine', { status: 'unread' }),
          cycles: await current.query<NotificationPage>('notify.notification.list_mine', { category: 'cycles' }),
          count: await current.query('notify.notification.unread_count', {}),
          matrix: await current.query<PreferenceMatrix>('notify.preference.get_matrix', {}),
        };
      }
      const before = await views(owner);
      expect(before.pages.flatMap(page => page.items).map(row => row.id)).toEqual([
        unreadCycle.notificationId, security.notificationId, first.notificationId,
      ]);
      expect(before.pages[1]?.items[0]).toMatchObject({ status: 'read', count: 2, revision: 3 });
      expect(before.unread.items.map(row => row.id)).toEqual([unreadCycle.notificationId, security.notificationId]);
      expect(before.cycles.items).toHaveLength(2);
      expect(before.count).toEqual({ total: 2, byCategory: { offers: 0, cycles: 1, messages: 0, auctions: 0, bookings: 0, moderation: 0, security: 1 } });
      expect(before.matrix.cells).toHaveLength(7);
      expect(before.matrix.cells.find(cell => cell.category === 'offers')).toMatchObject({ inApp: false, revision: 2 });
      expect(before.matrix.cells.find(cell => cell.category === 'security')).toMatchObject({ inApp: true, inAppLocked: true });
      expect(before.matrix).toMatchObject({ channelStatus: { push: false, email: false }, mirrorRef: null });
      const types = [inApp.notificationRepo.type, inApp.seenRepo.type, inApp.dayRepo.type,
        inApp.diagRepo.type, preferences.preferenceRepo.type, preferences.counterRepo.type].sort();
      const coverage = await original.backupCoverage();
      expect(coverage.recordTypes.map(row => row.type)).toEqual(types);
      expect(coverage.recordCount).toBe(18);
      const dayKey = `${Math.floor(clock.now() / 86_400_000)}/${peer}`;
      const preferenceKey = `edit/${Math.floor(clock.now() / 3_600_000)}`;
      const domainState = (session: UnlockedVault) => session.storage.read(tx => ({
        seen: tx.records.query({ tenant: principal, type: inApp.seenRepo.type, filters: [], orderSlot: 0, dir: 'asc', limit: 20 }),
        day: tx.records.get(principal, inApp.dayRepo.type, dayKey),
        preferences: tx.records.get(principal, preferences.counterRepo.type, preferenceKey),
        diagnostics: tx.records.get(principal, inApp.diagRepo.type, 'counters'),
      }));
      const counters = await domainState(original);
      expect(counters.seen).toHaveLength(5);
      expect(counters.day?.data).toEqual({ count: 3 });
      expect(counters.preferences?.data).toEqual({ count: 1 });
      expect(counters.diagnostics?.data).toEqual({ created: 3, collapsed: 1, read: 1, dropped: 0, hidden: 1, total: 3 });
      const message = new TextEncoder().encode('notification recovery preserves the signing identity');
      const signature = await original.identity.sign(message);
      const backup = await original.exportBackup(passphrase);
      expect(JSON.stringify(backup)).not.toContain('notify.preference');
      expect(await views(owner)).toEqual(before);
      expect(await domainState(original)).toEqual(counters);
      await original.lock();

      const destination = await open('production-notification-destination');
      const restored = await destination.restoreBackup(backup, passphrase);
      expect(restored.principal).toBe(principal);
      expect(await restored.identity.sign(message)).toEqual(signature);
      expect(await views(runtime(restored, clock, ids))).toEqual(before);
      expect(await domainState(restored)).toEqual(counters);
      await restored.lock();

      const reopened = await open('production-notification-destination');
      const unlocked = await reopened.unlock(passphrase);
      const recovered = runtime(unlocked, clock, ids);
      expect(await unlocked.identity.sign(message)).toEqual(signature);
      expect(await views(recovered)).toEqual(before);
      expect(await domainState(unlocked)).toEqual(counters);
      expect(await unlocked.backupCoverage()).toEqual(coverage);
      expect(await unlocked.storage.read(tx => tx.sync.list({ tenant: principal }))).toEqual([]);

      // Domain dedupe survives even though kernel delivery/idempotency stores are excluded.
      expect(await recovered.dispatch('notify.notification.create', { ...cycle, sourceEventId: firstSourceId }))
        .toMatchObject({ ok: false, error: { code: 'CONFLICT_STATE' } });
      expect(await domainState(unlocked)).toEqual(counters);
      const continued = await recovered.command<inApp.CreateOutput>('notify.notification.create', { ...cycle, sourceEventId: ids.next() });
      expect(continued).toEqual({ notificationId: unreadCycle.notificationId, created: false, collapsed: true, count: 2 });
      await recovered.command('notify.preference.set', { cells: [{ category: 'cycles', inApp: false, expectedRevision: 1 }] });
      expect(await recovered.drain()).toMatchObject({ delivered: 1, retried: 0, deadLettered: 0 });
      expect((await recovered.query<NotificationPage>('notify.notification.list_mine', { category: 'cycles' })).items)
        .toMatchObject([{ id: first.notificationId, status: 'read', count: 2 }]);
      expect(await recovered.command<inApp.CreateOutput>('notify.notification.create', { ...cycle, sourceEventId: ids.next() }))
        .toEqual({ notificationId: null, created: false, collapsed: false, count: 0 });
      expect(await recovered.command('notify.notification.mark_all_read', { beforeTimestamp: clock.iso() }))
        .toEqual({ marked: 1, unreadCount: 0 });
      expect(await recovered.query('notify.notification.unread_count', {})).toMatchObject({ total: 0 });
      const after = await domainState(unlocked);
      expect(after.seen).toHaveLength(7);
      expect(after.day?.data).toEqual({ count: 4 });
      expect(after.preferences?.data).toEqual({ count: 2 });
      expect(after.diagnostics?.data).toEqual({ created: 3, collapsed: 2, read: 2, dropped: 1, hidden: 2, total: 2 });
      expect(await recovered.query('notify.preference.get_matrix', {}))
        .toMatchObject({ channelStatus: { push: false, email: false }, mirrorRef: null });
      expect(await unlocked.storage.read(tx => tx.sync.list({ tenant: principal }))).toEqual([]);
    } finally {
      for (const vault of vaults) await vault.close();
    }
  }, 30000);
});
