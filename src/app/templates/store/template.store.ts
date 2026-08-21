/**
 * @fileoverview Campaign Template signal store.
 * Persists named campaign templates to localStorage.
 * Templates can be saved from the Review step and loaded at the start of a new campaign.
 */
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import type { CampaignTemplate } from '../model/template.model';
import type { DraftCampaign, DraftAdSet, DraftCreative } from '../../new-campaign/model/draft.model';

const STORAGE_KEY = 'ai-fb-ads:templates';

/** Loads persisted templates from localStorage. */
function loadPersistedTemplates(): CampaignTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CampaignTemplate[];
  } catch {
    return [];
  }
}

/** Writes the template list to localStorage. */
function persist(templates: CampaignTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // Silently ignore quota/private-browsing errors.
  }
}

/** State for the template store. */
interface TemplateState {
  /** All saved templates. */
  templates: CampaignTemplate[];
}

/**
 * Campaign Template store.
 * Provides save/remove/lookup operations backed by localStorage.
 * Loading a template into the wizard is handled by the component (CampaignStepComponent)
 * to avoid circular injection between stores.
 */
export const TemplateStore = signalStore(
  { providedIn: 'root' },
  withState<TemplateState>({ templates: loadPersistedTemplates() }),
  withComputed((store) => ({
    /**
     * All templates sorted descending by savedAt timestamp.
     * @returns Sorted template array.
     */
    list: computed(() =>
      [...store.templates()].sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    ),
  })),
  withMethods((store) => ({
    /**
     * Saves the current draft as a named template.
     * @param name - User-supplied template name.
     * @param draft - The campaign, ad sets, and creatives to save (without File objects).
     */
    save(
      name: string,
      draft: {
        campaign: DraftCampaign;
        adSets: DraftAdSet[];
        creatives: Omit<DraftCreative, 'file' | 'objectUrl'>[];
      }
    ): void {
      const template: CampaignTemplate = {
        id: crypto.randomUUID(),
        name,
        savedAt: new Date().toISOString(),
        campaign: draft.campaign,
        adSets: draft.adSets,
        creatives: draft.creatives,
      };
      const updated = [...store.templates(), template];
      patchState(store, { templates: updated });
      persist(updated);
    },

    /**
     * Removes a template by ID.
     * @param id - The template's client-side UUID.
     */
    remove(id: string): void {
      const updated = store.templates().filter(t => t.id !== id);
      patchState(store, { templates: updated });
      persist(updated);
    },

    /**
     * Returns a template by ID, or undefined if not found.
     * @param id - The template's client-side UUID.
     * @returns The matching template or undefined.
     */
    getById(id: string): CampaignTemplate | undefined {
      return store.templates().find(t => t.id === id);
    },
  }))
);
