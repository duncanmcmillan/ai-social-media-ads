/**
 * @fileoverview Workspace signal store.
 * Persists all workspace settings to localStorage so they survive app restarts.
 */
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import type {
  WorkspaceState,
  WorkspaceMetaDefaults,
  WorkspacePlacements,
  WorkspaceTargeting,
  WorkspaceEnhancements,
  WorkspaceLearningRules,
} from '../model/workspace.model';
import { DEFAULT_WORKSPACE_STATE } from '../model/workspace.model';

const STORAGE_KEY = 'ai-fb-ads:workspace';

/** Loads persisted settings from localStorage, merging with defaults. */
function loadPersistedState(): WorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WORKSPACE_STATE;
    return { ...DEFAULT_WORKSPACE_STATE, ...JSON.parse(raw) } as WorkspaceState;
  } catch {
    return DEFAULT_WORKSPACE_STATE;
  }
}

/** Saves the full workspace state to localStorage. */
function persist(state: WorkspaceState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silently ignore quota/private-browsing errors.
  }
}

/**
 * Global workspace settings store.
 * Provides defaults for Meta Page, Pixel, URL, targeting, and learning rules.
 */
export const WorkspaceStore = signalStore(
  { providedIn: 'root' },
  withState<WorkspaceState>(loadPersistedState()),
  withComputed((store) => ({
    /** Whether the three required workspace fields (Page, Pixel, URL) are all configured. */
    isConfigured: computed(() => {
      const d = store.metaDefaults();
      return !!d.facebookPageId && !!d.pixelId && !!d.websiteUrl;
    }),
    /** Count of required fields that are configured (0–3). */
    configuredCount: computed(() => {
      const d = store.metaDefaults();
      return [d.facebookPageId, d.pixelId, d.websiteUrl].filter(Boolean).length;
    }),
  })),
  withMethods((store) => {
    /** Reads all current signals into a plain state object for persistence. */
    const snapshot = (): WorkspaceState => ({
      metaDefaults: store.metaDefaults(),
      placements: store.placements(),
      targeting: store.targeting(),
      enhancements: store.enhancements(),
      learningRules: store.learningRules(),
    });

    return {
      /**
       * Updates Meta Defaults and persists.
       * @param patch - Partial meta defaults to merge.
       */
      updateMetaDefaults(patch: Partial<WorkspaceMetaDefaults>): void {
        patchState(store, { metaDefaults: { ...store.metaDefaults(), ...patch } });
        persist(snapshot());
      },

      /**
       * Updates placement / audience automation settings and persists.
       * @param patch - Partial placement settings to merge.
       */
      updatePlacements(patch: Partial<WorkspacePlacements>): void {
        patchState(store, { placements: { ...store.placements(), ...patch } });
        persist(snapshot());
      },

      /**
       * Updates default targeting and persists.
       * @param patch - Partial targeting settings to merge.
       */
      updateTargeting(patch: Partial<WorkspaceTargeting>): void {
        patchState(store, { targeting: { ...store.targeting(), ...patch } });
        persist(snapshot());
      },

      /**
       * Updates enhancement and attribution settings and persists.
       * @param patch - Partial enhancement settings to merge.
       */
      updateEnhancements(patch: Partial<WorkspaceEnhancements>): void {
        patchState(store, { enhancements: { ...store.enhancements(), ...patch } });
        persist(snapshot());
      },

      /**
       * Updates learning rule thresholds and persists.
       * @param patch - Partial learning rules to merge.
       */
      updateLearningRules(patch: Partial<WorkspaceLearningRules>): void {
        patchState(store, { learningRules: { ...store.learningRules(), ...patch } });
        persist(snapshot());
      },

      /**
       * Resets all workspace settings to factory defaults and persists.
       */
      resetToDefaults(): void {
        patchState(store, DEFAULT_WORKSPACE_STATE);
        persist(DEFAULT_WORKSPACE_STATE);
      },
    };
  })
);
