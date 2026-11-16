import { afterEach, expect, it, vi } from 'vitest';
import { protectVaultSession, runForSession } from '../../apps/pwa/src/vault-session.ts';

class TestDocument extends EventTarget { hidden = false; }
afterEach(() => vi.useRealTimers());

it('does not return a private command result when a lock occurs during post-commit delivery', async () => {
  const session = {};
  let current: object | undefined = session;
  let resume!: () => void;
  const delivery = new Promise<void>(resolve => { resume = resolve; });
  const synchronize = vi.fn(() => delivery);
  const download = vi.fn();
  const work = runForSession(session, () => current, async () => 'private signed evidence', synchronize).then(download);
  await vi.waitFor(() => expect(synchronize).toHaveBeenCalledOnce());
  current = undefined;
  resume();
  await expect(work).rejects.toThrow('Vault session ended');
  expect(download).not.toHaveBeenCalled();
});

it('rejects an old result after another vault replaces the session', async () => {
  const session = {};
  let current: object | undefined = session;
  let resume!: (value: string) => void;
  const pending = new Promise<string>(resolve => { resume = resolve; });
  const after = vi.fn(async () => {});
  const result = runForSession(session, () => current, () => pending, after);
  current = {};
  resume('old vault result');
  await expect(result).rejects.toThrow('Vault session ended');
  expect(after).not.toHaveBeenCalled();
});

it('locks an idle session even when synthetic activity events keep arriving', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  const document = new TestDocument();
  const lock = vi.fn(async () => {});
  const protection = protectVaultSession({ document, lock, onError: error => { throw error; } });
  protection.setIdleMinutes(1);
  await vi.advanceTimersByTimeAsync(59_000);
  document.dispatchEvent(new Event('pointerdown'));
  document.dispatchEvent(new Event('keydown'));
  await vi.advanceTimersByTimeAsync(1_000);
  expect(lock).toHaveBeenCalledExactlyOnceWith('idle');
  protection.dispose();
});

it('observes an already hidden document and clears the old session listeners on disposal', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  const document = new TestDocument(); document.hidden = true;
  const oldLock = vi.fn(async () => {});
  const oldSession = protectVaultSession({ document, lock: oldLock, onError: error => { throw error; } });
  oldSession.dispose();
  const lock = vi.fn(async () => {});
  const current = protectVaultSession({ document, lock, onError: error => { throw error; } });
  await vi.advanceTimersByTimeAsync(300_000);
  expect(oldLock).not.toHaveBeenCalled();
  expect(lock).toHaveBeenCalledExactlyOnceWith('hidden');
  current.dispose();
});

it('surfaces a storage-close error without retrying the lock callback', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  const document = new TestDocument();
  const error = new Error('Storage close failed');
  const lock = vi.fn(async () => { throw error; });
  const onError = vi.fn();
  const protection = protectVaultSession({ document, lock, onError });
  protection.setIdleMinutes(1);
  await vi.advanceTimersByTimeAsync(120_000);
  expect(lock).toHaveBeenCalledTimes(1);
  expect(onError).toHaveBeenCalledExactlyOnceWith(error);
  protection.dispose();
});
