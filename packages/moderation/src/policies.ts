/** Authorization rules (deny by default). No moderation permission is public: every read is either staff-only or the caller's own data. */
import type { Actor } from '@classrup/kernel';
import type { PolicyRule, Predicate } from '@classrup/security';
import { anyOf, hasAnyRole, isSystem } from '@classrup/security';

const isUser: Predicate = (a: Actor) => a.kind === 'user';
const staff = hasAnyRole('moderator', 'admin');
const staffOrSystem = anyOf(staff, isSystem);

const rule = (permission: PolicyRule['permission'], allow: Predicate, description: string): PolicyRule => ({ permission, allow, description });

export const POLICIES: readonly PolicyRule[] = [
  rule('moderation.report:create', isUser, 'Signed-in users can report subjects'),
  rule('moderation.report:read_own', isUser, 'Reporters can list their own reports'),
  rule('moderation.report:read', staff, 'Moderators can read the reports of a case, including reporter identity'),
  rule('moderation.case:read', staff, 'Moderators can read the case queue'),
  rule('moderation.case:claim', staff, 'Moderators can claim and release cases'),
  rule('moderation.case:assign', hasAnyRole('admin'), 'Admins can assign cases to moderators'),
  rule('moderation.evidence:add', staff, 'Moderators can append evidence to a case'),
  rule('moderation.evidence:read', staff, 'Moderators can read and verify evidence chains'),
  rule('moderation.enforcement:decide', staff, 'Moderators can decide claimed cases'),
  rule('moderation.enforcement:approve', staff, 'Moderators can approve or reject pending decisions of others'),
  rule('moderation.enforcement:read', staff, 'Moderators can list enforcements'),
  rule('moderation.enforcement:read_own', isUser, 'Users can read decisions affecting them'),
  rule('moderation.enforcement:expire', isSystem, 'Scheduler ends elapsed suspensions and restrictions'),
  rule('moderation.appeal:create', isUser, 'Users can appeal decisions about them'),
  rule('moderation.appeal:read_own', isUser, 'Users can read their own appeals'),
  rule('moderation.appeal:review', staff, 'Moderators can review appeals'),
  rule('moderation.spam:assess', isSystem, 'Relay scores content before publishing'),
  rule('moderation.block:create', isUser, 'Users can block other accounts'),
  rule('moderation.block:remove', isUser, 'Users can remove their blocks'),
  rule('moderation.block:read_own', isUser, 'Users can list their own blocks'),
  rule('moderation.signal:record', isSystem, 'Features report risk signals through the relay'),
  rule('moderation.signal:read', staff, 'Moderators can inspect risk signals'),
  rule('moderation.risk:assess', staffOrSystem, 'Staff and the relay can obtain an explainable risk decision'),
  rule('moderation.limits:read_own', isUser, 'Users can see their trust tier and limits'),
  rule('moderation.limits:check', isSystem, 'Relay checks quotas for an account'),
];
