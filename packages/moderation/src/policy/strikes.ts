/** Graduated strike bookkeeping derived from enforcement history; nothing is stored separately. */
import { DAY } from '@classrup/kernel';
import type { Env } from '../common';
import type { EnforcementRecord, RestrictionFeature } from '../types';

export const STRIKE_DECAY_MS = 180 * DAY;
export const SUSPENSION_RECOMMENDATION_STRIKES = 3;

const countsAsStrike = (e: EnforcementRecord, now: number): boolean =>
  e.action !== 'dismiss' &&
  (e.status === 'active' || e.status === 'expired') &&
  e.appliedAt !== undefined &&
  now - e.appliedAt < STRIKE_DECAY_MS;

export function activeStrikes(env: Env, accountId: string, now: number): EnforcementRecord[] {
  return env.cols.enforcements.list((e) => e.subjectAccountId === accountId && countsAsStrike(e, now));
}

export function activeRestrictions(env: Env, accountId: string, now: number): EnforcementRecord[] {
  return env.cols.enforcements.list(
    (e) => e.subjectAccountId === accountId && e.action === 'restrict' && e.status === 'active' && (e.expiresAt === undefined || e.expiresAt > now),
  );
}

export const restrictsFeature = (e: EnforcementRecord, feature: RestrictionFeature): boolean => e.restriction === feature;

/** True while the account holds a suspension or ban other than `exceptId` that has not run out. */
export function hasOtherActiveSuspension(env: Env, accountId: string, exceptId: string, now: number): boolean {
  return env.cols.enforcements.count(
    (e) =>
      e.subjectAccountId === accountId &&
      e.id !== exceptId &&
      e.status === 'active' &&
      (e.action === 'ban' || (e.action === 'suspend' && (e.expiresAt === undefined || e.expiresAt > now))),
  ) > 0;
}
