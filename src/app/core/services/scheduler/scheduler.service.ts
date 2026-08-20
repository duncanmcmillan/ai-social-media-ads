/**
 * @fileoverview Scheduler service.
 * Listens for IPC `scheduler:sync-due` events from the Electron main process,
 * orchestrates a full dashboard sync, diffs the resulting gates against a
 * known-gates set in localStorage, and sends Slack alerts for newly breached gates.
 * Exposes `nextSyncAt` and `lastSyncAt` signals for the dashboard toolbar.
 */
import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { DashboardStore } from '../../../dashboard/store/dashboard.store';
import { WorkspaceStore } from '../../../workspace/store/workspace.store';
import { AuthStore } from '../../../auth/store/auth.store';
import { SlackService } from '../slack/slack.service';
import { gateKey } from '../../../dashboard/model/dashboard.model';

/** IPC bridge type for the scheduler, exposed by `preload.js` as `window.appScheduler`. */
type SchedulerBridge = {
  /** Retrieves the stored sync timestamps from the main process. */
  getTimestamps(): Promise<{ lastSyncAt: string | null; nextSyncAt: string | null }>;
  /**
   * Triggers an immediate sync (fires `sync-due` to renderer) and returns updated timestamps.
   * Used only by the automated scheduler path.
   */
  syncNow(): Promise<{ lastSyncAt: string; nextSyncAt: string }>;
  /**
   * Resets the timer and timestamps WITHOUT firing `sync-due`.
   * Used by "Update now" so the renderer drives the sync without triggering a second run
   * via the `onSyncDue` IPC listener.
   */
  resetTimer(): Promise<{ lastSyncAt: string; nextSyncAt: string }>;
  /** Registers a callback invoked when the scheduler fires. */
  onSyncDue(cb: () => void): void;
  /**
   * Registers a callback invoked whenever timestamps are updated.
   * @param cb - Called with the new timestamp pair.
   */
  onTimestampsUpdated(cb: (ts: { lastSyncAt: string | null; nextSyncAt: string | null }) => void): void;
  /** Removes all `scheduler:*` IPC listeners registered by this bridge. */
  removeListeners(): void;
};

const bridge = (window as unknown as { appScheduler?: SchedulerBridge }).appScheduler ?? null;

/**
 * Singleton service that wires the Electron scheduler IPC to the Angular
 * dashboard sync pipeline and Slack notification dispatch.
 */
@Injectable({ providedIn: 'root' })
export class SchedulerService implements OnDestroy {
  private readonly dashboardStore = inject(DashboardStore);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly slackService   = inject(SlackService);
  private readonly authStore      = inject(AuthStore);

  /** ISO timestamp of the last completed sync, or null before first sync. */
  readonly lastSyncAt = signal<Date | null>(null);
  /** ISO timestamp of the next scheduled sync, or null when not running in Electron. */
  readonly nextSyncAt = signal<Date | null>(null);

  private readonly KNOWN_GATES_KEY = 'ai-fb-ads:known-gates';

  constructor() {
    if (!bridge) return;
    void bridge.getTimestamps().then(ts => this.applyTimestamps(ts));
    bridge.onSyncDue(() => void this.onSyncDue());
    bridge.onTimestampsUpdated(ts => this.applyTimestamps(ts));
  }

  /** Removes IPC listeners when the service is destroyed. */
  ngOnDestroy(): void {
    bridge?.removeListeners();
  }

  /**
   * Handles the "Update now" button press.
   * Uses `resetTimer` (not `syncNow`) so the IPC `sync-due` event is NOT fired,
   * preventing a second sync from running via the `onSyncDue` listener.
   * Performs a live API sync only when authenticated; always runs the Slack
   * gate diff so the button works with test data and real data alike.
   * @returns Promise that resolves once the sync and Slack diff complete.
   */
  async syncNow(): Promise<void> {
    if (bridge) {
      // resetTimer updates timestamps and resets the 12-hour countdown WITHOUT
      // sending scheduler:sync-due, so onSyncDue() is not triggered a second time.
      const ts = await bridge.resetTimer();
      this.applyTimestamps(ts);
    }
    // Live API sync only when authenticated with Facebook.
    if (this.authStore.isAuthenticated()) {
      await this.dashboardStore.sync();
    }
    this.lastSyncAt.set(new Date());
    // Always run Slack diff — works with both live data and test data.
    await this.notifyNewGates();
  }

  /**
   * Updates the local timestamp signals from a raw IPC timestamp pair.
   * @param ts - Raw timestamp strings from the main process.
   */
  private applyTimestamps(ts: { lastSyncAt: string | null; nextSyncAt: string | null }): void {
    this.lastSyncAt.set(ts.lastSyncAt ? new Date(ts.lastSyncAt) : null);
    this.nextSyncAt.set(ts.nextSyncAt ? new Date(ts.nextSyncAt) : null);
  }

  /**
   * Runs a full dashboard sync and dispatches Slack alerts for newly breached gates.
   * @returns Promise that resolves once sync and notifications complete.
   */
  private async onSyncDue(): Promise<void> {
    if (!this.authStore.isAuthenticated()) return;
    await this.dashboardStore.sync();
    this.lastSyncAt.set(new Date());
    await this.notifyNewGates();
  }

  /**
   * Diffs current gates against known gates and sends Slack alerts for new breaches.
   * Updates known-gates set in localStorage after each run.
   * @returns Promise that resolves once all Slack POSTs have settled.
   */
  private async notifyNewGates(): Promise<void> {
    const webhookUrl = this.workspaceStore.slackWebhookUrl();
    if (!webhookUrl) return;

    const currentGates  = this.dashboardStore.gates();
    const currentKeys   = currentGates.map(g => gateKey(g));
    const knownKeys     = this.loadKnownGates();
    const newlyBreached = currentGates.filter(g => !knownKeys.includes(gateKey(g)));

    for (const gate of newlyBreached) {
      const key = gateKey(gate);
      this.dashboardStore.setGateSlackStatus(key, 'sending');
      try {
        await this.slackService.sendGateAlert(gate, webhookUrl);
        this.dashboardStore.setGateSlackStatus(key, 'sent');
      } catch {
        this.dashboardStore.setGateSlackStatus(key, 'error');
      }
    }

    this.saveKnownGates(currentKeys);
  }

  /**
   * Removes all persisted known-gate keys so every current gate is treated as
   * newly breached on the next `notifyNewGates()` run.
   * Called when test data is loaded so the Slack gate-diff resets alongside the data.
   */
  clearKnownGates(): void {
    localStorage.removeItem(this.KNOWN_GATES_KEY);
  }

  /**
   * Reads the persisted set of known gate keys from localStorage.
   * @returns Array of gate key strings; empty array when not yet set or corrupt.
   */
  private loadKnownGates(): string[] {
    try {
      return JSON.parse(localStorage.getItem(this.KNOWN_GATES_KEY) ?? '[]') as string[];
    } catch {
      return [];
    }
  }

  /**
   * Persists the current set of gate keys to localStorage.
   * @param keys - Gate keys to persist.
   */
  private saveKnownGates(keys: string[]): void {
    localStorage.setItem(this.KNOWN_GATES_KEY, JSON.stringify(keys));
  }
}
