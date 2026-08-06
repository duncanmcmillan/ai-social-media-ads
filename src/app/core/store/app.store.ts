/**
 * @fileoverview Global application signal store.
 * Holds cross-feature state such as the selected ad account and global loading state.
 */
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';

/** Shape of the global application state. */
interface AppState {
  /** The currently selected ad account ID, or null if not yet chosen. */
  selectedAdAccountId: string | null;
  /** Whether any global operation is in progress. */
  isLoading: boolean;
  /** Global error message, or null if no error is active. */
  error: string | null;
}

const initialState: AppState = {
  selectedAdAccountId: null,
  isLoading: false,
  error: null,
};

/** Singleton global store providing cross-feature application state. */
export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    /**
     * Sets the active ad account ID.
     * @param id - The ad account ID (e.g. `act_1234567890`).
     */
    selectAdAccount(id: string): void {
      patchState(store, { selectedAdAccountId: id, error: null });
    },

    /**
     * Clears the active ad account selection.
     */
    clearAdAccount(): void {
      patchState(store, { selectedAdAccountId: null });
    },

    /**
     * Sets a global error message.
     * @param error - The error string to display.
     */
    setError(error: string): void {
      patchState(store, { error, isLoading: false });
    },

    /**
     * Clears any active global error.
     */
    clearError(): void {
      patchState(store, { error: null });
    },
  }))
);
