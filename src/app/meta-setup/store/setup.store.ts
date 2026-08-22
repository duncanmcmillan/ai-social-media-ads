/**
 * @fileoverview NgRx Signal Store for Meta Setup wizard progress.
 * Tracks which steps are complete, which step is expanded, and
 * reference IDs entered during the wizard. Persists to localStorage.
 */
import { computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import type { StepKey } from '../model/setup.model';
import { SETUP_STEPS } from '../model/setup.model';

const STORAGE_KEY = 'ai-fb-ads:setup-progress';

/** Shape of the setup wizard store state. */
interface SetupState {
  /** Steps the user has explicitly marked as complete. */
  completedSteps: StepKey[];
  /** The currently expanded step, or null when all collapsed. */
  openStep: StepKey | null;
  /** Business Portfolio ID entered by the user (reference only). */
  businessPortfolioId: string;
  /** Ad Account ID entered manually when not yet authenticated (reference only). */
  manualAdAccountId: string;
}

const initialState: SetupState = {
  completedSteps: [],
  openStep: 'business-portfolio',
  businessPortfolioId: '',
  manualAdAccountId: '',
};

/** Loads persisted setup progress from localStorage, merging with defaults. */
function loadPersistedState(): SetupState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return { ...initialState, ...JSON.parse(raw) } as SetupState;
  } catch {
    return initialState;
  }
}

/** Saves a setup state snapshot to localStorage. */
function persist(state: SetupState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silently ignore quota / private-browsing errors.
  }
}

/** NgRx Signal Store tracking Meta Setup wizard progress. */
export const SetupStore = signalStore(
  { providedIn: 'root' },
  withState<SetupState>(loadPersistedState()),
  withComputed((store) => ({
    /**
     * True when the user has completed every setup step.
     * Causes the wizard to be replaced by the reference card.
     */
    isComplete: computed(() => SETUP_STEPS.every(s => store.completedSteps().includes(s.key))),
  })),
  withMethods((store) => {
    /** Reads all current signals into a plain state object. */
    const snapshot = (): SetupState => ({
      completedSteps:      store.completedSteps(),
      openStep:            store.openStep(),
      businessPortfolioId: store.businessPortfolioId(),
      manualAdAccountId:   store.manualAdAccountId(),
    });

    return {
      /**
       * Marks a step as complete and advances the open step to the
       * next incomplete step, or null if all steps are done.
       *
       * @param key - The step to mark complete.
       */
      completeStep(key: StepKey): void {
        const completedSteps = store.completedSteps().includes(key)
          ? store.completedSteps()
          : [...store.completedSteps(), key];
        const openStep = SETUP_STEPS.find(s => !completedSteps.includes(s.key))?.key ?? null;
        const next: SetupState = { ...snapshot(), completedSteps, openStep };
        patchState(store, next);
        persist(next);
      },

      /**
       * Expands a specific step or collapses all steps.
       *
       * @param key - The step to expand, or null to collapse all.
       */
      setOpenStep(key: StepKey | null): void {
        const next: SetupState = { ...snapshot(), openStep: key };
        patchState(store, next);
        persist(next);
      },

      /**
       * Stores the Business Portfolio ID entered by the user and persists.
       *
       * @param id - The Business Portfolio ID.
       */
      setBusinessPortfolioId(id: string): void {
        const next: SetupState = { ...snapshot(), businessPortfolioId: id };
        patchState(store, next);
        persist(next);
      },

      /**
       * Stores the manually entered Ad Account ID and persists.
       *
       * @param id - The Ad Account ID entered before authenticating.
       */
      setManualAdAccountId(id: string): void {
        const next: SetupState = { ...snapshot(), manualAdAccountId: id };
        patchState(store, next);
        persist(next);
      },

      /**
       * Clears all wizard progress and re-opens the first step.
       * Used by the "Reopen wizard" button on the reference card.
       */
      reset(): void {
        patchState(store, initialState);
        persist(initialState);
      },
    };
  })
);
