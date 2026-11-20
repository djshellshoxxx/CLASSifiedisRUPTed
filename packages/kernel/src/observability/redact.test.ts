import { describe, expect, it } from 'vitest';
import { createFakeClock } from '../clock/clock.ts';
import { truncateIp } from './ip.ts';
import { createLogger, createRingBufferSink } from './logger.ts';
import { redact, REDACTED } from './redact.ts';

describe('log redaction (CTR-OBS-001 OBS-1)', () => {
  it('TEST-PS-121-09.T01 sensitive keys are dropped at any depth, in arrays and in case or suffix variants', () => {
    const input = {
      listingId: 'l1',
      token: 't', secret: 's', password: 'p', privateKey: 'k', recoveryCode: 'r', email: 'a@b.c', address: '1 Main St', lat: 1, lon: 2,
      note: 'n', body: '{}', ciphertext: 'c',
      Authorization: 'Bearer x', sessionToken: 'st', ACCESS_TOKEN: 'at', contactEmail: 'x@y.z', pickup_address: 'addr', 'private-key': 'pk', sellerNote: 'sn',
      nested: { deeper: [{ password: 'p2', ok: 'yes' }, { latitude: 3, longitude: 4, kept: 1 }] },
      err: Object.assign(new Error('failed for 10.1.2.3'), { code: 'E_X' }),
    };
    const out = redact(input) as Record<string, unknown>;
    expect(Object.keys(out).sort()).toEqual(['err', 'listingId', 'nested']);
    expect(out['nested']).toEqual({ deeper: [{ ok: 'yes' }, { kept: 1 }] });
    expect(out['err']).toMatchObject({ name: 'Error', message: 'failed for 10.1.2.3', code: 'E_X' });
    const circular: Record<string, unknown> = { a: 1 };
    circular['self'] = circular;
    expect(redact(circular)).toEqual({ a: 1, self: '[circular]' });
    expect(redact({ big: 10n, f: () => 1 })).toEqual({ big: '10' });
    expect(JSON.stringify(redact({ s: 'x'.repeat(5000) })).length).toBeLessThan(2100);
  });

  it('TEST-PS-121-09.T02 IPs are truncated to /24 and /48 under IP keys and as bare values', () => {
    expect(truncateIp('203.0.113.77')).toBe('203.0.113.0/24');
    expect(truncateIp('2001:db8:abcd:12::1')).toBe('2001:db8:abcd::/48');
    expect(truncateIp('2001:0db8:abcd:0012:0000:0000:0000:0001')).toBe('2001:db8:abcd::/48');
    expect(truncateIp('::ffff:198.51.100.9')).toBe('198.51.100.0/24');
    expect(truncateIp('fe80::1%eth0')).toBe('fe80:0:0::/48');
    expect(truncateIp('::1')).toBe('0:0:0::/48');
    expect(truncateIp('not-an-ip')).toBeUndefined();
    expect(truncateIp('10:15:30')).toBeUndefined();
    expect(truncateIp('256.1.1.1')).toBeUndefined();
    expect(redact({ ip: '198.51.100.9', remoteAddress: '2001:db8:1:2:3:4:5:6', xForwardedFor: '203.0.113.5, 198.51.100.7', clientIp: 'garbage', peer: '192.0.2.44' })).toEqual({
      ip: '198.51.100.0/24',
      remoteAddress: '2001:db8:1::/48',
      xForwardedFor: '203.0.113.0/24, 198.51.100.0/24',
      clientIp: REDACTED,
      peer: '192.0.2.0/24',
    });
  });

  it('drops conventional credential fields and documented secret namespaces from nested structured data', () => {
    const input = {
      operation: 'restore',
      connection: {
        credential: 'placeholder-credential', credentials: { account: 'example-account' },
        PWD: 'placeholder-password', Bearer: 'placeholder-token', hostLabel: 'local',
      },
      signing: {
        deviceSigningKey: 'placeholder-signing-key', vault_data_key: 'placeholder-data-key',
        recoverySecretKey: 'placeholder-secret-key', operatorAccessKey: 'placeholder-access-key',
        'service-api-key': 'placeholder-api-key', audit_pepper: 'placeholder-pepper',
        smtpPasswd: 'placeholder-password', keyId: 'key-reference',
      },
      nested: [{ requestId: 'request-1', RELAY_SECRET_DELIVERY_FILE: 'placeholder-path',
        CLASSRUP_SECRET_DATA_KEY_V2_FILE: 'placeholder-path' }],
    };
    const before = structuredClone(input);

    expect(redact(input)).toEqual({
      operation: 'restore', connection: { hostLabel: 'local' }, signing: { keyId: 'key-reference' },
      nested: [{ requestId: 'request-1' }],
    });
    expect(input).toEqual(before);
  });

  it('preserves public references, policy names and secret inventory metadata', () => {
    const metadata = {
      publicKey: 'public-reference', keyId: 'key-reference', tokenCount: 2,
      passwordPolicy: 'local-only', authorizationMode: 'local', credentialId: 'credential-reference',
      secretKeyVersion: 2, name: 'CLASSRUP_SECRET_DATA_KEY_V2', source: 'file', bytes: 32,
      correlationId: 'request-1', module: 'F16.S01.M02', code: 'OK', durationMs: 3,
    };
    expect(redact(metadata)).toEqual(metadata);
  });

  it('applies credential field rules to child logger bindings and event fields without changing diagnostic safeguards', () => {
    const clock = createFakeClock('2026-11-20T10:00:00.000Z');
    const ring = createRingBufferSink();
    const log = createLogger({ sink: ring.sink, clock })
      .child({ module: 'F16.S01.M02', serviceApiKey: 'placeholder-api-key' })
      .child({ credentials: { account: 'example-account' }, correlationId: 'request-1' });
    log.info('vault.recovery.checked', {
      durationMs: 3, publicKey: 'public-reference', clientIp: '198.51.100.9',
      nested: [{ signingKey: 'placeholder-signing-key', ok: true }],
      err: Object.assign(new Error('placeholder error detail'), { code: 'E_SAMPLE' }),
    });
    log.warn('placeholder freeform message');

    expect(ring.records()).toEqual([
      {
        ts: clock.iso(), level: 'info', msg: 'vault.recovery.checked', correlationId: 'request-1',
        module: 'F16.S01.M02', durationMs: 3, publicKey: 'public-reference',
        clientIp: '198.51.100.0/24', nested: [{ ok: true }], err: { name: 'Error', code: 'E_SAMPLE' },
      },
      { ts: clock.iso(), level: 'warn', msg: REDACTED, correlationId: 'request-1', module: 'F16.S01.M02' },
    ]);
    expect(log.dropped()).toBe(0);
  });
});
