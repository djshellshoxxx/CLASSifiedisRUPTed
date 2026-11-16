// @classrup/kernel/node — relay-only adapters (node:sqlite storage, node:http).
export { openSqliteStorage, type SqliteOptions, type SqliteStorage } from './storage/sqlite.ts';
export { KERNEL_SQL_MIGRATIONS, type SqlMigration } from './storage/sqlite-schema.ts';
export { BODY_LIMIT_BYTES, createHttpHandler, METRICS_CAPABILITY, startHttpServer, type HttpAdapterOptions, type HttpHandler, type RunningServer } from './http/server.ts';
