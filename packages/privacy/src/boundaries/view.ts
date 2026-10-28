/** Read-only operations exposing the typed threat register and privacy model. */
import type { CommandContext } from '@classrup/kernel';
import type { PrivacyEnv } from '../env';
import { authorize, checkFlag, FLAGS } from '../env';
import type { ModelDescription } from './model';
import { describeModel } from './model';
import type { Threat } from './threats';
import { THREATS } from './threats';

export interface ThreatsView {
  threats(ctx: CommandContext): { threats: readonly Threat[]; summary: Readonly<Record<Threat['status'], number>> };
  model(ctx: CommandContext): ModelDescription;
}

export function createThreatsView(env: PrivacyEnv): ThreatsView {
  return {
    threats(ctx) {
      authorize(env, ctx, 'privacy.threat:read', { type: 'threat', tenantId: ctx.actor.tenantId });
      checkFlag(env, ctx, FLAGS.threat);
      const summary = { mitigated: 0, partially_mitigated: 0, accepted: 0 };
      for (const t of THREATS) summary[t.status]++;
      return { threats: THREATS, summary };
    },

    model(ctx) {
      authorize(env, ctx, 'privacy.model:read', { type: 'model', tenantId: ctx.actor.tenantId });
      checkFlag(env, ctx, FLAGS.model);
      return describeModel();
    },
  };
}
