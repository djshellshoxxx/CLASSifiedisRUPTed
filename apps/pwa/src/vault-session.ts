import { createVaultAutoLock, type AutoLockReason } from '../../../packages/vault/src/index.ts';

interface SessionDocument extends EventTarget { readonly hidden: boolean }
interface SessionProtectionPorts {
  readonly document: SessionDocument;
  lock(reason: AutoLockReason): Promise<void>;
  onError(error: unknown): void;
}

/** A lock can happen during either domain work or post-commit notification delivery. */
export async function runForSession<Session, Value>(session: Session, current: () => Session | undefined,
  work: () => Promise<Value>, after?: () => Promise<void>): Promise<Value> {
  const active = () => { if (current() !== session) throw new Error('Vault session ended. Unlock to review saved records.'); };
  active();
  const value = await work();
  active();
  if (after) { await after(); active(); }
  return value;
}

/** Activity is local to this unlocked session; synthetic events cannot keep it open. */
export function protectVaultSession(ports: SessionProtectionPorts) {
  const controller = createVaultAutoLock({ lock: ports.lock, onError: ports.onError });
  const activity = (event: Event) => { if (event.isTrusted) controller.activity(); };
  const visibility = () => controller.visibilityChanged(ports.document.hidden);
  ports.document.addEventListener('pointerdown', activity, { capture: true, passive: true });
  ports.document.addEventListener('keydown', activity, { capture: true });
  ports.document.addEventListener('visibilitychange', visibility);
  visibility();
  return {
    setIdleMinutes(minutes: number) { controller.setIdleMinutes(minutes); },
    dispose() {
      controller.dispose();
      ports.document.removeEventListener('pointerdown', activity, true);
      ports.document.removeEventListener('keydown', activity, true);
      ports.document.removeEventListener('visibilitychange', visibility);
    },
  };
}
