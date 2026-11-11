import { describe, expect, it } from 'vitest';
import { truncateIp } from './ip.ts';
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
});
