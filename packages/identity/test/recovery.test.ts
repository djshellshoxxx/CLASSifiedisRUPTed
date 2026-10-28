import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DomainError, RecordingNotifier } from '@classrup/kernel';
import { keyIdOf } from '@classrup/security';
import { generateRecoveryCodes, normalizeRecoveryCode } from '../src/index';
import { anon, asActor, bindingProof, countingRateLimit, deviceInput, eventsOfType, login, makeWorld, newKeys, register, rotationAuth } from './helpers';

const codeOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    if (e instanceof DomainError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
};

function recoverInput(pseudonym: string, code: string, fresh = newKeys(), subject = '') {
  return {
    fresh,
    input: {
      pseudonym,
      code,
      device: deviceInput(fresh.keys, fresh.box, 'new phone'),
      proof: bindingProof(fresh.keys, fresh.box, 'recover', subject),
    },
  };
}

describe('recovery codes', () => {
  it('generates 80-bit codes that normalise back from user typing variants (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (n) => {
        const codes = generateRecoveryCodes(n);
        return (
          new Set(codes).size === n &&
          codes.every((c) => /^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/.test(c) && normalizeRecoveryCode(c.toLowerCase().replace(/-/g, ' ')) === c.replace(/-/g, ''))
        );
      }),
    );
    expect(codeOf(() => normalizeRecoveryCode('short'))).toBe('IDENTITY.RECOVERY_CODE_INVALID');
  });
});

describe('F07.S01.M03 recovery', () => {
  it('consumes one code, revokes old keys and sessions and lets the new key log in', () => {
    const notifier = new RecordingNotifier();
    const w = makeWorld({ notifier });
    const u = register(w, 'Alice');
    const old = login(w, u);
    const { fresh, input } = recoverInput('alice', u.recoveryCodes[0] as string, newKeys(), u.id);
    const out = w.identity.recovery.recover(anon(), input);
    expect(out.remainingCodes).toBe(9);
    expect(out.lowCodes).toBe(false);
    expect(out.account.keyEpoch).toBe(1);
    expect(out.account.devices.map((d) => d.status)).toEqual(['revoked', 'active']);
    expect(w.identity.authenticate(old.token)).toBeUndefined();
    expect(codeOf(() => login(w, u))).toBe('IDENTITY.LOGIN_FAILED');
    expect(login(w, { ...u, keys: fresh.keys }).actor.id).toBe(u.id);
    const completed = eventsOfType(w, 'identity.recovery.completed')[0]?.payload as { revokedKeyIds: string[]; newSigningKeyId: string };
    expect(completed.revokedKeyIds).toEqual([keyIdOf(u.keys.publicKey)]);
    expect(completed.newSigningKeyId).toBe(keyIdOf(fresh.keys.publicKey));
    expect(notifier.sent.map((n) => n.template)).toEqual(['identity.recovery_completed']);
    expect(w.identity.recovery.status(asActor(login(w, { ...u, keys: fresh.keys }).actor)).remaining).toBe(9);
  });

  it('a code works once; wrong, malformed and cross-account codes fail uniformly', () => {
    const w = makeWorld();
    const u = register(w, 'Bob');
    const v = register(w, 'Cara');
    const code = u.recoveryCodes[3] as string;
    w.identity.recovery.recover(anon(), recoverInput('bob', code, newKeys(), u.id).input);
    expect(codeOf(() => w.identity.recovery.recover(anon(), recoverInput('bob', code, newKeys(), u.id).input))).toBe('IDENTITY.RECOVERY_FAILED');
    expect(codeOf(() => w.identity.recovery.recover(anon(), recoverInput('bob', '0000-0000-0000-0000', newKeys(), u.id).input))).toBe('IDENTITY.RECOVERY_FAILED');
    expect(codeOf(() => w.identity.recovery.recover(anon(), recoverInput('bob', v.recoveryCodes[0] as string, newKeys(), u.id).input))).toBe('IDENTITY.RECOVERY_FAILED');
    expect(codeOf(() => w.identity.recovery.recover(anon(), recoverInput('bob', 'nope', newKeys(), u.id).input))).toBe('IDENTITY.RECOVERY_CODE_INVALID');
    expect(codeOf(() => w.identity.recovery.recover(anon(), recoverInput('nobody', code, newKeys(), u.id).input))).toBe('IDENTITY.RECOVERY_FAILED');
  });

  it('a failed attempt does not burn the code and requires proof of possession of the new key', () => {
    const w = makeWorld();
    const u = register(w, 'Dora');
    const code = u.recoveryCodes[0] as string;
    const mismatch = recoverInput('dora', code, newKeys(), u.id);
    const stranger = newKeys();
    const bad = { ...mismatch.input, proof: bindingProof(stranger.keys, stranger.box, 'recover', u.id) };
    expect(codeOf(() => w.identity.recovery.recover(anon(), bad))).toBe('IDENTITY.KEY_PROOF_INVALID');
    expect(w.identity.recovery.recover(anon(), mismatch.input).remainingCodes).toBe(9);
  });

  it('rate limits attempts per account through the port, counting failures', () => {
    const w = makeWorld({ rateLimit: countingRateLimit(3) });
    const u = register(w, 'Eli');
    const other = register(w, 'Fay');
    for (let i = 0; i < 3; i++) {
      expect(codeOf(() => w.identity.recovery.recover(anon(), recoverInput('eli', '0000-0000-0000-0000', newKeys(), u.id).input))).toBe('IDENTITY.RECOVERY_FAILED');
    }
    expect(codeOf(() => w.identity.recovery.recover(anon(), recoverInput('eli', u.recoveryCodes[0] as string, newKeys(), u.id).input))).toBe('RATE.LIMITED');
    expect(codeOf(() => w.identity.recovery.recover(anon(), recoverInput('fay', '0000-0000-0000-0000', newKeys(), other.id).input))).toBe('IDENTITY.RECOVERY_FAILED');
  });

  it('flags low remaining codes and supports signed re-issue that invalidates the old set', () => {
    const w = makeWorld();
    const u = register(w, 'Gus');
    let current = u.keys;
    let used = 0;
    let out = { remainingCodes: 10, lowCodes: false };
    for (; used < 8; used++) {
      const next = recoverInput('gus', u.recoveryCodes[used] as string, newKeys(), u.id);
      out = w.identity.recovery.recover(anon(), next.input);
      current = next.fresh.keys;
    }
    expect(out).toMatchObject({ remainingCodes: 2, lowCodes: true });
    const s = login(w, { ...u, keys: current }, current);
    const reissued = w.identity.recovery.issue(asActor(s.actor), { authorization: rotationAuth(w, u, 'issue_recovery', 'recovery', current) });
    expect(reissued.codes).toHaveLength(10);
    expect(w.identity.recovery.status(asActor(s.actor)).remaining).toBe(10);
    expect(codeOf(() => w.identity.recovery.recover(anon(), recoverInput('gus', u.recoveryCodes[9] as string, newKeys(), u.id).input))).toBe('IDENTITY.RECOVERY_FAILED');
    const replay = rotationAuth(w, u, 'issue_recovery', 'recovery', current);
    expect(codeOf(() => w.identity.recovery.issue(asActor(s.actor), { authorization: { ...replay, payload: { ...(replay.payload as object), keyEpoch: 0 } } }))).toBe('IDENTITY.ROTATION_UNAUTHORIZED');
  });

  it('keeps recovery codes and hashes out of events and the idempotency fingerprint', () => {
    const w = makeWorld();
    const u = register(w, 'Hal');
    const code = u.recoveryCodes[0] as string;
    w.identity.recovery.recover(anon('recover-key-1'), recoverInput('hal', code, newKeys(), u.id).input);
    const text = JSON.stringify(w.deps.store.events.read());
    expect(text).not.toContain(code.replace(/-/g, ''));
    expect(JSON.stringify(w.deps.store.collection('identity_recovery_sets').list())).not.toContain(code.replace(/-/g, ''));
  });

  it('requires an authenticated owner to read status or issue codes', () => {
    const w = makeWorld();
    const u = register(w, 'Ida');
    const s = login(w, u);
    expect(codeOf(() => w.identity.recovery.status(anon()))).toBe('AUTH.REQUIRED');
    expect(codeOf(() => w.identity.recovery.issue(anon(), { authorization: rotationAuth(w, u, 'issue_recovery', 'recovery') }))).toBe('AUTH.REQUIRED');
    expect(w.identity.recovery.status(asActor(s.actor)).remaining).toBe(10);
  });
});

describe('F07.S01.M03 key rotation', () => {
  it('adds a device authorized by an active key and revokes another, killing its sessions', () => {
    const notifier = new RecordingNotifier();
    const w = makeWorld({ notifier });
    const u = register(w, 'Joan');
    const s = login(w, u);
    const second = newKeys();
    const secondId = keyIdOf(second.keys.publicKey);
    const added = w.identity.devices.add(asActor(s.actor), {
      device: deviceInput(second.keys, second.box, 'tablet'),
      proof: bindingProof(second.keys, second.box, 'add_device', u.id),
      authorization: rotationAuth(w, u, 'add_device', secondId),
    });
    expect(added.devices.filter((d) => d.status === 'active')).toHaveLength(2);
    expect(added.keyEpoch).toBe(1);
    const tablet = login(w, { ...u, keys: second.keys }, second.keys);
    expect(w.identity.accountLookup.get(u.id)?.signingKeyIds).toHaveLength(2);

    const revoked = w.identity.devices.revoke(asActor(s.actor), {
      signingKeyId: secondId,
      authorization: rotationAuth(w, u, 'revoke_device', secondId),
    });
    expect(revoked.devices.find((d) => d.signingKeyId === secondId)?.status).toBe('revoked');
    expect(w.identity.authenticate(tablet.token)).toBeUndefined();
    expect(w.identity.authenticate(s.token)).toBeDefined();
    expect(w.identity.devices.list(asActor(s.actor))).toHaveLength(2);
    expect(notifier.sent.map((n) => n.template)).toEqual(['identity.device_added', 'identity.device_revoked']);
    expect(eventsOfType(w, 'identity.device.added')).toHaveLength(1);
  });

  it('rejects changes not signed by a currently active key, stale epochs and the last device', () => {
    const w = makeWorld();
    const u = register(w, 'Kai');
    const s = login(w, u);
    const second = newKeys();
    const secondId = keyIdOf(second.keys.publicKey);
    const stranger = newKeys();
    const input = (auth: ReturnType<typeof rotationAuth>) => ({
      device: deviceInput(second.keys, second.box),
      proof: bindingProof(second.keys, second.box, 'add_device', u.id),
      authorization: auth,
    });
    expect(codeOf(() => w.identity.devices.add(asActor(s.actor), input(rotationAuth(w, u, 'add_device', secondId, stranger.keys))))).toBe('IDENTITY.ROTATION_UNAUTHORIZED');
    const staleAuth = rotationAuth(w, u, 'add_device', secondId);
    w.identity.devices.add(asActor(s.actor), input(staleAuth));
    expect(codeOf(() => w.identity.devices.add(asActor(s.actor), input(staleAuth)))).toBe('IDENTITY.ROTATION_UNAUTHORIZED');
    expect(codeOf(() => w.identity.devices.add(asActor(s.actor), input(rotationAuth(w, u, 'add_device', secondId))))).toBe('IDENTITY.DEVICE_EXISTS');
    w.identity.devices.revoke(asActor(s.actor), { signingKeyId: secondId, authorization: rotationAuth(w, u, 'revoke_device', secondId) });
    expect(codeOf(() => w.identity.devices.revoke(asActor(s.actor), { signingKeyId: keyIdOf(u.keys.publicKey), authorization: rotationAuth(w, u, 'revoke_device', keyIdOf(u.keys.publicKey)) }))).toBe('IDENTITY.LAST_DEVICE');
    expect(codeOf(() => w.identity.devices.revoke(asActor(s.actor), { signingKeyId: secondId, authorization: rotationAuth(w, u, 'revoke_device', secondId) }))).toBe('IDENTITY.DEVICE_NOT_ACTIVE');
  });

  it('detects concurrent account changes through expectedVersion and enforces owner authorization', () => {
    const w = makeWorld();
    const u = register(w, 'Lou');
    const s = login(w, u);
    const second = newKeys();
    const secondId = keyIdOf(second.keys.publicKey);
    const args = {
      device: deviceInput(second.keys, second.box),
      proof: bindingProof(second.keys, second.box, 'add_device', u.id),
      authorization: rotationAuth(w, u, 'add_device', secondId),
    };
    expect(codeOf(() => w.identity.devices.add(asActor(s.actor), { ...args, expectedVersion: 99 }))).toBe('STORE.VERSION_CONFLICT');
    expect(codeOf(() => w.identity.devices.add(anon(), args))).toBe('AUTH.REQUIRED');
    expect(w.identity.devices.add(asActor(s.actor, 'add-key-0001'), args).devices).toHaveLength(2);
    expect(w.identity.devices.add(asActor(s.actor, 'add-key-0001'), args).devices).toHaveLength(2);
    expect(codeOf(() => w.identity.devices.add(asActor(s.actor, 'add-key-0001'), { ...args, device: deviceInput(newKeys().keys, newKeys().box) }))).toBe('IDEMPOTENCY.KEY_REUSED');
  });
});
