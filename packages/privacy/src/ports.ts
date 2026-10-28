import type { NotifyPort } from '@classrup/kernel';

export interface PrivacyPorts {
  /** Owner: F13 notifications. Used for "export ready" and "deletion scheduled". */
  readonly notifier?: NotifyPort;
}

export interface ResolvedPrivacyPorts {
  readonly notifier: NotifyPort;
}

export const silentNotifier: NotifyPort = { notify: () => undefined };

export const resolvePorts = (ports: PrivacyPorts = {}): ResolvedPrivacyPorts => ({ notifier: ports.notifier ?? silentNotifier });
