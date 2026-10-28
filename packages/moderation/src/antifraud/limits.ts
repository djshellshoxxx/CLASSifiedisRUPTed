/** F12.S03.M04 limits: trust tiers and the per-tier quotas the relay checks before accepting new work. */
import type { CommandContext } from '@classrup/kernel';
import { DAY, notFound, parse, precondition, schemas, unavailable, z } from '@classrup/kernel';
import { authorize, operation } from '../common';
import type { Env } from '../common';
import { activeStrikes } from '../policy/strikes';
import type { createRisk } from './risk';

export type TrustTier = 'new' | 'established' | 'trusted';
export const NEW_ACCOUNT_MS = 7 * DAY;
export const TRUSTED_ACCOUNT_MS = 90 * DAY;
/** Decayed signal total below which an old, strike-free account is considered trusted. */
export const TRUSTED_MAX_RISK = 20;

export type CountLimitKind = 'listings_per_day' | 'open_offers' | 'open_trades' | 'messages_per_hour';
export type LimitKind = CountLimitKind | 'auction_max_value';
const COUNT_KINDS = ['listings_per_day', 'open_offers', 'open_trades', 'messages_per_hour'] as const;

/** `auction_max_value` is in USD minor units (cents); callers normalise with a pinned FX quote first. */
export const TIER_LIMITS: Readonly<Record<TrustTier, Readonly<Record<CountLimitKind, number>> & { readonly auction_max_value: bigint }>> = {
  new: { listings_per_day: 3, open_offers: 5, open_trades: 2, messages_per_hour: 20, auction_max_value: 10_000n },
  established: { listings_per_day: 10, open_offers: 20, open_trades: 8, messages_per_hour: 60, auction_max_value: 100_000n },
  trusted: { listings_per_day: 50, open_offers: 100, open_trades: 30, messages_per_hour: 200, auction_max_value: 10_000_000n },
};

const checkSchema = z.object({
  accountId: schemas.text(1, 64),
  accountAgeMs: z.number().int().nonnegative(),
  kind: z.enum([...COUNT_KINDS, 'auction_max_value']),
  used: z.number().int().nonnegative().default(0),
  requested: z.union([z.number().int().positive(), schemas.minor()]).default(1),
});

export type CheckLimitInput = z.input<typeof checkSchema>;

export interface LimitsDto {
  readonly accountId: string;
  readonly tier: TrustTier;
  readonly limits: Readonly<Record<CountLimitKind, number>> & { readonly auction_max_value_minor: string };
}

export function createLimits(env: Env, risk: Pick<ReturnType<typeof createRisk>, 'baseScore'>) {
  function tierOf(accountId: string, accountAgeMs: number): TrustTier {
    if (accountAgeMs < NEW_ACCOUNT_MS) return 'new';
    const clean = activeStrikes(env, accountId, env.deps.clock.now()).length === 0 && risk.baseScore(accountId) < TRUSTED_MAX_RISK;
    return accountAgeMs >= TRUSTED_ACCOUNT_MS && clean ? 'trusted' : 'established';
  }

  function limitFor(accountId: string, accountAgeMs: number, kind: CountLimitKind): number;
  function limitFor(accountId: string, accountAgeMs: number, kind: 'auction_max_value'): bigint;
  function limitFor(accountId: string, accountAgeMs: number, kind: LimitKind): number | bigint {
    return TIER_LIMITS[tierOf(accountId, accountAgeMs)][kind];
  }

  /** Throws LIMITS.EXCEEDED when `used + requested` would pass the tier limit. Counts use numbers, auction value uses bigint minor units. */
  function checkLimit(accountId: string, accountAgeMs: number, kind: CountLimitKind, used: number, requested?: number): void;
  function checkLimit(accountId: string, accountAgeMs: number, kind: 'auction_max_value', used: bigint, requested: bigint): void;
  function checkLimit(accountId: string, accountAgeMs: number, kind: LimitKind, used: number | bigint, requested: number | bigint = 1): void {
    const tier = tierOf(accountId, accountAgeMs);
    const limit = TIER_LIMITS[tier][kind];
    const exceeded = BigInt(used) + BigInt(requested) > BigInt(limit);
    if (exceeded) {
      throw precondition('LIMITS.EXCEEDED', `${kind} limit reached for ${tier} accounts`, {
        kind,
        tier,
        limit: limit.toString(),
        used: used.toString(),
      });
    }
  }

  function describe(accountId: string, accountAgeMs: number): LimitsDto {
    const tier = tierOf(accountId, accountAgeMs);
    const l = TIER_LIMITS[tier];
    return {
      accountId,
      tier,
      limits: {
        listings_per_day: l.listings_per_day,
        open_offers: l.open_offers,
        open_trades: l.open_trades,
        messages_per_hour: l.messages_per_hour,
        auction_max_value_minor: l.auction_max_value.toString(),
      },
    };
  }

  function mine(ctx: CommandContext): LimitsDto {
    authorize(env, ctx, 'moderation.limits:read_own', 'limits');
    if (!env.ports.accounts) throw unavailable('LIMITS.ACCOUNTS_UNAVAILABLE', 'account lookup is not wired');
    const account = env.ports.accounts.get(ctx.actor.id);
    if (!account || account.tenantId !== ctx.actor.tenantId) throw notFound('LIMITS.ACCOUNT_NOT_FOUND', 'account not found');
    return describe(account.id, Math.max(0, env.deps.clock.now() - account.createdAt));
  }

  /** System query: the relay passes the account age it knows from identity. */
  function check(ctx: CommandContext, input: CheckLimitInput): { allowed: true; tier: TrustTier } {
    authorize(env, ctx, 'moderation.limits:check', 'limits');
    const v = parse(checkSchema, input);
    if (v.kind === 'auction_max_value') checkLimit(v.accountId, v.accountAgeMs, v.kind, BigInt(v.used), BigInt(v.requested));
    else checkLimit(v.accountId, v.accountAgeMs, v.kind, v.used, Number(v.requested));
    return { allowed: true, tier: tierOf(v.accountId, v.accountAgeMs) };
  }

  const operations = [
    operation('moderation.limits.mine', 'query', 'moderation.limits', 'Show the caller trust tier and limits', mine),
    operation('moderation.limits.check', 'query', 'moderation.limits', 'Check a quota; throws LIMITS.EXCEEDED (system)', check),
  ];
  return { tierOf, limitFor, checkLimit, describe, mine, check, operations };
}
