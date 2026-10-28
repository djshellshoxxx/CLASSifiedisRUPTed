/** Operations for F16.S03.M01: read the threat register and record reviews that change a threat's status. */
import type { Deps, Operation, Versioned } from '@classrup/kernel';
import { assertVersion, notFound, precondition, runCommand, schemas, z } from '@classrup/kernel';
import { PERM } from '../policies';
import { authorize, operation, platformEvent } from '../support';
import type { Threat, ThreatStatus } from './threats';
import { riskScore, summarizeThreats, THREATS } from './threats';

const FLAG = 'platform.assurance';
export const THREAT_REVIEWS_COLLECTION = 'platform_threat_reviews';

export interface ThreatReview extends Versioned {
  readonly tenantId: string;
  readonly threatRef: string;
  readonly status: ThreatStatus;
  readonly note: string;
  readonly reviewedBy: string;
  readonly reviewedAt: number;
}

const listSchema = z.strictObject({ asset: z.string().optional(), stride: z.string().optional(), minScore: z.number().int().min(1).max(25).optional() });
const reviewSchema = z.strictObject({
  threatRef: z.string().regex(/^T-\d{3}$/),
  status: z.enum(['mitigated', 'partial', 'open', 'accepted']),
  note: schemas.text(5, 1000),
  expectedVersion: z.number().int().nonnegative().optional(),
});

export function threatOperations(deps: Deps): readonly Operation[] {
  const reviews = deps.store.collection<ThreatReview>(THREAT_REVIEWS_COLLECTION);
  const reviewFor = (tenantId: string, ref: string): ThreatReview | undefined => reviews.list((r) => r.tenantId === tenantId && r.threatRef === ref)[0];

  return [
    operation({ name: 'platform.threat.list', kind: 'query', flag: FLAG, summary: 'Threat register with review status and summary' }, listSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.threatRead, { type: 'threat', tenantId: ctx.actor.tenantId });
      const byRef = new Map(reviews.list((r) => r.tenantId === ctx.actor.tenantId).map((r) => [r.threatRef, r]));
      const effective = (t: Threat): ThreatStatus => byRef.get(t.ref)?.status ?? t.status;
      const threats = THREATS.filter(
        (t) => (input.asset === undefined || t.asset === input.asset) && (input.stride === undefined || t.stride === input.stride) && riskScore(t) >= (input.minScore ?? 1),
      );
      return {
        summary: summarizeThreats(THREATS, effective),
        threats: threats.map((t) => ({
          ...structuredClone(t),
          score: riskScore(t),
          status: effective(t),
          ...(byRef.has(t.ref) ? { review: { reviewedAt: (byRef.get(t.ref) as ThreatReview).reviewedAt, version: (byRef.get(t.ref) as ThreatReview).version } } : {}),
        })),
      };
    }),

    operation({ name: 'platform.threat.review', kind: 'command', flag: FLAG, summary: 'Record a review that sets a threat status' }, reviewSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.threatReview, { type: 'threat', tenantId: ctx.actor.tenantId });
      return runCommand(deps, ctx, { name: 'platform.threat.review', flag: FLAG, request: input }, () => {
        const threat = THREATS.find((t) => t.ref === input.threatRef);
        if (!threat) throw notFound('THREAT.NOT_FOUND', 'unknown threat', { threatRef: input.threatRef });
        // A control that is not in the tree cannot be claimed as a mitigation.
        if (input.status === 'mitigated' && threat.controls.length === 0) {
          throw precondition('THREAT.NO_CONTROLS', 'a threat without implemented controls cannot be marked mitigated', { threatRef: threat.ref });
        }
        const existing = reviewFor(ctx.actor.tenantId, threat.ref);
        assertVersion('threat review', existing?.version ?? 0, input.expectedVersion);
        const record = { tenantId: ctx.actor.tenantId, threatRef: threat.ref, status: input.status, note: input.note, reviewedBy: ctx.actor.id, reviewedAt: deps.clock.now() };
        const stored = existing ? reviews.put({ ...record, id: existing.id }, existing.version) : reviews.put({ ...record, id: deps.ids.next('thm') }, 0);
        const payload = { threatRef: threat.ref, from: existing?.status ?? threat.status, to: input.status };
        return {
          result: { threatRef: stored.threatRef, status: stored.status, reviewedAt: stored.reviewedAt, version: stored.version },
          events: [platformEvent('platform.threat.reviewed', 'threat', stored.id, stored.version, payload)],
        };
      });
    }),
  ];
}
