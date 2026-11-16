import { z } from '../../../packages/kernel/src/index.ts';
import { listingRevisionSchema } from '../../../packages/bazaar/src/index.ts';

interface HistoryPorts {
  query(name: string, input: unknown): Promise<unknown>;
  action(fn: () => Promise<void>): Promise<void>;
}
/** Owner-only local evidence. All imported/user text goes through textContent. */
export function listingHistory(listingId: string, ports: HistoryPorts): HTMLDetailsElement {
  const node = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] => {
    const output = document.createElement(tag); if (text !== undefined) output.textContent = text; return output;
  };
  const details = node('details');
  details.append(node('summary', 'Local revision history'));
  details.append(node('p', 'Snapshots of publishable fields start when this version publishes or edits a previously published listing. Private notes stay outside history. These records do not prove another person accepted a change.'));
  const status = node('p'); status.setAttribute('role', 'status');
  const list = node('ol');
  const load = node('button', 'Load revision history'); load.type = 'button';
  let cursor: string | undefined;
  let loaded = false;
  load.addEventListener('click', () => {
    void ports.action(async () => {
      if (!details.isConnected) return;
      const page = z.object({ items: z.array(z.object({ data: listingRevisionSchema })), nextCursor: z.string().optional() }).parse(
        await ports.query('bazaar.listing_revision.list', { listingId, limit: 50, ...(cursor ? { cursor } : {}) }));
      if (!details.isConnected) return;
      if (!loaded) list.replaceChildren();
      for (const { data } of page.items) {
        const item = node('li');
        const snapshot = node('details');
        const fields = data.changedFields.length ? data.changedFields.join(', ') : 'published snapshot';
        snapshot.append(node('summary', `Revision ${data.revisionNo} · ${data.material ? 'Material change' : 'Revision snapshot'} · ${fields} · ${data.wasPublic ? 'Published locally' : 'Saved locally; not published'} · ${data.createdAt}`));
        snapshot.append(node('pre', JSON.stringify(data.snapshot, null, 2)));
        item.append(snapshot); list.append(item);
      }
      cursor = page.nextCursor; loaded = true;
      status.textContent = list.children.length ? `${list.children.length} local revision snapshots loaded.` : 'No recorded public snapshots. Draft edits do not create history.';
      load.textContent = 'Load older revisions'; load.hidden = !cursor;
    });
  });
  details.append(load, status, list);
  return details;
}
