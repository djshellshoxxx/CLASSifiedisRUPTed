import { afterEach, expect, it, vi } from 'vitest';
import { createActionQueue } from '../../apps/pwa/src/action-queue.ts';
import { mountNotifications } from '../../apps/pwa/src/notifications.ts';
import { NodeStub } from '../support/node-stub.ts';

// Only event wiring and lifetime are under test here; browser journeys cover the real DOM.

afterEach(() => vi.unstubAllGlobals());

function mount() {
  const nodes: NodeStub[] = [];
  vi.stubGlobal('document', { createElement(tag: string) { const node = new NodeStub(tag); nodes.push(node); return node; } });
  const queue = createActionQueue();
  const tasks: Promise<void>[] = [];
  const command = vi.fn(async () => undefined);
  const query = vi.fn(async () => undefined);
  const synchronize = vi.fn(async () => undefined);
  const message = vi.fn();
  const container = new NodeStub('section');
  const inbox = mountNotifications({ container: container as unknown as HTMLElement, command, query, synchronize, message,
    action(fn) { const task = queue(fn); tasks.push(task); return task; },
  });
  return { inbox, nodes, queue, tasks, command, query, synchronize, message, container };
}

for (const control of ['button', 'preferences', 'filter'] as const) {
  it(`drops a queued ${control} action when its vault inbox is destroyed`, async () => {
    const f = mount();
    let release!: () => void;
    const wait = new Promise<void>(resolve => { release = resolve; });
    const blocking = f.queue(() => wait);
    const node = f.nodes.find(n => control === 'button' ? n.tag === 'button' && n.textContent === 'Mark all as read'
      : control === 'preferences' ? n.tag === 'form' : n.id === 'notification-filter')!;
    const event = control === 'button' ? 'click' : control === 'preferences' ? 'submit' : 'change';
    node.fire(event);
    expect(f.tasks).toHaveLength(1);
    f.inbox.destroy();
    release(); await blocking; await Promise.all(f.tasks);
    expect(f.command).not.toHaveBeenCalled();
    expect(f.query).not.toHaveBeenCalled();
    expect(f.synchronize).not.toHaveBeenCalled();
    expect(f.message).not.toHaveBeenCalled();
    expect(f.container.children).toEqual([]);
    node.fire(event);
    expect(f.tasks).toHaveLength(1);
  });
}

it('runs explicit delivery recovery while the inbox remains active', async () => {
  const f = mount();
  f.nodes.find(n => n.tag === 'button' && n.textContent === 'Refresh notifications')!.fire('click');
  await Promise.all(f.tasks);
  expect(f.synchronize).toHaveBeenCalledTimes(1);
  f.inbox.destroy();
});
