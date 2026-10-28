/** Deny-by-default authorization for area `privacy`. No operation here is anonymous-safe. */
import type { PolicyRule } from '@classrup/security';
import { anyOf, authenticated, hasAnyRole, isOwner, isSystem } from '@classrup/security';

const adminOrSystem = anyOf(hasAnyRole('admin'), isSystem);

export const POLICIES: readonly PolicyRule[] = Object.freeze([
  { permission: 'privacy.consent:grant', allow: isOwner, description: 'Only the person grants consent for their own data' },
  { permission: 'privacy.consent:withdraw', allow: isOwner, description: 'Only the person withdraws their own consent' },
  { permission: 'privacy.consent:read', allow: isOwner, description: 'Person reads own consent state and history' },

  { permission: 'privacy.retention:read', allow: authenticated, description: 'Retention rules are transparent to signed-in users' },
  { permission: 'privacy.retention:configure', allow: adminOrSystem, description: 'Admin tunes fixed-duration retention within bounds' },
  { permission: 'privacy.retention:plan', allow: isSystem, description: 'Scheduler plans retention sweeps' },
  { permission: 'privacy.hold:manage', allow: adminOrSystem, description: 'Admin places, releases and lists legal holds' },

  { permission: 'privacy.export:request', allow: isOwner, description: 'Only the person requests an export of their data' },
  { permission: 'privacy.export:read', allow: isOwner, description: 'Person reads own export status' },
  { permission: 'privacy.export:download', allow: isOwner, description: 'Only the person downloads their export' },
  { permission: 'privacy.export:expire', allow: isSystem, description: 'Scheduler expires exports' },

  { permission: 'privacy.deletion:request', allow: isOwner, description: 'Only the person requests deletion of their account data' },
  { permission: 'privacy.deletion:read', allow: isOwner, description: 'Person reads own deletion status and report' },
  { permission: 'privacy.deletion:cancel', allow: isOwner, description: 'Person cancels a pending deletion' },
  { permission: 'privacy.deletion:process', allow: isSystem, description: 'Scheduler executes due deletions' },

  { permission: 'privacy.threat:read', allow: authenticated, description: 'Signed-in users may read the threat register' },
  { permission: 'privacy.model:read', allow: authenticated, description: 'Signed-in users may read the privacy model' },
]);
