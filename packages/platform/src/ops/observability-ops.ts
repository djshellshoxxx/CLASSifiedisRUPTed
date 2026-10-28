/** Operations for F15.S03.M01 observability: health, SLO report and metrics export. */
import type { Deps, Operation } from '@classrup/kernel';
import { unavailable, z } from '@classrup/kernel';
import { PERM } from '../policies';
import { authorize, operation } from '../support';
import type { HealthRegistry } from './health';
import type { MetricsRegistry } from './metrics';
import type { SloTracker } from './slo';

const FLAG = 'platform.operations';

export interface ObservabilityServices {
  readonly health: HealthRegistry;
  readonly metrics?: MetricsRegistry;
  readonly slos: readonly SloTracker[];
}

const checkSchema = z.strictObject({ kind: z.enum(['liveness', 'readiness']).default('readiness') });
const emptySchema = z.strictObject({});

export function observabilityOperations(deps: Deps, svc: ObservabilityServices): readonly Operation[] {
  return [
    operation({ name: 'platform.health.check', kind: 'query', flag: FLAG, summary: 'Overall liveness or readiness status', public: true }, checkSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.healthCheck);
      // Public callers learn the status only; check names and messages stay internal.
      return { kind: input.kind, status: svc.health.run(input.kind).status };
    }),

    operation({ name: 'platform.health.report', kind: 'query', flag: FLAG, summary: 'Detailed health checks and SLO budgets' }, emptySchema, (ctx) => {
      authorize(deps, ctx, PERM.healthReport);
      return {
        readiness: svc.health.run('readiness'),
        slos: svc.slos.map((s) => ({ ...s.status(), alerts: s.alerts().map((w) => ({ ...w })) })),
      };
    }),

    operation({ name: 'platform.metrics.export', kind: 'query', flag: FLAG, summary: 'Prometheus text exposition' }, emptySchema, (ctx) => {
      authorize(deps, ctx, PERM.metricsExport);
      if (!svc.metrics) throw unavailable('METRICS.NOT_CONFIGURED', 'no metrics registry is wired');
      return { contentType: 'text/plain; version=0.0.4; charset=utf-8', body: svc.metrics.render() };
    }),
  ];
}
