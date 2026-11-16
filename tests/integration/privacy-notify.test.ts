import { describe, expect, it } from 'vitest';
import { defineCommand, defineEvent, ok, z } from '../../packages/kernel/src/index.ts';
import { createTestKernel } from '../../packages/kernel/src/testing/harness.ts';
import { createMemoryStorage } from '../../packages/kernel/src/storage/storage.ts';
import { localNotificationDefinitions, localNotificationBackupCodecs, inApp, preferences } from '../../packages/notify/src/index.ts';
import { classification } from '../../packages/privacy/src/index.ts';
import { backupCodec, vaultFromStorage } from '../../packages/vault/src/index.ts';

const val = <T>(r: { ok: boolean; value?: unknown; error?: { code: string } }): T => {
  if (!r.ok) throw new Error(r.error?.code);
  return (r.value as { value: T }).value;
};

describe('exported local privacy and notification composition', () => {
  it('routes through the bus, honors preferences, redacts output and queues no external delivery', async () => {
    const k = createTestKernel();
    const principal = k.actor.kind === 'user' ? k.actor.id : '';
    const defs = localNotificationDefinitions({ localPrincipal: () => principal, isBlocked: () => false, isThreadMuted: () => false });
    const emit = defineCommand({ name: 'test.offer.emit', module: 'F99.S01.M01', capability: 'test.offer.emit', idempotent: false,
      input: z.strictObject({}), handler(ctx) {
        ctx.emit(defineEvent('bazaar.offer.made', 1, 'P2', z.looseObject({})), { aggregate: { type: 'offer', id: ctx.ids.next() }, revision: 1,
          payload: { sellerId: principal, buyerId: 'did:key:other', offerId: ctx.ids.next(), offerListingId: ctx.ids.next(), note: 'private free text' } });
        return ok(null);
      } });
    k.registry.add(...defs.all, emit);
    val(await k.cmd('test.offer.emit', {}));
    await k.drainOutbox();
    const items = val<{ items: inApp.Notification[] }>(await k.ask('notify.notification.list_mine', {})).items;
    expect(items).toHaveLength(1);
    expect(JSON.stringify(items)).not.toContain('private free text');
    const redacted = classification.redactForNotification({ title: 'Generic alert', secret: 'private free text' }, {
      schema: 'integration.notice/v1', fields: { title: { class: 'P0' }, secret: { class: 'P3' } },
    });
    expect(redacted.value).toEqual({ title: 'Generic alert' });
    val(await k.cmd('notify.preference.set', { cells: [{ category: 'offers', inApp: false, expectedRevision: 1 }] }));
    await k.drainOutbox();
    expect(val<{ items: unknown[] }>(await k.ask('notify.notification.list_mine', {})).items).toEqual([]);
    val(await k.cmd('test.offer.emit', {}));
    await k.drainOutbox();
    expect(val<{ total: number }>(await k.ask('notify.notification.unread_count', {})).total).toBe(0);
    expect(await k.storage.read(tx => tx.sync.list({}))).toEqual([]);
    expect(defs.all.map(d => d.name)).not.toContain('notify.channel.opt_in');
    expect(defs.all.map(d => d.name)).not.toContain('notify.preference.mirror');
  });

  it('round-trips owner preferences in an encrypted vault backup without restoring external channel authority', async () => {
    const codecs = localNotificationBackupCodecs(backupCodec);
    const source = vaultFromStorage(createMemoryStorage(), codecs);
    const passphrase = 'local notification integration test passphrase';
    const unlocked = await source.create(passphrase);
    const data = { userDid: unlocked.principal, category: 'offers' as const, inApp: false, push: false, email: false, inAppLocked: false,
      defaultsVersion: 1, mirrorSeq: 0, updatedAtClaim: new Date().toISOString() };
    const codec = codecs.find(c => c.type === preferences.preferenceRepo.type)!;
    const write = await unlocked.storage.transaction(tx => tx.records.put({ tenant: unlocked.principal, type: codec.type, id: 'offers',
      data, idx: codec.indexes(data), expectedRevision: 0, now: Date.now() }));
    expect(write.ok).toBe(true);
    const sealed = await unlocked.exportBackup(passphrase);
    const target = vaultFromStorage(createMemoryStorage(), codecs);
    const restored = await target.restoreBackup(sealed, passphrase);
    expect(await restored.storage.read(tx => tx.records.get(restored.principal, codec.type, 'offers')?.data)).toEqual(data);
    expect(codecs.map(c => c.type)).not.toContain('notify.channel_consent');
    expect(codecs.map(c => c.type)).not.toContain('notify.pref_channel');
    await unlocked.lock(); await restored.lock();
  });

  it('rejects foreign owner records and security preferences disabled in a backup', async () => {
    const codecs = localNotificationBackupCodecs(backupCodec);
    const codec = codecs.find(c => c.type === preferences.preferenceRepo.type)!;
    const data = { userDid: 'did:key:other', category: 'offers', inApp: true, push: false, email: false, inAppLocked: false,
      defaultsVersion: 1, mirrorSeq: 0, updatedAtClaim: new Date().toISOString() };
    await expect(codec.restoreData!(data, 'did:key:owner')).rejects.toThrow('another principal');
    expect(() => codec.parse({ ...data, category: 'security', inApp: false, inAppLocked: true })).toThrow();
  });
});
