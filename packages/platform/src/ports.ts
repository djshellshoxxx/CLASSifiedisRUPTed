/**
 * Consumer-side ports of the platform package. Every port has a safe in-memory default so the package
 * runs standalone; the relay wires durable implementations (files, object storage, IndexedDB).
 */
import type { ModuleDescriptor } from '@classrup/kernel';
import type { SigningKeyPair } from '@classrup/security';
import type { FlagService } from './config/flags';
import type { SnapshotSource, RetentionPolicy } from './ops/backups';
import type { HealthRegistry } from './ops/health';
import type { MetricsRegistry } from './ops/metrics';

/** Opaque blob storage for serialized backups. The relay must encrypt it at rest: backups contain private records. */
export interface BackupStore {
  put(id: string, text: string): void;
  get(id: string): string | undefined;
  delete(id: string): void;
}

export class MemoryBackupStore implements BackupStore {
  readonly #blobs = new Map<string, string>();
  put(id: string, text: string): void {
    this.#blobs.set(id, text);
  }
  get(id: string): string | undefined {
    return this.#blobs.get(id);
  }
  delete(id: string): void {
    this.#blobs.delete(id);
  }
}

export interface PlatformPorts {
  /** Flag service already installed as `deps.flags`. Default: a new FlagService over `deps.store` with DEFAULT_FLAGS. */
  readonly flags?: FlagService;
  /** Registry already installed as `deps.metrics`; required only for `platform.metrics.export`. */
  readonly metrics?: MetricsRegistry;
  readonly health?: HealthRegistry;
  /** Module descriptors of the other packages, keyed by package name (`bazaar`, `mutiny`, ...). */
  readonly moduleSources?: Readonly<Record<string, readonly ModuleDescriptor[]>>;
  readonly backupStore?: BackupStore;
  /** Default: `deps.store` when it can export snapshots (InMemoryDataStore). */
  readonly snapshotSource?: SnapshotSource;
  /** Operator Ed25519 key used to sign backup manifests. Without it backup operations are unavailable. */
  readonly operatorKey?: SigningKeyPair;
  readonly retention?: RetentionPolicy;
  /** Service-worker cache build id (changes on every PWA deploy). Default `1`. */
  readonly cacheVersion?: string;
}
