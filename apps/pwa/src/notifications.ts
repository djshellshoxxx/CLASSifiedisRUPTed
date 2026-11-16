import { inApp, preferences } from '../../../packages/notify/src/index.ts';
import { z } from '../../../packages/kernel/src/index.ts';

interface InboxPorts {
  readonly container: HTMLElement;
  command(name: string, input: unknown): Promise<unknown>;
  query(name: string, input: unknown): Promise<unknown>;
  action(fn: () => Promise<void>): Promise<void>;
  message(text: string): void;
  synchronize(): Promise<void>;
}
const rowSchema = z.looseObject({ id: z.string(), revision: z.int().positive() })
  .transform(({ id, revision, ...data }) => ({ ...inApp.notificationRepo.schema.parse(data), id, revision }));
const pageSchema = z.object({ items: z.array(rowSchema), nextCursor: z.string().optional() });
const matrixSchema = z.object({ cells: z.array(z.looseObject({ id: z.string(), revision: z.int().positive() })
  .transform(({ id, revision, ...data }) => ({ ...preferences.preferenceRepo.schema.parse(data), id, revision }))) });

function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  return result;
}

/** Local, text-only inbox. Nothing here requests browser permission or contacts a relay. */
export function mountNotifications(ports: InboxPorts) {
  let active = true;
  let generation = 0;
  let cursor: string | undefined;
  let nextCursor: string | undefined;
  let observedAt = new Date().toISOString();
  const history: (string | undefined)[] = [];
  const title = node('h2', 'Notifications');
  title.id = 'notifications-title';
  ports.container.setAttribute('aria-labelledby', title.id);
  const count = node('p'); count.id = 'notification-count'; count.setAttribute('role', 'status'); count.setAttribute('aria-live', 'polite');
  const filterLabel = node('label', 'Show notifications');
  const filter = node('select'); filter.id = 'notification-filter';
  for (const [value, text] of [['unread', 'Unread'], ['all', 'All notifications']]) {
    const option = node('option', text); option.value = value!; filter.append(option);
  }
  filterLabel.append(filter);
  const list = node('div'); list.className = 'cards'; list.id = 'notification-list';
  const actions = node('div'); actions.className = 'actions';
  function run(fn: () => Promise<void>): void {
    if (!active) return;
    void ports.action(async () => {
      // The vault may lock while this action waits behind another operation.
      if (!active) return;
      await fn();
    });
  }
  function button(text: string, fn: () => Promise<void>) {
    const output = node('button', text); output.type = 'button';
    output.addEventListener('click', () => run(fn));
    return output;
  }
  const markAll = button('Mark all as read', async () => {
    await ports.command('notify.notification.mark_all_read', { beforeTimestamp: observedAt });
    resetPage(); await refresh(); ports.message('Notifications marked as read.');
  });
  const previous = button('Previous notifications', async () => { cursor = history.pop(); await refresh(); });
  const next = button('Next notifications', async () => {
    if (!nextCursor) return;
    history.push(cursor); cursor = nextCursor; await refresh();
  });
  const reload = button('Refresh notifications', async () => { resetPage(); await ports.synchronize(); });
  actions.append(markAll, previous, next, reload);
  const settings = node('form'); settings.setAttribute('aria-label', 'Notification preferences');
  const settingsTitle = node('h3', 'Local preferences');
  const cycleLabel = node('label', 'Barter updates'); cycleLabel.className = 'check';
  const cycles = node('input'); cycles.type = 'checkbox'; cycles.id = 'notify-cycles'; cycleLabel.prepend(cycles);
  const securityLabel = node('label', 'Security notifications (always enabled)'); securityLabel.className = 'check';
  const security = node('input'); security.type = 'checkbox'; security.checked = true; security.disabled = true; securityLabel.prepend(security);
  const save = node('button', 'Save notification preferences'); save.type = 'submit';
  settings.append(settingsTitle, cycleLabel, securityLabel, save);
  let cycleRevision = 1;
  settings.addEventListener('submit', event => {
    event.preventDefault();
    const enabled = cycles.checked;
    run(async () => {
      await ports.command('notify.preference.set', { cells: [{ category: 'cycles', inApp: enabled, expectedRevision: cycleRevision }] });
      resetPage(); await refresh(); ports.message('Local notification preferences saved.');
    });
  });
  filter.addEventListener('change', () => run(async () => { resetPage(); await refresh(); }));
  ports.container.replaceChildren(title, count,
    node('p', 'Updates come from signed barter evidence accepted by this vault. Review the current exchange before acting. No push or email is sent.'),
    filterLabel, list, actions, settings, node('p', 'Notifications expire after 30 days. Turning off barter updates removes unread barter notifications.'));
  function resetPage() { cursor = undefined; history.length = 0; }
  async function refresh() {
    const request = ++generation;
    const [pageInput, unreadInput, matrixInput] = await Promise.all([
      ports.query('notify.notification.list_mine', { status: filter.value, limit: 20, ...(cursor ? { cursor } : {}) }),
      ports.query('notify.notification.unread_count', {}),
      ports.query('notify.preference.get_matrix', {}),
    ]);
    if (!active || request !== generation) return;
    const page = pageSchema.parse(pageInput);
    const unread = z.object({ total: z.int().nonnegative() }).parse(unreadInput);
    const matrix = matrixSchema.parse(matrixInput);
    const cycle = matrix.cells.find(cell => cell.category === 'cycles');
    if (!cycle) throw new Error('Notification preferences are unavailable.');
    cycleRevision = cycle.revision; cycles.checked = cycle.inApp;
    observedAt = new Date().toISOString();
    count.textContent = `${unread.total} unread notification${unread.total === 1 ? '' : 's'}.`;
    nextCursor = page.nextCursor;
    previous.hidden = history.length === 0; next.hidden = !nextCursor; markAll.hidden = unread.total === 0;
    list.replaceChildren();
    if (!page.items.length) list.append(node('p', 'No notifications in this view.'));
    for (const row of page.items) {
      const card = node('article'); card.className = 'card';
      const text = inApp.renderNotification(row, template => template === 'notify.tpl.cycles.coordination_updated'
        ? { title: 'Barter coordination updated', line: 'A peer’s signed proposal, reservation, consent or withdrawal was accepted locally. Review barter coordination for its current state.' }
        : undefined);
      card.append(node('h3', text.title), node('p', text.line), node('p', `${row.status === 'unread' ? 'Unread' : 'Read'} · ${row.count} update${row.count === 1 ? '' : 's'}`));
      const time = node('time', new Date(row.updatedAt).toLocaleString()); time.dateTime = row.updatedAt; card.append(time);
      if (row.ref?.type === 'cycle') {
        card.append(node('p', `Exchange: ${row.ref.id}`));
        const link = node('a', 'Review barter coordination'); link.href = '#barter'; card.append(link);
      }
      if (row.status === 'unread') card.append(button('Mark as read', async () => {
        await ports.command('notify.notification.mark_read', { notificationId: row.id, expectedRevision: row.revision });
        await refresh();
      }));
      list.append(card);
    }
  }
  return { refresh, destroy() { active = false; generation++; ports.container.replaceChildren(); } };
}
