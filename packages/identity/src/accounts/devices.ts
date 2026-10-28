/**
 * F07.S01.M03 (key rotation half): device key lifecycle. Every key bound to an account is proven
 * by a proof-of-possession signature from its own private key, and every change to the key set is
 * authorized by a signature from a key that is active at that moment (bound to `keyEpoch`).
 */
import type { CommandContext } from '@classrup/kernel';
import { assertVersion, canonicalize, conflict, forbidden, parse, precondition, runCommand, unauthenticated, validationError, z } from '@classrup/kernel';
import type { SignedEnvelope } from '@classrup/security';
import { boxKeyId, fromBase64Url, keyIdOf, verifyEnvelope } from '@classrup/security';
import type { IdentityEnv } from '../env';
import { authorize, checkFlag, EVENTS, event, FLAGS, ownerRef, requireAccount } from '../env';
import type { AccountRecord, DeviceEntry } from '../records';
import type { DeviceInput } from '../schemas';
import { deviceInputSchema, envelopeSchema, expectedVersionSchema, toEnvelope } from '../schemas';
import { revokeAccountSessions } from './sessions';
import { activeDevices, toAccountDto } from './model';
import type { AccountDto, DeviceDto } from './model';

export const MAX_ACTIVE_DEVICES = 10;
const BINDING_CONTEXT = 'device-binding';
const ROTATION_CONTEXT = 'device-rotation';

export type BindingPurpose = 'register' | 'recover' | 'add_device';
export type RotationAction = 'add_device' | 'revoke_device' | 'issue_recovery';

export interface BoundDevice {
  readonly signingKeyId: string;
  readonly boxKeyId: string;
  readonly label?: string;
}

function keyBytes(text: string): Uint8Array {
  const bytes = fromBase64Url(text);
  if (bytes.length !== 32) throw validationError('IDENTITY.KEY_INVALID', 'public key must be 32 bytes');
  return bytes;
}

/** Verifies the new device's proof-of-possession so nobody can register a key they do not hold. */
export function verifyDeviceBinding(device: DeviceInput, proof: SignedEnvelope<unknown>, purpose: BindingPurpose, subject: string): BoundDevice {
  const signingKeyId = keyIdOf(keyBytes(device.signingPublicKey));
  const boxId = boxKeyId(keyBytes(device.boxPublicKey));
  const expected = { purpose, subject, signingKeyId, boxKeyId: boxId };
  const ok = verifyEnvelope(proof, BINDING_CONTEXT, signingKeyId) && canonicalize(proof.payload) === canonicalize(expected);
  if (!ok) throw unauthenticated('IDENTITY.KEY_PROOF_INVALID', 'device key proof of possession failed');
  return { signingKeyId, boxKeyId: boxId, ...(device.label !== undefined ? { label: device.label } : {}) };
}

/** Authorization for any change to the key set or recovery codes: a signature from a currently active key. */
export function verifyRotationAuth(account: AccountRecord, auth: SignedEnvelope<unknown>, action: RotationAction, target: string): void {
  const signerActive = activeDevices(account).some((d) => d.signingKeyId === auth.signer);
  const expected = { action, accountId: account.id, target, keyEpoch: account.keyEpoch };
  const ok = signerActive && verifyEnvelope(auth, ROTATION_CONTEXT, auth.signer) && canonicalize(auth.payload) === canonicalize(expected);
  if (!ok) throw unauthenticated('IDENTITY.ROTATION_UNAUTHORIZED', 'key change must be signed by a currently active device key');
}

export function newDevice(env: IdentityEnv, bound: BoundDevice, now: number): DeviceEntry {
  return {
    id: env.deps.ids.next('dev'),
    signingKeyId: bound.signingKeyId,
    boxKeyId: bound.boxKeyId,
    status: 'active',
    addedAt: now,
    ...(bound.label !== undefined ? { label: bound.label } : {}),
  };
}

export const revokeAll = (devices: readonly DeviceEntry[], now: number): DeviceEntry[] =>
  devices.map((d) => (d.status === 'active' ? { ...d, status: 'revoked' as const, revokedAt: now } : d));

const addSchema = z
  .object({ device: deviceInputSchema, proof: envelopeSchema, authorization: envelopeSchema, expectedVersion: expectedVersionSchema })
  .strict();
const revokeSchema = z.object({ signingKeyId: z.string().max(120), authorization: envelopeSchema, expectedVersion: expectedVersionSchema }).strict();

export interface DeviceService {
  add(ctx: CommandContext, input: z.input<typeof addSchema>): AccountDto;
  revoke(ctx: CommandContext, input: z.input<typeof revokeSchema>): AccountDto;
  list(ctx: CommandContext): DeviceDto[];
}

export function createDeviceService(env: IdentityEnv): DeviceService {
  const { deps, stores, ports } = env;

  const notifyOwner = (ctx: CommandContext, accountId: string, template: string): void =>
    deps.store.afterCommit(() =>
      ports.notifier.notify({ tenantId: ctx.actor.tenantId, recipientId: accountId, topic: 'security.account', template, data: {}, priority: 'high' }),
    );

  return {
    add(ctx, input) {
      const i = parse(addSchema, input);
      authorize(env, ctx, 'identity.device:add', ownerRef('account', ctx.actor.id, ctx.actor.tenantId, ctx.actor.id));
      return runCommand(deps, ctx, { name: 'identity.device.add', flag: FLAGS.recovery, request: i }, () => {
        const account = requireAccount(env, ctx.actor.id, ctx.actor.tenantId);
        assertVersion('account', account.version, i.expectedVersion);
        if (account.status !== 'active') throw forbidden('IDENTITY.ACCOUNT_INACTIVE', 'account is not active');
        const bound = verifyDeviceBinding(i.device, toEnvelope(i.proof), 'add_device', account.id);
        verifyRotationAuth(account, toEnvelope(i.authorization), 'add_device', bound.signingKeyId);
        if (account.devices.some((d) => d.status === 'active' && d.signingKeyId === bound.signingKeyId)) {
          throw conflict('IDENTITY.DEVICE_EXISTS', 'device key already registered');
        }
        if (activeDevices(account).length >= MAX_ACTIVE_DEVICES) throw precondition('IDENTITY.DEVICE_LIMIT', 'too many active devices', { max: MAX_ACTIVE_DEVICES });
        const device = newDevice(env, bound, deps.clock.now());
        const stored = stores.accounts.put(
          { ...account, devices: [...account.devices, device], keyEpoch: account.keyEpoch + 1, updatedAt: deps.clock.now() },
          account.version,
        );
        notifyOwner(ctx, account.id, 'identity.device_added');
        return {
          result: toAccountDto(stored),
          events: [event(EVENTS.deviceAdded, 'account', account.id, stored.version, { accountId: account.id, deviceId: device.id, signingKeyId: device.signingKeyId })],
        };
      });
    },

    revoke(ctx, input) {
      const i = parse(revokeSchema, input);
      authorize(env, ctx, 'identity.device:revoke', ownerRef('account', ctx.actor.id, ctx.actor.tenantId, ctx.actor.id));
      return runCommand(deps, ctx, { name: 'identity.device.revoke', flag: FLAGS.recovery, request: i }, () => {
        const account = requireAccount(env, ctx.actor.id, ctx.actor.tenantId);
        assertVersion('account', account.version, i.expectedVersion);
        verifyRotationAuth(account, toEnvelope(i.authorization), 'revoke_device', i.signingKeyId);
        const target = account.devices.find((d) => d.status === 'active' && d.signingKeyId === i.signingKeyId);
        if (!target) throw conflict('IDENTITY.DEVICE_NOT_ACTIVE', 'no active device with that key');
        if (activeDevices(account).length <= 1) throw precondition('IDENTITY.LAST_DEVICE', 'cannot revoke the only active device; use recovery');
        const now = deps.clock.now();
        const devices = account.devices.map((d) => (d.id === target.id ? { ...d, status: 'revoked' as const, revokedAt: now } : d));
        const stored = stores.accounts.put({ ...account, devices, keyEpoch: account.keyEpoch + 1, updatedAt: now }, account.version);
        const sessionEvents = revokeAccountSessions(env, account.id, 'device_revoked', { signingKeyId: target.signingKeyId });
        notifyOwner(ctx, account.id, 'identity.device_revoked');
        return {
          result: toAccountDto(stored),
          events: [
            event(EVENTS.deviceRevoked, 'account', account.id, stored.version, { accountId: account.id, deviceId: target.id, signingKeyId: target.signingKeyId }),
            ...sessionEvents,
          ],
        };
      });
    },

    list(ctx) {
      authorize(env, ctx, 'identity.device:read', ownerRef('account', ctx.actor.id, ctx.actor.tenantId, ctx.actor.id));
      checkFlag(env, ctx, FLAGS.recovery);
      return toAccountDto(requireAccount(env, ctx.actor.id, ctx.actor.tenantId)).devices.slice();
    },
  };
}
