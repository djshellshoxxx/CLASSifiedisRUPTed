/**
 * Authorization policy for the platform area. Deny by default: administration needs the `admin` role;
 * platform-wide actions (tenants, kill switches, backups) additionally need an `operator` actor; only
 * anonymous-safe reads are public.
 */
import type { Permission } from '@classrup/kernel';
import type { Predicate, PolicyRule } from '@classrup/security';
import { allOf, anyOf, anyone, hasAnyRole, isSystem } from '@classrup/security';

export const PERM = {
  flagRead: 'platform.flag:read',
  flagOverride: 'platform.flag:override',
  flagKill: 'platform.flag:kill',
  moduleList: 'platform.module:list',
  moduleReport: 'platform.module:report',
  tenantCreate: 'platform.tenant:create',
  tenantUpdate: 'platform.tenant:update',
  tenantSuspend: 'platform.tenant:suspend',
  tenantRead: 'platform.tenant:read',
  healthCheck: 'platform.health:check',
  healthReport: 'platform.health:report',
  metricsExport: 'platform.metrics:export',
  backupCreate: 'platform.backup:create',
  backupVerify: 'platform.backup:verify',
  backupPrune: 'platform.backup:prune',
  backupRead: 'platform.backup:read',
  runbookRead: 'platform.runbook:read',
  drillManage: 'platform.drill:manage',
  drillRead: 'platform.drill:read',
  pwaManifest: 'platform.pwa:manifest',
  pwaCachePolicy: 'platform.pwa:cache_policy',
  threatRead: 'platform.threat:read',
  threatReview: 'platform.threat:review',
  incidentReport: 'platform.incident:report',
  incidentRead: 'platform.incident:read',
  incidentTriage: 'platform.incident:triage',
  incidentAnnotate: 'platform.incident:annotate',
  incidentManage: 'platform.incident:manage',
  incidentSweep: 'platform.incident:sweep',
  playbookRead: 'platform.playbook:read',
} as const satisfies Record<string, Permission>;

const admin = hasAnyRole('admin');
const staff = hasAnyRole('admin', 'support');
const operatorAdmin: Predicate = allOf(admin, (a) => a.kind === 'operator');
/** Tenant-scoped admin action: operators act on any tenant, tenant admins only on their own (resource id = tenant id). */
const tenantAdmin: Predicate = anyOf(operatorAdmin, allOf(admin, (a, r) => r?.id === a.tenantId));

const rule = (permission: Permission, allow: Predicate, description: string, isPublic = false): PolicyRule => ({
  permission,
  allow,
  description,
  ...(isPublic ? { public: true } : {}),
});

export const POLICIES: readonly PolicyRule[] = Object.freeze([
  rule(PERM.flagRead, tenantAdmin, 'Read effective flag state for a tenant'),
  rule(PERM.flagOverride, tenantAdmin, 'Set or clear a per-tenant flag override'),
  rule(PERM.flagKill, operatorAdmin, 'Engage or release a platform-wide runtime kill switch'),
  rule(PERM.moduleList, anyone, 'List modules and whether they are enabled', true),
  rule(PERM.moduleReport, admin, 'Module dependency report'),
  rule(PERM.tenantCreate, operatorAdmin, 'Create a tenant'),
  rule(PERM.tenantUpdate, operatorAdmin, 'Update tenant configuration'),
  rule(PERM.tenantSuspend, operatorAdmin, 'Suspend or reactivate a tenant'),
  rule(PERM.tenantRead, tenantAdmin, 'Read tenant configuration'),
  rule(PERM.healthCheck, anyone, 'Liveness and readiness status (no internals)', true),
  rule(PERM.healthReport, staff, 'Detailed health and SLO report'),
  rule(PERM.metricsExport, anyOf(operatorAdmin, isSystem), 'Export metrics in Prometheus text format'),
  rule(PERM.backupCreate, anyOf(operatorAdmin, isSystem), 'Create a signed backup snapshot'),
  rule(PERM.backupVerify, anyOf(operatorAdmin, isSystem), 'Verify a stored backup'),
  rule(PERM.backupPrune, anyOf(operatorAdmin, isSystem), 'Prune backups per the retention policy'),
  rule(PERM.backupRead, operatorAdmin, 'List backups'),
  rule(PERM.runbookRead, staff, 'Read disaster-recovery runbooks'),
  rule(PERM.drillManage, admin, 'Schedule and run disaster-recovery drills'),
  rule(PERM.drillRead, staff, 'Read drill records and status'),
  rule(PERM.pwaManifest, anyone, 'Web app manifest', true),
  rule(PERM.pwaCachePolicy, anyone, 'Service-worker cache policy table', true),
  rule(PERM.threatRead, admin, 'Read the threat register'),
  rule(PERM.threatReview, admin, 'Record a threat review'),
  rule(PERM.incidentReport, hasAnyRole('admin', 'support', 'moderator'), 'Open a security incident'),
  rule(PERM.incidentRead, staff, 'Read incidents'),
  rule(PERM.incidentTriage, staff, 'Triage an incident and set severity'),
  rule(PERM.incidentAnnotate, staff, 'Append notes to an incident timeline'),
  rule(PERM.incidentManage, admin, 'Advance incident phases, run playbooks, write the postmortem'),
  rule(PERM.incidentSweep, isSystem, 'Run the incident SLA sweeper'),
  rule(PERM.playbookRead, staff, 'Read response playbooks'),
]);
