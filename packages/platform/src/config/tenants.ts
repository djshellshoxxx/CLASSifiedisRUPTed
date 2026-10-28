/**
 * F15.S04.M03 tenants: per-tenant configuration with optimistic concurrency and an explicit
 * active <-> suspended state machine. `operatorAccountId` is the payee for paid promotions.
 */
import type { Collection, DataStore, Versioned } from '@classrup/kernel';
import { assertTransition, assertVersion, conflict, notFound, precondition } from '@classrup/kernel';

export type TenantStatus = 'active' | 'suspended';

export interface TenantRecord extends Versioned {
  readonly name: string;
  readonly status: TenantStatus;
  readonly defaultCurrency: string;
  readonly defaultLocale: string;
  /** ISO 3166-1 alpha-2 country, optionally with ISO 3166-2 subdivision. */
  readonly jurisdiction: string;
  /** Numeric overrides of platform limits, e.g. `listings.max_active`. */
  readonly limits: Readonly<Record<string, number>>;
  readonly operatorAccountId: string;
  readonly suspendedReason?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export type TenantInput = Pick<TenantRecord, 'name' | 'defaultCurrency' | 'defaultLocale' | 'jurisdiction' | 'limits' | 'operatorAccountId'>;
export type TenantPatch = Partial<TenantInput>;

/** Read-only view other features consume (wired by the relay). */
export interface TenantLookup {
  get(tenantId: string): TenantRecord | undefined;
}

export const TENANTS_COLLECTION = 'platform_tenants';

export const TENANT_TRANSITIONS: Readonly<Record<TenantStatus, readonly TenantStatus[]>> = {
  active: ['suspended'],
  suspended: ['active'],
};

export class TenantService implements TenantLookup {
  readonly #tenants: Collection<TenantRecord>;

  constructor(store: DataStore) {
    this.#tenants = store.collection<TenantRecord>(TENANTS_COLLECTION);
  }

  get(tenantId: string): TenantRecord | undefined {
    return this.#tenants.get(tenantId);
  }

  require(tenantId: string): TenantRecord {
    const t = this.#tenants.get(tenantId);
    if (!t) throw notFound('TENANT.NOT_FOUND', 'tenant not found', { tenantId });
    return t;
  }

  list(): TenantRecord[] {
    return this.#tenants.list().sort((a, b) => (a.id < b.id ? -1 : 1));
  }

  /** Guard for any command that acts for a tenant: unknown tenants and suspended tenants are refused. */
  assertTenantActive(tenantId: string): TenantRecord {
    const t = this.require(tenantId);
    if (t.status !== 'active') throw precondition('TENANT.SUSPENDED', 'tenant is suspended', { tenantId });
    return t;
  }

  /** Effective limit: tenant override when configured, otherwise the supplied platform default. */
  limit(tenantId: string, key: string, fallback: number): number {
    return this.#tenants.get(tenantId)?.limits[key] ?? fallback;
  }

  create(id: string, input: TenantInput, now: number): TenantRecord {
    if (this.#tenants.get(id)) throw conflict('TENANT.EXISTS', 'tenant already exists', { tenantId: id });
    return this.#tenants.put({ id, ...input, status: 'active', createdAt: now, updatedAt: now }, 0);
  }

  update(id: string, patch: TenantPatch, now: number, expectedVersion?: number): TenantRecord {
    const current = this.require(id);
    assertVersion('tenant', current.version, expectedVersion);
    return this.#tenants.put({ ...current, ...patch, updatedAt: now }, current.version);
  }

  suspend(id: string, reason: string, now: number, expectedVersion?: number): TenantRecord {
    const current = this.require(id);
    assertVersion('tenant', current.version, expectedVersion);
    assertTransition('TENANT', current.status, 'suspended', TENANT_TRANSITIONS);
    return this.#tenants.put({ ...current, status: 'suspended', suspendedReason: reason, updatedAt: now }, current.version);
  }

  reactivate(id: string, now: number, expectedVersion?: number): TenantRecord {
    const current = this.require(id);
    assertVersion('tenant', current.version, expectedVersion);
    assertTransition('TENANT', current.status, 'active', TENANT_TRANSITIONS);
    const { suspendedReason: _reason, ...rest } = current;
    return this.#tenants.put({ ...rest, status: 'active', updatedAt: now }, current.version);
  }
}
