import type { Operation } from '@classrup/kernel';
import { defineOperations } from '@classrup/kernel';
import type { ThreatsView } from './boundaries/view';
import type { ConsentService } from './consent/consent';
import type { DeletionService } from './data/delete';
import type { ExportService } from './data/export';
import { FLAGS, operation } from './env';
import type { RetentionService } from './retention/retention';

export interface PrivacyServices {
  readonly consent: ConsentService;
  readonly retention: RetentionService;
  readonly exports: ExportService;
  readonly deletion: DeletionService;
  readonly boundaries: ThreatsView;
}

type Input<F> = F extends (ctx: never, input: infer I) => unknown ? I : never;

export function buildOperations(s: PrivacyServices): readonly Operation[] {
  const { consent: c, retention: r, exports: x, deletion: d, boundaries: b } = s;
  return defineOperations([
    operation<Input<typeof c.grant>>('command', { name: 'privacy.consent.grant', flag: FLAGS.consent, summary: 'Grant consent for a purpose at a policy version' }, (ctx, i) => c.grant(ctx, i)),
    operation<Input<typeof c.withdraw>>('command', { name: 'privacy.consent.withdraw', flag: FLAGS.consent, summary: 'Withdraw consent for a purpose' }, (ctx, i) => c.withdraw(ctx, i)),
    operation<undefined>('query', { name: 'privacy.consent.list_mine', flag: FLAGS.consent, summary: 'Current consent per purpose' }, (ctx) => c.listMine(ctx)),
    operation<Input<typeof c.history>>('query', { name: 'privacy.consent.history', flag: FLAGS.consent, summary: 'Append-only consent history' }, (ctx, i) => c.history(ctx, i)),

    operation<undefined>('query', { name: 'privacy.retention.get_policy', flag: FLAGS.retention, summary: 'Effective retention rules' }, (ctx) => r.policy(ctx)),
    operation<Input<typeof r.setPolicy>>('command', { name: 'privacy.retention.set_policy', flag: FLAGS.retention, summary: 'Admin: tune a fixed retention duration within bounds' }, (ctx, i) => r.setPolicy(ctx, i)),
    operation<Input<typeof r.planSweep>>('query', { name: 'privacy.retention.plan_sweep', flag: FLAGS.retention, summary: 'System: which items are due for purge and which are held' }, (ctx, i) => r.planSweep(ctx, i)),
    operation<Input<typeof r.placeHold>>('command', { name: 'privacy.hold.place', flag: FLAGS.retention, summary: 'Admin: place a legal hold' }, (ctx, i) => r.placeHold(ctx, i)),
    operation<Input<typeof r.releaseHold>>('command', { name: 'privacy.hold.release', flag: FLAGS.retention, summary: 'Admin: release a legal hold' }, (ctx, i) => r.releaseHold(ctx, i)),
    operation<undefined>('query', { name: 'privacy.hold.list', flag: FLAGS.retention, summary: 'Admin: list legal holds' }, (ctx) => r.listHolds(ctx)),

    operation<undefined>('command', { name: 'privacy.export.request', flag: FLAGS.export, summary: 'Request an export of own data' }, (ctx) => x.request(ctx)),
    operation<undefined>('query', { name: 'privacy.export.status', flag: FLAGS.export, summary: 'Own export requests' }, (ctx) => x.status(ctx)),
    operation<Input<typeof x.download>>('command', { name: 'privacy.export.download', flag: FLAGS.export, summary: 'Download an available export bundle' }, (ctx, i) => x.download(ctx, i)),
    operation<undefined>('command', { name: 'privacy.export.expire_due', flag: FLAGS.export, summary: 'System: expire old exports' }, (ctx) => x.expireDue(ctx)),

    operation<undefined>('command', { name: 'privacy.deletion.request', flag: FLAGS.delete, summary: 'Request deletion of own data (seven-day grace)' }, (ctx) => d.request(ctx)),
    operation<undefined>('query', { name: 'privacy.deletion.status', flag: FLAGS.delete, summary: 'Own deletion requests and reports' }, (ctx) => d.status(ctx)),
    operation<Input<typeof d.cancel>>('command', { name: 'privacy.deletion.cancel', flag: FLAGS.delete, summary: 'Cancel a pending deletion' }, (ctx, i) => d.cancel(ctx, i)),
    operation<undefined>('command', { name: 'privacy.deletion.process_due', flag: FLAGS.delete, summary: 'System: execute due deletions' }, (ctx) => d.processDue(ctx)),

    operation<undefined>('query', { name: 'privacy.threat.catalog', flag: FLAGS.threat, summary: 'Threat register' }, (ctx) => b.threats(ctx)),
    operation<undefined>('query', { name: 'privacy.model.describe', flag: FLAGS.model, summary: 'Assets, adversaries, trust boundaries and disclosure matrix' }, (ctx) => b.model(ctx)),
  ]);
}
