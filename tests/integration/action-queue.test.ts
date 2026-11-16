import { expect, it } from 'vitest';
import { createActionQueue } from '../../apps/pwa/src/action-queue.ts';

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
