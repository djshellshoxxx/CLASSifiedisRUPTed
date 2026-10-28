/** Relay configuration from environment variables. Values are validated; secrets never logged. */
import { z } from '@classrup/kernel';
import { loadSecrets, type Secret } from '@classrup/security';

const EnvSchema = z.object({
  CLASSRUP_PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  CLASSRUP_HOST: z.string().default('127.0.0.1'),
  CLASSRUP_DB_PATH: z.string().min(1).default('./data/relay.sqlite'),
  CLASSRUP_TENANT: z.string().regex(/^tnt_[a-z0-9_]{1,40}$/).default('tnt_default'),
  CLASSRUP_ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173'),
  CLASSRUP_RELAY_ID: z.string().regex(/^[a-z0-9.-]{3,253}$/).default('relay.local'),
  CLASSRUP_OPERATOR_ACCOUNT: z.string().optional(),
  CLASSRUP_SWEEP_INTERVAL_MS: z.coerce.number().int().min(1000).default(30_000),
  CLASSRUP_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CLASSRUP_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  CLASSRUP_STATIC_DIR: z.string().optional(),
});

export interface RelayConfig {
  readonly port: number;
  readonly host: string;
  readonly dbPath: string;
  readonly tenantId: string;
  readonly allowedOrigins: readonly string[];
  readonly relayId: string;
  readonly operatorAccountId?: string;
  readonly sweepIntervalMs: number;
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
  readonly env: 'development' | 'test' | 'staging' | 'production';
  readonly staticDir?: string;
  /** Base64url Ed25519 secret key used to countersign federated records and backups. */
  readonly relaySigningKey?: Secret;
}

export function loadConfig(env: Readonly<Record<string, string | undefined>> = process.env): RelayConfig {
  const e = EnvSchema.parse(env);
  const production = e.CLASSRUP_ENV === 'production' || e.CLASSRUP_ENV === 'staging';
  const secrets = loadSecrets(env, [{ name: 'CLASSRUP_RELAY_SIGNING_KEY', required: production, minLength: 43 }]);
  const key = secrets.get('CLASSRUP_RELAY_SIGNING_KEY');
  return {
    port: e.CLASSRUP_PORT,
    host: e.CLASSRUP_HOST,
    dbPath: e.CLASSRUP_DB_PATH,
    tenantId: e.CLASSRUP_TENANT,
    allowedOrigins: e.CLASSRUP_ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
    relayId: e.CLASSRUP_RELAY_ID,
    sweepIntervalMs: e.CLASSRUP_SWEEP_INTERVAL_MS,
    logLevel: e.CLASSRUP_LOG_LEVEL,
    env: e.CLASSRUP_ENV,
    ...(e.CLASSRUP_OPERATOR_ACCOUNT ? { operatorAccountId: e.CLASSRUP_OPERATOR_ACCOUNT } : {}),
    ...(e.CLASSRUP_STATIC_DIR ? { staticDir: e.CLASSRUP_STATIC_DIR } : {}),
    ...(key ? { relaySigningKey: key } : {}),
  };
}
