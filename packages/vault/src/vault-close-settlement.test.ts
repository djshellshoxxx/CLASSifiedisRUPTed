import { expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { openVault } from './vault.ts';

it('all vault close callers await a pending read and release the writer lease before reopening', async () => {
  const indexedDB = new IDBFactory();
  let occupied = false;
  const locks = {
    async request(_name: string, _options: { readonly mode: 'exclusive'; readonly ifAvailable: true },
      callback: (lock: object | null) => Promise<void>): Promise<void> {
      if (occupied) { await callback(null); return; }
      occupied = true;
      try { await callback({}); } finally { occupied = false; }
    },
  };
  const options = { name: 'concurrent-close-settlement', indexedDB, locks };
  const passphrase = 'a sufficiently long test passphrase';
  const vault = await openVault(options);
  let releaseRead!: () => void;
  const held = new Promise<void>(resolve => { releaseRead = resolve; });
  let entered!: () => void;
  const ready = new Promise<void>(resolve => { entered = resolve; });
  let drain: Promise<unknown> = Promise.resolve();
  try {
    const session = await vault.create(passphrase);
    const principal = session.principal;
    const read = session.storage.read(async () => {
      entered();
      await held;
      return 'completed';
    });
    // Register the read rejection before either close begins.
    const readOutcome = read.then(value => ({ value }), error => ({ error }));
    await ready;
    const first = session.lock();
    const second = vault.close();
    drain = Promise.allSettled([first, second, readOutcome]);
    let firstSettled = false;
    let secondSettled = false;
    void first.then(() => { firstSettled = true; }, () => { firstSettled = true; });
    void second.then(() => { secondSettled = true; }, () => { secondSettled = true; });
    // With the callback still held, any close settlement is premature.
    await new Promise<void>(resolve => { setTimeout(resolve, 0); });
    expect(firstSettled).toBe(false);
    expect(secondSettled).toBe(false);
    expect(occupied).toBe(true);
    await expect(session.storage.read(() => 'late')).rejects.toThrow('Vault closed');
    releaseRead();
    expect(await readOutcome).toMatchObject({ error: expect.any(Error) });
    await Promise.all([first, second]);
    expect(occupied).toBe(false);

    const reopened = await openVault(options);
    try {
      const restored = await reopened.unlock(passphrase);
      expect(restored.principal).toBe(principal);
    } finally { await reopened.close(); }
  } finally {
    releaseRead();
    await drain;
    await vault.close();
  }
}, 30000);
