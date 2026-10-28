/** Server-side surface of F15.S01: the manifest and cache policy the static host and service worker consume. */
import type { Deps, Operation } from '@classrup/kernel';
import { z } from '@classrup/kernel';
import type { TenantLookup } from '../config/tenants';
import { PERM } from '../policies';
import { authorize, operation } from '../support';
import { DEFAULT_CACHE_RULES, cacheName, CACHE_KINDS } from './cache';
import { buildManifest } from './install';

const FLAG = 'platform.pwa';
const emptySchema = z.strictObject({});

export interface PwaServices {
  readonly tenants: TenantLookup;
  /** Build id used in cache names; changes on every deploy. */
  readonly cacheVersion: string;
}

export function pwaOperations(deps: Deps, svc: PwaServices): readonly Operation[] {
  return [
    operation({ name: 'platform.pwa.manifest', kind: 'query', flag: FLAG, summary: 'Web app manifest for the caller tenant', public: true }, emptySchema, (ctx) => {
      authorize(deps, ctx, PERM.pwaManifest);
      const tenant = svc.tenants.get(ctx.actor.tenantId);
      return buildManifest({
        name: tenant?.name.slice(0, 45) ?? 'ClassRup',
        shortName: 'ClassRup',
        description: 'Local buying, selling and barter without handing over your address.',
        themeColor: '#0f766e',
        backgroundColor: '#ffffff',
        ...(tenant ? { lang: tenant.defaultLocale.split('-')[0] as string } : {}),
      });
    }),

    operation({ name: 'platform.pwa.cache_policy', kind: 'query', flag: FLAG, summary: 'Service-worker cache rules and cache names', public: true }, emptySchema, (ctx) => {
      authorize(deps, ctx, PERM.pwaCachePolicy);
      return {
        version: svc.cacheVersion,
        rules: DEFAULT_CACHE_RULES.map((r) => ({ ...r })),
        caches: CACHE_KINDS.map((k) => cacheName(k, svc.cacheVersion)),
      };
    }),
  ];
}
