/**
 * @fileoverview NgRx Signal Store for the LemonSqueezy licence tier.
 * Root-level store so the resolved tier is available to all feature components.
 * Initialises to 'free'; `checkLicence()` is called from App.ngAfterViewInit.
 */
import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { LicenceService } from '../services/licence/licence.service';
import { extractFacebookError } from '../utils/facebook-error.utils';
import type { LicenceTier } from '../models/licence.model';

/** Shape of the licence store state. */
interface LicenceState {
  /** Active licence tier. Defaults to 'free' until validated. */
  tier: LicenceTier;
  /** ISO 8601 expiry date, or null for perpetual / no licence. */
  expiresAt: string | null;
  /** True while a licence API call is in flight. */
  isChecking: boolean;
  /** Error message from the last failed operation, or null. */
  error: string | null;
}

const initialState: LicenceState = {
  tier: 'free',
  expiresAt: null,
  isChecking: false,
  error: null,
};

/** Singleton store tracking the active licence tier across the whole app. */
export const LicenceStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, licenceService = inject(LicenceService)) => ({
    /**
     * Validates the stored licence key against LemonSqueezy.
     * Called from `App.ngAfterViewInit` after the GDPR gate.
     * Falls back to the cached status when the network is unavailable.
     * @returns Promise that resolves once the tier has been determined.
     */
    async checkLicence(): Promise<void> {
      patchState(store, { isChecking: true, error: null });
      try {
        const status = await licenceService.validate();
        patchState(store, { tier: status.tier, expiresAt: status.expiresAt, isChecking: false });
      } catch (e: unknown) {
        // validate() should not throw in practice (main.js handles offline fallback),
        // but if the bridge itself errors, fall back to the local cached status.
        try {
          const cached = await licenceService.getStatus();
          patchState(store, { tier: cached.tier, expiresAt: cached.expiresAt, isChecking: false });
        } catch {
          patchState(store, { tier: 'free', expiresAt: null, isChecking: false });
        }
      }
    },

    /**
     * Activates a LemonSqueezy licence key on this machine.
     * On success, tier is updated to 'pro'.
     * @param key - The licence key entered by the user.
     * @returns Promise that resolves once activation completes or fails.
     */
    async activateLicence(key: string): Promise<void> {
      patchState(store, { isChecking: true, error: null });
      try {
        const status = await licenceService.activate(key);
        patchState(store, { tier: status.tier, expiresAt: status.expiresAt, isChecking: false });
      } catch (e: unknown) {
        patchState(store, {
          error: extractFacebookError(e, 'Activation failed. Check your licence key and try again.'),
          isChecking: false,
        });
      }
    },

    /**
     * Deactivates the licence on this machine and resets the tier to 'free'.
     * Use when moving the licence to a different machine.
     * @returns Promise that resolves once deactivation completes or fails.
     */
    async deactivateLicence(): Promise<void> {
      patchState(store, { isChecking: true, error: null });
      try {
        await licenceService.deactivate();
        patchState(store, { tier: 'free', expiresAt: null, isChecking: false });
      } catch (e: unknown) {
        patchState(store, {
          error: extractFacebookError(e, 'Deactivation failed. Please try again.'),
          isChecking: false,
        });
      }
    },
  }))
);
