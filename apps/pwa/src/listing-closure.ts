import { z } from '../../../packages/kernel/src/index.ts';
import type { Listing } from '../../../packages/bazaar/src/index.ts';

interface ClosurePorts {
  active(): boolean;
  action(fn: () => Promise<void>): Promise<void>;
  command(name: string, input: unknown): Promise<unknown>;
  download(name: string, content: unknown): void;
  message(text: string): void;
  refresh(): Promise<void>;
}

/** Closing is an owner report. It never stands in for verified settlement or barter withdrawal. */
export function listingClosure(item: { id: string; revision: number; data: Listing }, ports: ClosurePorts): HTMLElement {
  const details = document.createElement('details');
  const summary = document.createElement('summary'); summary.textContent = 'Close this listing';
  const form = document.createElement('form'); form.setAttribute('aria-label', `Close ${item.data.title}`);
  const label = document.createElement('label'); label.textContent = 'Closure reason';
  const reason = document.createElement('select'); reason.name = 'reason'; reason.id = `close-reason-${item.id}`; label.htmlFor = reason.id;
  const reasons = item.data.kind === 'giveaway' ? [['given', 'Given away'], ['other', 'Other']]
    : item.data.kind === 'wanted' ? [['fulfilled', 'Request fulfilled'], ['other', 'Other']]
    : [['sold', 'Sold'], ['traded', 'Traded'], ['given', 'Given away'], ['other', 'Other']];
  for (const [value, text] of reasons) { const option = document.createElement('option'); option.value = value!; option.textContent = text!; reason.append(option); }
  const note = document.createElement('p');
  note.textContent = 'This records your report, not verified payment or delivery. First withdraw any active barter commitment using Barter coordination. A published listing downloads a signed withdrawal for you to share.';
  const confirmLabel = document.createElement('label'); confirmLabel.className = 'check';
  const confirm = document.createElement('input'); confirm.type = 'checkbox'; confirm.required = true;
  confirmLabel.append(confirm, 'I confirm this listing is finished.');
  const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = 'Confirm closure';
  form.append(label, reason, note, confirmLabel, submit);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!ports.active() || !confirm.checked) return;
    const closeReason = reason.value;
    void ports.action(async () => {
      if (!ports.active()) return;
      const result = z.object({ envelope: z.unknown().optional() }).parse(await ports.command('bazaar.listing.close', {
        listingId: item.id, expectedRevision: item.revision, closeReason,
      }));
      if (!ports.active()) return;
      if (result.envelope) ports.download(`withdraw-listing-${item.id}.json`, result.envelope);
      ports.message(`Listing closed locally.${result.envelope ? ' Share its signed withdrawal with peers.' : ''} It will archive after 30 days when this vault is open.`);
      await ports.refresh();
    });
  });
  details.append(summary, form);
  return details;
}
