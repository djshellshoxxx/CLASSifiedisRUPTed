import { createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { expect, test } from '@playwright/test';

// Public, deterministic test seeds; these are never used for a vault identity.
const prefix = Buffer.from('302e020100300506032b657004220420', 'hex');
const seeds = [
  { name: 'leading-zero', seed: Buffer.from([0, ...Array<number>(31).fill(7)]) },
  { name: 'all-zero', seed: Buffer.alloc(32) },
  { name: 'nonzero-control', seed: Buffer.alloc(32, 7) },
];
const message = Buffer.from([1, 2, 3]);
const vectors = seeds.map(({ name, seed }) => {
  const pkcs8 = Buffer.concat([prefix, seed]);
  const privateKey = createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
  const spki = createPublicKey(privateKey).export({ format: 'der', type: 'spki' });
  return { name, pkcs8: [...pkcs8], publicKey: [...spki.subarray(-32)], message: [...message], signature: [...sign(null, message, privateKey)] };
});

test('diagnostic: fixed-width Ed25519 imports preserve zero bytes and produce reference signatures', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async inputs => {
    const output: { name: string; stage: string; errorName?: string; preserved?: boolean; matches?: boolean; verifies?: boolean }[] = [];
    for (const input of inputs) {
      let stage = 'private-import';
      try {
        const key = await crypto.subtle.importKey('pkcs8', new Uint8Array(input.pkcs8), 'Ed25519', true, ['sign']);
        stage = 'private-export';
        const exported = [...new Uint8Array(await crypto.subtle.exportKey('pkcs8', key))];
        stage = 'sign';
        const signature = new Uint8Array(await crypto.subtle.sign('Ed25519', key, new Uint8Array(input.message)));
        stage = 'public-import';
        const publicKey = await crypto.subtle.importKey('raw', new Uint8Array(input.publicKey), 'Ed25519', false, ['verify']);
        stage = 'verify';
        const verifies = await crypto.subtle.verify('Ed25519', publicKey, signature, new Uint8Array(input.message));
        output.push({ name: input.name, stage: 'complete', preserved: JSON.stringify(exported) === JSON.stringify(input.pkcs8),
          matches: JSON.stringify([...signature]) === JSON.stringify(input.signature), verifies });
      } catch (error) {
        // Do not attach error messages, keys, passphrases, signatures or generated identifiers.
        output.push({ name: input.name, stage, errorName: error instanceof DOMException ? error.name : 'Error' });
      }
    }
    return output;
  }, vectors);
  await test.info().attach('ed25519-fixed-width-results.json', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
  expect(results).toEqual(seeds.map(({ name }) => ({ name, stage: 'complete', preserved: true, matches: true, verifies: true })));
});

test('diagnostic: classify independent Ed25519 generation and reimport failures', async ({ page }) => {
  await page.goto('/');
  const report = await page.evaluate(async () => {
    const failures: { attempt: number; stage: string; errorName: string }[] = [];
    const attempts = 512;
    for (let attempt = 0; attempt < attempts; attempt++) {
      let stage = 'generate';
      let privateBytes: Uint8Array | undefined;
      try {
        const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']) as CryptoKeyPair;
        stage = 'public-export';
        const publicBytes = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
        if (publicBytes.length !== 32) throw new Error('Invalid public key length');
        stage = 'private-export';
        privateBytes = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
        stage = 'private-reimport';
        await crypto.subtle.importKey('pkcs8', privateBytes.slice(), 'Ed25519', false, ['sign']);
      } catch (error) {
        failures.push({ attempt, stage, errorName: error instanceof DOMException ? error.name : 'Error' });
      } finally { privateBytes?.fill(0); }
    }
    return { attempts, completed: attempts - failures.length, failures };
  });
  await test.info().attach('ed25519-operation-results.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
  expect(report.failures).toEqual([]);
});
