/**
 * @fileoverview Domain models for the LemonSqueezy licence tier system.
 */

/** The tier a user is operating under — free or paid pro. */
export type LicenceTier = 'free' | 'pro';

/**
 * The resolved licence status returned by the IPC bridge and stored in the LicenceStore.
 */
export interface LicenceStatus {
  /** Active tier for this installation. */
  tier: LicenceTier;
  /** ISO 8601 expiry date if the subscription has a fixed end date, otherwise null. */
  expiresAt: string | null;
}
