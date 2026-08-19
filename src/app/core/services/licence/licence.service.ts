/**
 * @fileoverview Angular service wrapping the Electron IPC licence bridge.
 * Provides activate, validate, deactivate, and getStatus operations.
 * All network calls are made in the Electron main process — this service
 * only passes arguments over the IPC bridge and returns the result.
 */
import { Injectable } from '@angular/core';
import type { LicenceStatus } from '../../models/licence.model';

/** Shape of the licence IPC bridge exposed by `preload.js`. */
type LicenceBridge = {
  /** Activate a LemonSqueezy licence key on this machine. */
  activate: (key: string) => Promise<LicenceStatus>;
  /** Validate the stored licence key against LemonSqueezy (with offline grace period). */
  validate: () => Promise<LicenceStatus>;
  /** Deactivate the stored licence key and remove `licence.enc`. */
  deactivate: () => Promise<void>;
  /** Read the cached licence status from `licence.enc` without a network call. */
  getStatus: () => Promise<LicenceStatus>;
};

const bridge = (window as unknown as { licence?: LicenceBridge }).licence ?? null;

/** Electron IPC bridge for LemonSqueezy licence operations. */
@Injectable({ providedIn: 'root' })
export class LicenceService {
  /** True when running inside Electron and the bridge is available. */
  readonly isElectron = !!bridge;

  /**
   * Activates a LemonSqueezy licence key on this machine.
   * Stores the instance ID and tier in `licence.enc` on success.
   * @param key - The LemonSqueezy licence key (e.g. `LS-xxx`).
   * @returns Resolved licence status with tier and optional expiry date.
   * @throws Error when not running in Electron or when the key is invalid.
   */
  async activate(key: string): Promise<LicenceStatus> {
    if (!bridge) throw new Error('Not running in Electron');
    return bridge.activate(key);
  }

  /**
   * Validates the stored licence key against LemonSqueezy.
   * The main process applies a 7-day offline grace period on network failure.
   * @returns Resolved licence status (never throws — always returns a status).
   * @throws Error when not running in Electron.
   */
  async validate(): Promise<LicenceStatus> {
    if (!bridge) return { tier: 'free', expiresAt: null };
    return bridge.validate();
  }

  /**
   * Deactivates the stored licence key and deletes `licence.enc`.
   * Use when moving to a different machine.
   * @throws Error when not running in Electron.
   */
  async deactivate(): Promise<void> {
    if (!bridge) throw new Error('Not running in Electron');
    return bridge.deactivate();
  }

  /**
   * Returns the cached licence status from `licence.enc` without a network call.
   * Returns free tier when no licence is stored.
   * @returns Cached licence status.
   */
  async getStatus(): Promise<LicenceStatus> {
    if (!bridge) return { tier: 'free', expiresAt: null };
    return bridge.getStatus();
  }
}
