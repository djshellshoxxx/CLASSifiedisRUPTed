import { expect, it } from 'vitest';
import { bindActionsToSession, createActionQueue } from '../../apps/pwa/src/action-queue.ts';

it('processes rapid imports in order and does not discard the file after a failing import', async () => {
  const queue = createActionQueue();
  const calls: string[] = [];
  let release!: () => void;
  const delayed = new Promise<void>(resolve => { release = resolve; });
  const first = queue(async () => { calls.push('first'); await delayed; calls.push('first done'); });
  const second = queue(async () => { calls.push('tampered'); throw new Error('Invalid signature'); });
  const rejection = expect(second).rejects.toThrow('Invalid signature');
  const third = queue(async () => { calls.push('third'); return 'retained'; });
  await Promise.resolve(); expect(calls).toEqual(['first']);
  release(); await first; await rejection;
  expect(await third).toBe('retained');
  expect(calls).toEqual(['first', 'first done', 'tampered', 'third']);
});

it('drops old-session actions after lock or same-principal re-unlock while preserving current work', async () => {
  const queue = createActionQueue();
  let session: { principal: string } | undefined = { principal: 'alice' };
  const action = bindActionsToSession(queue, () => session);
  const calls: string[] = [];
  await action(async () => { calls.push('current'); });
  let release!: () => void;
  const blocked = queue(() => new Promise<void>(resolve => { release = resolve; }));
  await Promise.resolve();
  const oldEditor = action(async () => { calls.push('old editor'); });
  const lock = queue(async () => { session = undefined; });
  const oldListing = action(async () => { calls.push('old listing'); });
  session = { principal: 'alice' };
  release(); await blocked; await oldEditor; await lock; await oldListing;
  await action(async () => { calls.push('locked'); });
  session = { principal: 'bob' };
  await action(async () => { calls.push('new vault'); });
  expect(calls).toEqual(['current', 'new vault']);
});
