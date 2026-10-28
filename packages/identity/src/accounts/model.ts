/** Account projections: owner DTO, public DTO and the cross-feature AccountSnapshot. */
import type { AccountSnapshot, AccountStatus, Role } from '@classrup/kernel';
import type { AccountRecord, DeviceEntry } from '../records';

export interface DeviceDto {
  readonly id: string;
  readonly signingKeyId: string;
  readonly boxKeyId: string;
  readonly label?: string;
  readonly status: 'active' | 'revoked';
  readonly addedAt: number;
  readonly revokedAt?: number;
}

export interface AccountDto {
  readonly id: string;
  readonly tenantId: string;
  readonly pseudonym: string;
  readonly status: AccountStatus;
  readonly roles: readonly Role[];
  readonly devices: readonly DeviceDto[];
  readonly keyEpoch: number;
  readonly createdAt: number;
  readonly version: number;
}

export interface PublicAccountDto {
  readonly id: string;
  readonly pseudonym: string;
  readonly active: boolean;
  readonly createdAt: number;
}

export const activeDevices = (a: AccountRecord): DeviceEntry[] => a.devices.filter((d) => d.status === 'active');

export const activeSigningKeyIds = (a: AccountRecord): string[] => activeDevices(a).map((d) => d.signingKeyId);

const toDeviceDto = (d: DeviceEntry): DeviceDto => ({
  id: d.id,
  signingKeyId: d.signingKeyId,
  boxKeyId: d.boxKeyId,
  status: d.status,
  addedAt: d.addedAt,
  ...(d.label !== undefined ? { label: d.label } : {}),
  ...(d.revokedAt !== undefined ? { revokedAt: d.revokedAt } : {}),
});

export const toAccountDto = (a: AccountRecord): AccountDto => ({
  id: a.id,
  tenantId: a.tenantId,
  pseudonym: a.pseudonym,
  status: a.status,
  roles: a.roles,
  devices: a.devices.map(toDeviceDto),
  keyEpoch: a.keyEpoch,
  createdAt: a.createdAt,
  version: a.version,
});

export const toPublicAccountDto = (a: AccountRecord): PublicAccountDto => ({
  id: a.id,
  pseudonym: a.pseudonym,
  active: a.status === 'active',
  createdAt: a.createdAt,
});

export const toSnapshot = (a: AccountRecord): AccountSnapshot => ({
  id: a.id,
  tenantId: a.tenantId,
  pseudonym: a.pseudonym,
  status: a.status,
  signingKeyIds: activeSigningKeyIds(a),
  boxKeyIds: activeDevices(a).map((d) => d.boxKeyId),
  createdAt: a.createdAt,
});
