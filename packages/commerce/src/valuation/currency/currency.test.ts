import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { openIndexedDbStorage, type VaultLocks } from '@classrup/kernel/browser';
import { allowAllAuthz, createBus, type Storage, appError, defineCommand, defineQuery, err, ok, z, type Actor } from '@classrup/kernel';
import { createTestKernel } from '@classrup/kernel/testing';
import { didFromPublicKey, encodeBase64url } from '@classrup/security';
import { checksumEthereumContract, currencyDefinitions, currencySnapshotSigningBytes, resolveCurrency, resolvePrecisionCurrency, verifyCurrencySnapshot,
  type CurrencyDef, type CurrencySnapshotPayload, type CurrencyUsagePort, type VerifiedCurrencySnapshot } from './index.ts';

type Res = { ok: boolean; value?: unknown; error?: { code: string; params?: Record<string, unknown> } };
function val<T>(r: Res): T { if (!r.ok) throw new Error(r.error?.code); return (r.value as { value: T }).value; }
function result<T>(r: { ok: true; value: T } | { ok: false; error: unknown }): T { if (!r.ok) throw new Error('Expected result'); return r.value; }
const code = (r: Res) => r.ok ? 'ok' : r.error?.code;
const contract = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const fixture: CurrencySnapshotPayload = { schema: 'classrup.commerce.currency_snapshot/v1', version: '2026-01-01', sourceUrl: 'https://example.test/fixture-only', assets: [
  { code: 'USD', kind: 'fiat', name: 'US Dollar', decimals: 2 }, { code: 'CAD', kind: 'fiat', name: 'Canadian Dollar', decimals: 2 }, { code: 'JPY', kind: 'fiat', name: 'Yen', decimals: 0 },
  { code: 'BTC', kind: 'crypto', name: 'Bitcoin', decimals: 8, chainId: 'bitcoin-mainnet' }, { code: 'ETH', kind: 'crypto', name: 'Ether', decimals: 18, chainId: 'ethereum-mainnet' },
  { code: 'USDC', kind: 'crypto', name: 'USD Coin', decimals: 6, chainId: 'ethereum-mainnet', contract },
] };
async function signed(payload = structuredClone(fixture)) {
  const key = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const signerDid = didFromPublicKey(new Uint8Array(await crypto.subtle.exportKey('raw', key.publicKey)));
  const signature = encodeBase64url(new Uint8Array(await crypto.subtle.sign('Ed25519', key.privateKey, currencySnapshotSigningBytes(payload))));
  return { payload, signerDid, signature };
}
async function setup(usage?: CurrencyUsagePort) {
  const k = createTestKernel();
  const envelope = await signed();
  const snapshot = result(await verifyCurrencySnapshot(envelope, envelope.signerDid));
  let enabled = true;
  const defs = currencyDefinitions({ localPrincipal: () => k.actor.kind === 'user' ? k.actor.id : '', snapshot, vaultId: k.tenantId, configuredChains: ['bitcoin-mainnet', 'ethereum-mainnet'], allowedCurrencies: ['CAD', 'BTC'], cryptoEnabled: () => enabled, ...(usage ? { usage } : {}) });
  k.registry.add(...defs.all, defineQuery({ name: 'test.currency.precision', module: 'F09.S03.M01', capability: 'test.currency.precision', input: z.strictObject({ code: z.string() }), handler: (ctx, input) => resolvePrecisionCurrency(ctx.tx, input.code, true) }), defineQuery({ name: 'test.currency.resolve', module: 'F09.S03.M01', capability: 'test.currency.resolve', input: z.strictObject({ code: z.string(), forNewUse: z.boolean() }), handler: (ctx, input) => resolveCurrency(ctx.tx, input.code, input.forNewUse) }), defineCommand({ name: 'test.currency.seed', module: 'F09.S03.M01', capability: 'test.currency.seed', idempotent: true, input: z.strictObject({ abort: z.boolean().default(false) }), handler(ctx, input) {
    const outcome = defs.seed(ctx); return input.abort && outcome.ok ? err(appError('PRECONDITION_FAILED')) : outcome;
  } }));
  const seed = () => k.cmd('test.currency.seed', {});
  const get = (code: string) => k.ask('commerce.currency.get', { code });
  const list = (input: unknown = { status: 'all' }) => k.ask('commerce.currency.list', input);
  const register = (code: string, over: Record<string, unknown> = {}) => k.cmd('commerce.currency.register', { code, kind: 'crypto', name: 'Fixture Token', decimals: 6, chainId: 'ethereum-mainnet', contract: contract.toLowerCase(), confirmed: true, ...over });
  const status = async (code: string, status: 'active' | 'disabled' | 'retired') => { const row = val<CurrencyDef>(await get(code)); return k.cmd('commerce.currency.set_status', { currencyId: row.id, expectedRevision: row.revision, status }); };
  const resolve = (code: string, forNewUse: boolean) => k.ask('test.currency.resolve', { code, forNewUse });
  return { k, snapshot, defs, seed, get, list, register, status, resolve, setEnabled: (value: boolean) => { enabled = value; } };
}

describe('Currency registry authenticated-reference checkpoint', () => {
  it('requires the configured snapshot signer and exact immutable signed bytes; rejects duplicate or malformed assets', async () => {
    const envelope = await signed();
    expect((await verifyCurrencySnapshot(envelope, envelope.signerDid)).ok).toBe(true);
    const attacker = await signed();
    expect(code(await verifyCurrencySnapshot(envelope, attacker.signerDid))).toBe('PRECONDITION_FAILED');
    const changed = structuredClone(envelope); changed.payload.assets[0]!.decimals = 3;
    expect(code(await verifyCurrencySnapshot(changed, changed.signerDid))).toBe('PRECONDITION_FAILED');
    const duplicate = await signed({ ...fixture, assets: [...fixture.assets, fixture.assets[0]!] });
    expect(code(await verifyCurrencySnapshot(duplicate, duplicate.signerDid))).toBe('VALIDATION_FAILED');
    const badContract = await signed({ ...fixture, assets: [...fixture.assets, { code: 'BAD', kind: 'crypto', name: 'Bad', decimals: 6, chainId: 'ethereum-mainnet', contract: '0x0000000000000000000000000000000000000000' }] });
    expect(code(await verifyCurrencySnapshot(badContract, badContract.signerDid))).toBe('VALIDATION_FAILED');
    const e = await setup();
    expect(Object.isFrozen(e.snapshot.payload.assets[0])).toBe(true);
    expect(() => currencyDefinitions({ localPrincipal: () => '', snapshot: structuredClone(e.snapshot) as VerifiedCurrencySnapshot, vaultId: e.k.tenantId, configuredChains: [], allowedCurrencies: [], cryptoEnabled: () => true })).toThrow('verified');
  });

  it('implements the EIP-55 primary-source vectors and rejects incorrect mixed-case checksums', () => {
    const vectors = ['0x52908400098527886E0F7030069857D2E4169EE7', '0x8617E340B3D01FA5F11F306F4090FD50E238070D', '0xde709f2102306220921060314715629080e2fb77', '0x27b1fdb04752bbc536007a920d24acb045561c26', '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359', '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB', '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb'];
    for (const address of vectors) expect(checksumEthereumContract(address.toLowerCase())).toBe(address);
    expect(checksumEthereumContract('0x5AAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBeUndefined();
    expect(checksumEthereumContract('0x1234')).toBeUndefined();
  });

  it('TEST-PS-073-09.T07 seeds atomically, retries after rollback and preserves the exact allowed list across repeated bootstrap', async () => {
    const e = await setup();
    expect(code(await e.get('CAD'))).toBe('DEPENDENCY_UNAVAILABLE');
    expect(code(await e.k.cmd('test.currency.seed', { abort: true }))).toBe('PRECONDITION_FAILED');
    expect(code(await e.get('CAD'))).toBe('DEPENDENCY_UNAVAILABLE');
    expect(val(await e.seed())).toEqual({ seeded: true, count: 6 });
    expect(val(await e.seed())).toEqual({ seeded: false, count: 6 });
    expect(val<{ items: CurrencyDef[] }>(await e.list()).items).toHaveLength(6);
    expect(val<{ items: CurrencyDef[] }>(await e.list({})).items.map(r => r.code)).toEqual(['BTC', 'CAD']);
    expect(val<CurrencyDef>(await e.get('CAD'))).toMatchObject({ code: 'CAD', kind: 'fiat', decimals: 2, snapshotVersion: '2026-01-01', vaultId: e.k.tenantId, revision: 1 });
  });

  it('TEST-PS-073-09.T01 TEST-PS-073-09.T06 TEST-PS-073-09.T10 registers local crypto with checksummed binding and payload-free audit', async () => {
    const e = await setup(); val(await e.seed());
    const created = val<{ currencyId: string; revision: number }>(await e.register('TOKEN'));
    const row = val<CurrencyDef>(await e.get('TOKEN'));
    expect(row).toMatchObject({ id: created.currencyId, revision: 1, kind: 'crypto', decimals: 6, chainId: 'ethereum-mainnet', contract });
    expect(e.k.events.filter(e => e.type === 'commerce.currency.registered')).toHaveLength(1);
    expect(JSON.stringify(e.k.events)).not.toContain(contract);
    expect(JSON.stringify(e.k.audit)).not.toContain('Fixture Token');
    expect(e.k.audit.some(a => a.operation === 'commerce.currency.register' && a.outcome === 'ok')).toBe(true);
  });

  it('TEST-PS-073-09.T02 fails closed on unknown codes, chain/checksum conflicts, absent confirmation and unsupported flags', async () => {
    const e = await setup(); val(await e.seed());
    const unknown = await e.get('XXX9'); expect(code(unknown)).toBe('COMMERCE_CURRENCY_UNKNOWN'); if (!unknown.ok) expect(unknown.error.params).toEqual({ code: 'XXX9' });
    expect(code(await e.register('CAD'))).toBe('COMMERCE_CURRENCY_EXISTS');
    expect(code(await e.register('TOK', { chainId: 'unconfigured' }))).toBe('COMMERCE_CURRENCY_CHAIN_UNSUPPORTED');
    expect(code(await e.register('TOK', { chainId: 'bitcoin-mainnet' }))).toBe('COMMERCE_CURRENCY_CHAIN_UNSUPPORTED');
    expect(code(await e.register('TOK', { contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB49' }))).toBe('COMMERCE_CURRENCY_CHAIN_UNSUPPORTED');
    expect(code(await e.register('TOK', { confirmed: false }))).toBe('VALIDATION_FAILED');
    expect(code(await e.register('TOK', { decimals: 37 }))).toBe('VALIDATION_FAILED');
    e.setEnabled(false); expect(code(await e.register('TOK'))).toBe('FEATURE_DISABLED');
    expect(val<{ items: CurrencyDef[] }>(await e.list()).items).toHaveLength(6);
  });

  it('TEST-PS-073-09.T08 refuses peers, anonymous users and cross-vault reads even under allow-all capability policy', async () => {
    const e = await setup(); val(await e.seed());
    for (const actor of [e.k.user(), { kind: 'anonymous' } as Actor]) {
      expect(code(await e.k.ask('commerce.currency.get', { code: 'CAD' }, { actor }))).not.toBe('ok');
      expect(code(await e.k.cmd('commerce.currency.register', { code: 'TOK', kind: 'crypto', name: 'Token', decimals: 6, chainId: 'ethereum-mainnet', confirmed: true }, { actor }))).not.toBe('ok');
    }
    expect(code(await e.k.ask('commerce.currency.get', { code: 'CAD' }, { tenantId: e.k.ids.next() }))).toBe('FORBIDDEN');
    expect(val<{ items: CurrencyDef[] }>(await e.list()).items).toHaveLength(6);
  });

  it('binds initialization, mutations and backup admission to the configured vault scope', async () => {
    const e = await setup(); val(await e.seed());
    const foreign = e.k.ids.next();
    const row = val<CurrencyDef>(await e.get('CAD'));
    const context = { tenantId: foreign };
    expect(code(await e.k.cmd('test.currency.seed', {}, context))).toBe('FORBIDDEN');
    expect(code(await e.k.cmd('commerce.currency.register', { code: 'TOK', kind: 'crypto', name: 'Token', decimals: 6,
      chainId: 'ethereum-mainnet', confirmed: true }, context))).toBe('FORBIDDEN');
    expect(code(await e.k.cmd('commerce.currency.set_status', { currencyId: row.id, status: 'disabled', expectedRevision: row.revision }, context))).toBe('FORBIDDEN');
    expect(code(await e.k.ask('commerce.currency.list', { status: 'all' }, context))).toBe('FORBIDDEN');
    const rows = val<{ items: CurrencyDef[] }>(await e.list()).items;
    const foreignRows = rows.map(row => ({ ...row, vaultId: foreign }));
    expect(code(e.defs.validateImport([], foreignRows))).toBe('FORBIDDEN');
    expect(code(e.defs.validateImport([], [foreignRows[0]!, ...rows.slice(1)]))).toBe('FORBIDDEN');
    expect(val<CurrencyDef>(await e.get('CAD')).status).toBe('active');
  });

  it('TEST-PS-073-09.T04 TEST-PS-073-09.T05 distinguishes readable old money from enabled new use and permanently retires only without open references', async () => {
    let references = 1;
    const e = await setup({ openReferences: () => ok({ offers: references, deals: 0, quotes: 0 }) }); val(await e.seed());
    expect(code(await e.status('CAD', 'retired'))).toBe('CONFLICT_STATE');
    expect(code(await e.status('CAD', 'disabled'))).toBe('ok');
    expect(code(await e.resolve('CAD', false))).toBe('ok');
    expect(code(await e.resolve('CAD', true))).toBe('COMMERCE_CURRENCY_DISABLED');
    expect(code(await e.status('CAD', 'retired'))).toBe('PRECONDITION_FAILED');
    expect(code(await e.status('CAD', 'active'))).toBe('ok');
    expect(code(await e.resolve('CAD', true))).toBe('ok');
    val(await e.status('CAD', 'disabled')); references = 0; val(await e.status('CAD', 'retired'));
    expect(code(await e.status('CAD', 'active'))).toBe('CONFLICT_STATE');
    expect(code(await e.resolve('CAD', false))).toBe('ok');
    expect(code(await e.resolve('CAD', true))).toBe('COMMERCE_CURRENCY_DISABLED');
  });

  it('fails closed when the usage adapter is absent, invalid or cannot resolve all open obligations', async () => {
    for (const usage of [undefined, { openReferences: () => ok({ offers: NaN, deals: 0, quotes: 0 }) }, { openReferences: () => err(appError('DEPENDENCY_UNAVAILABLE')) }]) {
      const e = await setup(usage); val(await e.seed()); val(await e.status('CAD', 'disabled'));
      expect(code(await e.status('CAD', 'retired'))).toBe('DEPENDENCY_UNAVAILABLE');
      expect(val<CurrencyDef>(await e.get('CAD')).status).toBe('disabled');
    }
  });

  it('TEST-PS-073-09.T09 serializes concurrent duplicate registration, replays command IDs and enforces revisions', async () => {
    const e = await setup(); val(await e.seed());
    const concurrent = await Promise.all([e.register('TOK', { decimals: 6 }), e.register('TOK', { decimals: 18 })]);
    expect(concurrent.map(code).sort()).toEqual(['COMMERCE_CURRENCY_EXISTS', 'ok']);
    const row = val<CurrencyDef>(await e.get('TOK'));
    const input = { currencyId: row.id, status: 'disabled', expectedRevision: row.revision };
    const idempotencyKey = e.k.ids.next();
    const first = await e.k.cmd('commerce.currency.set_status', input, { idempotencyKey });
    const replay = await e.k.cmd('commerce.currency.set_status', input, { idempotencyKey });
    expect(val(first)).toEqual(val(replay));
    expect(e.k.events.filter(x => x.type === 'commerce.currency.status_changed')).toHaveLength(1);
    expect(code(await e.k.cmd('commerce.currency.set_status', { ...input, status: 'active' }))).toBe('CONFLICT_REVISION');
    expect(val<CurrencyDef>(await e.get('TOK')).decimals).toBe(6);
  });

  it('bounds successful new registrations at twenty per hour without blocking disable or retirement', async () => {
    const e = await setup(); val(await e.seed());
    for (let i = 0; i < 20; i++) expect(code(await e.register(`T${i.toString().padStart(2, '0')}`))).toBe('ok');
    expect(code(await e.register('FULL'))).toBe('RATE_LIMITED');
    expect(code(await e.status('CAD', 'disabled'))).toBe('ok');
    e.k.clock.set(e.k.clock.now() - 1_000); expect(code(await e.register('FULL'))).toBe('RATE_LIMITED');
    e.k.clock.advance(3_601_000); expect(code(await e.register('FULL'))).toBe('ok');
    const first = val<{ items: CurrencyDef[]; nextCursor?: string }>(await e.list({ status: 'all', limit: 2 }));
    const second = val<{ items: CurrencyDef[] }>(await e.list({ status: 'all', limit: 2, cursor: first.nextCursor }));
    expect(first.items).toHaveLength(2); expect(second.items).toHaveLength(2);
    expect(new Set([...first.items, ...second.items].map(i => i.id)).size).toBe(4);
    expect(code(await e.list({ limit: 201 }))).toBe('VALIDATION_FAILED');
  });

  it('persists registry rows and command responses across IndexedDB reopen and rejects concurrent writers', async () => {
    const e = await setup(); const factory = new IDBFactory();
    let held = false;
    const locks: VaultLocks = { request: async (_name, _options, callback) => {
      if (held) return callback(null);
      held = true; try { return await callback({}); } finally { held = false; }
    } };
    const open = () => openIndexedDbStorage({ name: 'currency-registry-fixture', indexedDB: factory, clock: e.k.clock, locks });
    const busFor = (storage: Storage) => createBus({ registry: e.k.registry, storage, clock: e.k.clock, ids: e.k.ids, authz: allowAllAuthz });
    const ctx = { actor: e.k.actor, tenantId: e.k.tenantId };
    const first = await open(); const bus1 = busFor(first);
    val(await bus1.dispatch(ctx, 'test.currency.seed', {}, { idempotencyKey: e.k.ids.next() }));
    const input = { code: 'TOKEN', kind: 'crypto', name: 'Token', decimals: 6, chainId: 'ethereum-mainnet', contract, confirmed: true };
    const key = e.k.ids.next(); const registered = await bus1.dispatch(ctx, 'commerce.currency.register', input, { idempotencyKey: key }); val(registered);
    await first.close();
    const second = await open(); const bus2 = busFor(second);
    expect(val(await bus2.dispatch(ctx, 'test.currency.seed', {}, { idempotencyKey: e.k.ids.next() }))).toEqual({ seeded: false, count: 6 });
    expect(val(await bus2.dispatch(ctx, 'commerce.currency.register', input, { idempotencyKey: key }))).toEqual(val(registered));
    expect(val<CurrencyDef>(await bus2.query(ctx, 'commerce.currency.get', { code: 'TOKEN' })).contract).toBe(contract);
    await expect(open()).rejects.toMatchObject({ error: { code: 'DEPENDENCY_UNAVAILABLE', params: { reason: 'vault_locked' } } });
    expect(code(await bus2.dispatch(ctx, 'commerce.currency.register', { ...input, code: 'VALID' }, { idempotencyKey: e.k.ids.next() }))).toBe('ok');
    await second.close();
    const third = await open(); const bus3 = busFor(third);
    expect(code(await bus3.query(ctx, 'commerce.currency.get', { code: 'VALID' }))).toBe('ok');
    await third.close();
  });

  it('preserves canonical registry metadata ranges and rejects unsupported downstream precision', async () => {
    const e = await setup(); val(await e.seed());
    val(await e.register('AA', { decimals: 36 }));
    expect(val<CurrencyDef>(await e.get('AA')).decimals).toBe(36);
    expect(code(await e.k.ask('test.currency.precision', { code: 'AA' }))).toBe('PRECONDITION_FAILED');
    expect(code(await e.k.ask('test.currency.precision', { code: 'CAD' }))).toBe('ok');
    expect(code(e.defs.validateImport([], []))).toBe('COMMERCE_CURRENCY_IMMUTABLE');
  });

  it('TEST-PS-073-09.T03 validates immutable backups and refuses reuse of retired or omitted codes', async () => {
    const e = await setup({ openReferences: () => ok({ offers: 0, deals: 0, quotes: 0 }) }); val(await e.seed()); val(await e.register('TOK'));
    val(await e.status('TOK', 'disabled')); val(await e.status('TOK', 'retired'));
    const rows = val<{ items: CurrencyDef[] }>(await e.list()).items;
    expect(e.defs.validateImport([], rows).ok).toBe(true);
    expect(e.defs.validateImport(rows, structuredClone(rows)).ok).toBe(true);
    for (const field of [{ decimals: 18 }, { chainId: 'bitcoin-mainnet' }, { status: 'active' }, { kind: 'fiat' }]) {
      const changed = rows.map(r => r.code === 'TOK' ? { ...r, ...field } : r);
      expect(e.defs.validateImport(rows, changed).ok).toBe(false);
    }
    expect(code(e.defs.validateImport(rows, rows.filter(r => r.code !== 'TOK')))).toBe('COMMERCE_CURRENCY_IMMUTABLE');
    expect(code(e.defs.validateImport(rows, [...rows, rows[0]!]))).toBe('VALIDATION_FAILED');
    const fiat = rows.map(r => r.code === 'CAD' ? { ...r, decimals: 3 } : r);
    expect(code(e.defs.validateImport([], fiat))).toBe('COMMERCE_CURRENCY_IMMUTABLE');
    const defaultCrypto = rows.map(r => r.code === 'USDC' ? { ...r, decimals: 18 } : r);
    expect(code(e.defs.validateImport([], defaultCrypto))).toBe('COMMERCE_CURRENCY_IMMUTABLE');
    const renamed = rows.map(r => r.code === 'CAD' ? { ...r, name: 'Changed' } : r);
    expect(code(e.defs.validateImport(rows, renamed))).toBe('CONFLICT_REVISION');
  });

  it('does not let backup admission enable an unconfigured chain while preserving disabled history', async () => {
    const e = await setup(); val(await e.seed());
    const rows = val<{ items: CurrencyDef[] }>(await e.list()).items;
    const narrowed = currencyDefinitions({ localPrincipal: () => e.k.actor.kind === 'user' ? e.k.actor.id : '',
      vaultId: e.k.tenantId, snapshot: e.snapshot, configuredChains: ['bitcoin-mainnet'],
      allowedCurrencies: ['CAD', 'BTC'], cryptoEnabled: () => true });
    expect(narrowed.validateImport([], rows).ok).toBe(true);
    const activated = rows.map(row => row.code === 'USDC' ? { ...row, status: 'active' as const } : row);
    expect(code(narrowed.validateImport([], activated))).toBe('COMMERCE_CURRENCY_CHAIN_UNSUPPORTED');
  });
});
