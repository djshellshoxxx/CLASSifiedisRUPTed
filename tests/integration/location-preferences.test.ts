import { afterEach, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { allowAllAuthz, createBus, createFakeClock, createRegistry, createUuidV7Generator, type Bus } from '../../packages/kernel/src/index.ts';
import { locationBackupCodecs, locationDefinitions, locationSettingRepo, type LocationSetting } from '../../packages/discovery/src/index.ts';
import { backupCodec, openVault, type UnlockedVault } from '../../packages/vault/src/index.ts';
import { mountLocationPreferences, requestCoarsePosition } from '../../apps/pwa/src/location-preferences.ts';
import { createActionQueue } from '../../apps/pwa/src/action-queue.ts';
import { NodeStub } from '../support/node-stub.ts';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
const passphrase = 'location encrypted backup passphrase';
function runtime(session: UnlockedVault): { command(name: string, input: unknown): Promise<unknown>; bus: Bus } {
  const clock = createFakeClock(Date.now());
  const ids = createUuidV7Generator({ now: () => clock.now() });
  const bus = createBus({ registry: createRegistry().add(...locationDefinitions({ localPrincipal: () => session.principal }).all),
    storage: session.storage, clock, ids, authz: allowAllAuthz });
  return { bus, async command(name, input) {
    const result = await bus.dispatch({ actor: { kind: 'user', id: session.principal, roles: ['member'] }, tenantId: session.principal }, name, input, { idempotencyKey: ids.next() });
    if (!result.ok) throw new Error(result.error.code); return result.value.value;
  } };
}
async function rawRows(indexedDB: IDBFactory, name: string) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(`classrup-vault:${name}`); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  try {
    return await Promise.all([...db.objectStoreNames].map(table => new Promise<unknown[]>((resolve, reject) => {
      const request = db.transaction(table).objectStore(table).getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    })));
  } finally { db.close(); }
}

it('persists encrypted owner preferences through reopen and signed encrypted backup without coordinates or foreign-owner admission', async () => {
  const indexedDB = new IDBFactory(); const codecs = locationBackupCodecs(backupCodec);
  const vault = await openVault({ name: 'location-source', indexedDB, codecs }); const session = await vault.create(passphrase);
  const r = runtime(session);
  await r.command('discovery.location.set_home', { cell5: 'u4pru', publicLevel: 'L1', entryMode: 'device_gps_once', fromGpsOnce: true });
  const stored = await session.storage.read(tx => tx.records.get<LocationSetting>(session.principal, locationSettingRepo.type, session.principal));
  expect(stored?.data).toMatchObject({ homeCell5: 'u4pru', publicLevel: 'L1', changeCount24h: 1 });
  expect(Object.keys(stored!.data).sort()).toEqual(['changeCount24h', 'changeTimes', 'entryMode', 'homeCell5', 'lastChangedAt', 'ownerDid', 'publicLevel', 'settingId']);
  const raw = JSON.stringify(await rawRows(indexedDB, 'location-source'));
  for (const privateValue of ['u4pru', '57.64911', '10.40744', 'device_gps_once']) expect(raw).not.toContain(privateValue);
  const backup = await session.exportBackup(passphrase);
  expect(JSON.stringify(backup)).not.toContain('u4pru'); await session.lock();
  const reopened = await openVault({ name: 'location-source', indexedDB, codecs }); const reopenedSession = await reopened.unlock(passphrase);
  expect(await reopenedSession.storage.read(tx => tx.records.get(reopenedSession.principal, locationSettingRepo.type, reopenedSession.principal)?.data)).toEqual(stored?.data);
  await reopenedSession.lock();
  const destination = await openVault({ name: 'location-restored', indexedDB, codecs }); const restored = await destination.restoreBackup(backup, passphrase);
  const restoredRow = await restored.storage.read(tx => tx.records.get<LocationSetting>(restored.principal, locationSettingRepo.type, restored.principal));
  expect(restoredRow?.data).toEqual({ ...stored!.data, lastChangedAt: undefined, changeTimes: [], changeCount24h: 0 });
  const codec = codecs[0]!;
  await expect(codec.restoreData!(stored!.data, 'did:key:another')).rejects.toThrow('another principal');
  for (const extra of [{ homeCell5: 'u4pruy' }, { position: { lat: 57.64911, lon: 10.40744 } }, { publicLevel: 'L3' }]) {
    expect(() => codec.parse({ ...stored!.data, ...extra })).toThrow();
  }
  await restored.lock();
}, 30_000);

it('snaps GPS synchronously, returns only a coarse tile and requests no high-accuracy or cached position', async () => {
  const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>((success, _error, options) => {
    expect(options).toEqual({ enableHighAccuracy: false, maximumAge: 0, timeout: 10_000 });
    success({ coords: { latitude: 57.64911, longitude: 10.40744 } } as GeolocationPosition);
  });
  expect(await requestCoarsePosition({ getCurrentPosition })).toEqual({ ok: true, cell5: 'u4pru' });
});

it('falls back on denied, invalid, thrown and timed-out device positions without revealing provider errors', async () => {
  const providers: Pick<Geolocation, 'getCurrentPosition'>[] = [
    { getCurrentPosition: (_success, error) => error?.({ message: 'private provider details' } as GeolocationPositionError) },
    { getCurrentPosition: success => success({ coords: { latitude: Infinity, longitude: 10 } } as GeolocationPosition) },
    { getCurrentPosition: () => { throw new Error('private provider details'); } },
  ];
  for (const provider of providers) expect(await requestCoarsePosition(provider)).toEqual({ ok: false, reason: 'unavailable' });
  vi.useFakeTimers(); const pending = requestCoarsePosition({ getCurrentPosition: () => {} });
  await vi.advanceTimersByTimeAsync(10_000); expect(await pending).toEqual({ ok: false, reason: 'unavailable' });
  expect(await requestCoarsePosition(undefined)).toEqual({ ok: false, reason: 'unavailable' });
});

it('aborts an in-flight device request on lock and ignores any later position', async () => {
  const controller = new AbortController(); let success!: PositionCallback;
  const pending = requestCoarsePosition({ getCurrentPosition: fn => { success = fn; } }, controller.signal);
  controller.abort(); expect(await pending).toEqual({ ok: false, reason: 'cancelled' });
  success({ coords: { latitude: 57.64911, longitude: 10.40744 } } as GeolocationPosition);
  expect(await pending).toEqual({ ok: false, reason: 'cancelled' });
});

function mount(geolocation?: Pick<Geolocation, 'getCurrentPosition'>) {
  const nodes: NodeStub[] = [];
  vi.stubGlobal('document', { createElement(tag: string) { const n = new NodeStub(tag); nodes.push(n); return n; } });
  const queue = createActionQueue(); const tasks: Promise<void>[] = [];
  const command = vi.fn(async (_name: string, _input: unknown) => undefined);
  const query = vi.fn(async (_name: string, _input: unknown): Promise<unknown> => ({ publicLevel: 'L1', homeCell5: 'u4pru', publicCell: 'u4pr', revision: 1 }));
  const message = vi.fn(); const applyToListing = vi.fn(); const applyToSearch = vi.fn(); const container = new NodeStub('section');
  const ui = mountLocationPreferences({ container: container as unknown as HTMLElement, command, query, message, applyToListing, applyToSearch, ...(geolocation ? { geolocation } : {}),
    action(fn) { const task = queue(fn); tasks.push(task); return task; } });
  return { ui, nodes, command, query, queue, tasks, message, applyToListing, applyToSearch, container };
}

it('only copies a saved projection after explicit action, and never copies hidden location to a listing', async () => {
  const f = mount(); await f.ui.refresh();
  expect(f.applyToListing).not.toHaveBeenCalled(); expect(f.applyToSearch).not.toHaveBeenCalled();
  f.nodes.find(n => n.id === 'location-use-listing')!.fire('click'); await Promise.all(f.tasks);
  expect(f.applyToListing).toHaveBeenCalledWith('u4pr');
  f.nodes.find(n => n.id === 'location-use-search')!.fire('click'); await Promise.all(f.tasks);
  expect(f.applyToSearch).toHaveBeenCalledWith('u4pru');
  f.query.mockResolvedValueOnce({ publicLevel: 'L0', homeCell5: 'u4pru', revision: 2 }); await f.ui.refresh();
  expect(f.nodes.find(n => n.id === 'location-use-listing')!.hidden).toBe(true);
  f.nodes.find(n => n.id === 'location-use-listing')!.fire('click'); await Promise.all(f.tasks);
  expect(f.applyToListing).toHaveBeenCalledTimes(1); f.ui.destroy();
});

it('drops queued saves and late private refreshes after disposal', async () => {
  const f = mount(); await f.ui.refresh(); let release!: () => void;
  const blocked = f.queue(() => new Promise<void>(resolve => { release = resolve; }));
  await Promise.resolve(); f.nodes.find(n => n.tag === 'form')!.fire('submit');
  let deliver!: (value: unknown) => void;
  f.query.mockImplementationOnce(() => new Promise(resolve => { deliver = resolve; }));
  const late = f.ui.refresh(); f.ui.destroy();
  release(); deliver({ publicLevel: 'L2', homeCell5: 'c2b2q', publicCell: 'c2b2q', revision: 9 });
  await Promise.all([blocked, late, ...f.tasks]);
  expect(f.command).not.toHaveBeenCalled(); expect(f.message).not.toHaveBeenCalled();
  expect(f.container.children).toEqual([]); expect(f.nodes.find(n => n.id === 'location-home-cell')!.value).toBe('');
  f.query.mockClear(); await f.ui.refresh(); expect(f.query).not.toHaveBeenCalled();
});

it('withholds saved copy actions when the preview shows unsaved lower precision or another home', async () => {
  const f = mount();
  f.query.mockResolvedValueOnce({ publicLevel: 'L2', homeCell5: 'u4pru', publicCell: 'u4pru', revision: 1 });
  await f.ui.refresh();
  const listing = f.nodes.find(n => n.id === 'location-use-listing')!;
  const search = f.nodes.find(n => n.id === 'location-use-search')!;
  const level = f.nodes.find(n => n.id === 'location-public-level')!;
  level.value = 'L0'; level.fire('change');
  expect(listing.hidden).toBe(true); expect(search.hidden).toBe(true);
  listing.fire('click'); search.fire('click'); await Promise.all(f.tasks);
  expect(f.applyToListing).not.toHaveBeenCalled(); expect(f.applyToSearch).not.toHaveBeenCalled();
  await f.ui.refresh();
  const home = f.nodes.find(n => n.id === 'location-home-cell')!;
  home.value = 'c2b2q'; home.fire('input');
  listing.fire('click'); search.fire('click'); await Promise.all(f.tasks);
  expect(f.applyToListing).not.toHaveBeenCalled(); expect(f.applyToSearch).not.toHaveBeenCalled();
  f.ui.destroy();
});

it('manual input releases a pending GPS action and later device callbacks cannot replace the draft', async () => {
  let success!: PositionCallback;
  const f = mount({ getCurrentPosition: callback => { success = callback; } }); await f.ui.refresh();
  f.nodes.find(n => n.id === 'location-gps-once')!.fire('click'); await Promise.resolve();
  expect(success).toBeTypeOf('function');
  const home = f.nodes.find(n => n.id === 'location-home-cell')!;
  home.value = 'c2b2q'; home.fire('input');
  await Promise.all(f.tasks);
  success({ coords: { latitude: 57.64911, longitude: 10.40744 } } as GeolocationPosition);
  expect(home.value).toBe('c2b2q');
  expect(f.nodes.find(n => n.id === 'location-status')!.textContent).toContain('Unsaved');
  expect(f.command).not.toHaveBeenCalled(); f.ui.destroy();
});

it('preserves edits made during a save and refreshes the revision used by the next save', async () => {
  const f = mount(); await f.ui.refresh();
  const home = f.nodes.find(n => n.id === 'location-home-cell')!;
  const form = f.nodes.find(n => n.tag === 'form')!;
  home.value = 'c2b2q'; home.fire('input');
  let finishSave!: () => void;
  f.command.mockImplementationOnce(() => new Promise<undefined>(resolve => { finishSave = () => resolve(undefined); }));
  f.query.mockResolvedValueOnce({ publicLevel: 'L1', homeCell5: 'c2b2q', publicCell: 'c2b2', revision: 2 });
  form.fire('submit'); await Promise.resolve();
  home.value = 'dr5ru'; home.fire('input'); finishSave(); await Promise.all(f.tasks);
  expect(home.value).toBe('dr5ru'); expect(f.nodes.find(n => n.id === 'location-use-listing')!.hidden).toBe(true);
  form.fire('submit'); await Promise.all(f.tasks);
  expect(f.command).toHaveBeenLastCalledWith('discovery.location.set_home', expect.objectContaining({ cell5: 'dr5ru', expectedRevision: 2 }));
  f.ui.destroy();
});

it('saves a second queued edit against the revision from the first save', async () => {
  const f = mount(); await f.ui.refresh();
  const home = f.nodes.find(n => n.id === 'location-home-cell')!;
  const form = f.nodes.find(n => n.tag === 'form')!;
  let finishFirst!: () => void;
  f.command.mockImplementationOnce(() => new Promise<undefined>(resolve => { finishFirst = () => resolve(undefined); }));
  f.query.mockResolvedValueOnce({ publicLevel: 'L1', homeCell5: 'c2b2q', publicCell: 'c2b2', revision: 2 });
  home.value = 'c2b2q'; home.fire('input'); form.fire('submit'); await Promise.resolve();
  home.value = 'dr5ru'; home.fire('input'); form.fire('submit');
  finishFirst(); await Promise.all(f.tasks);
  expect(f.command).toHaveBeenNthCalledWith(1, 'discovery.location.set_home', expect.objectContaining({ cell5: 'c2b2q', expectedRevision: 1 }));
  expect(f.command).toHaveBeenNthCalledWith(2, 'discovery.location.set_home', expect.objectContaining({ cell5: 'dr5ru', expectedRevision: 2 }));
  f.ui.destroy();
});
