/**
 * @fileoverview NgRx Signal Store for AI-generated Marketing Guides.
 * Manages guide generation, history, and localStorage persistence.
 * Guide generation is Pro-gated; seed data is always available.
 */
import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { AiService } from '../../core/services/ai/ai.service';
import { extractFacebookError } from '../../core';
import type { AppType, GuideContent, GuideContext, GuideObjective, MarketingGuide } from '../model/guides.model';

const STORAGE_KEY = 'ai-fb-ads:guides';

/** Internal store state shape. */
interface GuidesState {
  /** Currently selected app type for the next guide generation. */
  selectedAppType: AppType;
  /** Currently selected campaign objective for the next guide generation. */
  selectedObjective: GuideObjective;
  /** All saved guides, persisted to localStorage. */
  savedGuides: MarketingGuide[];
  /** True while an AI guide generation request is in flight. */
  isGenerating: boolean;
  /** Error message from the last failed generation, or null. */
  error: string | null;
  /** ID of the guide currently displayed in the panel, or null. */
  activeGuideId: string | null;
}

const initialState: GuidesState = {
  selectedAppType:    'desktop-app',
  selectedObjective:  'OUTCOME_SALES',
  savedGuides:        [],
  isGenerating:       false,
  error:              null,
  activeGuideId:      null,
};

/** Loads persisted guides from localStorage. */
function loadPersistedGuides(): MarketingGuide[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MarketingGuide[]) : [];
  } catch {
    return [];
  }
}

/** Persists the guide list to localStorage. */
function persist(guides: MarketingGuide[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guides));
  } catch {
    // Silently ignore quota/private-browsing errors.
  }
}

/** Generates a UUID v4 string. */
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * Root-level store for AI-generated marketing guides.
 * Guides are persisted to localStorage so they survive app restarts.
 */
export const GuidesStore = signalStore(
  { providedIn: 'root' },
  withState<GuidesState>({ ...initialState, savedGuides: loadPersistedGuides() }),
  withComputed((store) => ({
    /**
     * The guide currently selected for display in the panel, or null.
     */
    activeGuide: computed((): MarketingGuide | null =>
      store.savedGuides().find(g => g.id === store.activeGuideId()) ?? null
    ),

    /**
     * All saved guides sorted descending by generation date (newest first).
     */
    sortedGuides: computed((): MarketingGuide[] =>
      [...store.savedGuides()].sort(
        (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      )
    ),
  })),
  withMethods((store) => {
    const aiService = inject(AiService);

    return {
      /**
       * Sets the selected app type.
       * @param type - The app type to select.
       */
      setAppType(type: AppType): void {
        patchState(store, { selectedAppType: type });
      },

      /**
       * Sets the selected campaign objective.
       * @param objective - The objective to select.
       */
      setObjective(objective: GuideObjective): void {
        patchState(store, { selectedObjective: objective });
      },

      /**
       * Generates a new marketing guide via the AI service and saves it.
       * @param ctx - The dashboard context to send to the AI.
       */
      async generate(ctx: GuideContext): Promise<void> {
        patchState(store, { isGenerating: true, error: null });
        try {
          const content: GuideContent = await aiService.generateGuide(ctx);
          const guide: MarketingGuide = {
            id:            uuid(),
            appType:       ctx.appType,
            objective:     ctx.objective,
            generatedAt:   new Date().toISOString(),
            content,
            contextSnapshot: {
              gates:         ctx.gates,
              totalSpend:    ctx.totalSpend,
              campaignCount: ctx.campaignCount,
            },
          };
          const updated = [guide, ...store.savedGuides()];
          patchState(store, { savedGuides: updated, activeGuideId: guide.id, isGenerating: false });
          persist(updated);
        } catch (e: unknown) {
          patchState(store, {
            isGenerating: false,
            error: extractFacebookError(e, 'Guide generation failed. Check your AI API key in Workspace → AI Settings.'),
          });
        }
      },

      /**
       * Selects a saved guide to display in the panel.
       * @param id - The guide ID to select.
       */
      selectGuide(id: string): void {
        patchState(store, { activeGuideId: id });
      },

      /**
       * Deletes a saved guide by ID.
       * @param id - The guide ID to delete.
       */
      deleteGuide(id: string): void {
        const updated = store.savedGuides().filter(g => g.id !== id);
        const activeGuideId = store.activeGuideId() === id ? null : store.activeGuideId();
        patchState(store, { savedGuides: updated, activeGuideId });
        persist(updated);
      },

      /**
       * Loads a pre-written seed guide for development and demo purposes.
       * Does not require authentication or an AI API key.
       */
      seedTestData(): void {
        const seededId = 'seed-desktop-sales-001';
        const existing = store.savedGuides().find(g => g.id === seededId);
        if (existing) {
          patchState(store, { activeGuideId: seededId });
          return;
        }

        const seedGuide: MarketingGuide = {
          id:          seededId,
          appType:     'desktop-app',
          objective:   'OUTCOME_SALES',
          generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          content: {
            summary:
              'A sales-focused Facebook campaign for a desktop app should prioritise trial sign-ups and licence purchases from high-intent audiences. With ad fatigue and learning-phase alerts active, the immediate priority is creative rotation and budget stabilisation before scaling.',

            campaignObjectiveDetails:
              'The OUTCOME_SALES objective tells Facebook\'s algorithm to optimise delivery towards purchase and trial-start events, making it the natural fit for a desktop software product. By selecting this objective, Meta\'s bidding engine shifts spend toward users who have historically completed similar actions — software downloads, SaaS trials, or in-app purchases — dramatically increasing the probability of a profitable acquisition.\n\nFor a desktop app specifically, you should set your conversion event to the most downstream action you can reliably track: licence purchase if you have a direct buy flow, or trial start if a free trial gates the full product. Optimising for a higher-funnel event such as "View Content" will deliver cheap traffic but inflate your cost per acquisition because the algorithm never sees whether those clicks converted. Always connect your Meta Pixel and fire the Purchase or StartTrial standard event on the confirmation page.\n\nWith two campaigns currently active and £868.70 in total spend, you have enough data for Facebook\'s algorithm to exit the learning phase on at least one ad set — provided creatives are not paused or significantly edited mid-flight. Stabilise budget and creative for 48–72 hours, then evaluate performance against your target CPA before scaling.',

            monitoringTechniques:
              'Daily monitoring should focus on three signals: frequency (fatigue indicator), cost per result (efficiency), and click-through rate trend (creative health). Open Ads Manager each morning and filter to the last 7 days to catch emerging problems before they compound. The active Ad Fatigue and Learning Phase alerts in your dashboard confirm that both signals already need attention.\n\nWeekly, export a breakdown report by placement and age/gender to identify where your best CAC is coming from. Desktop app audiences often skew 25–44 male in professional niches, but this varies significantly by product category. Use these breakdowns to inform audience exclusions and bid adjustments rather than guessing.\n\nSet up automated rules in Ads Manager as a backstop: pause any ad set spending more than 2× your target CPA with fewer than two conversions, and send yourself an email alert when frequency exceeds 3.5 for prospecting audiences. Automated rules do not replace daily review — they catch runaway spend overnight when you are not watching.',

            funnelMetrics:
              'At the top of the funnel (TOFU), track reach, frequency, and CPM. For a desktop app targeting a relatively narrow professional audience, a CPM of £8–£18 is typical in UK and US markets. Frequency above 3.5 in prospecting campaigns signals that your audience is saturated and you need either new creatives or expanded targeting — your current Ad Fatigue gate confirms this threshold has been reached.\n\nAt the middle of the funnel (MOFU), the critical metrics are CTR (link) and CPC. A healthy desktop app campaign should see link CTR of 1.0–2.5% and CPC of £0.80–£3.00 depending on audience competitiveness. If CTR falls below 0.8%, the creative is not resonating; if CPC rises above £4.00, you are either targeting a saturated audience or your bid strategy needs adjustment.\n\nAt the bottom of the funnel (BOFU), measure cost per trial start, conversion rate from click to trial, and ROAS or CAC depending on your monetisation model. For a desktop app on a paid licence model, a healthy CAC is typically 3–5× monthly licence revenue, or 0.3–0.5× annual licence value. Track these weekly and compare against your previous 7-day period to detect decay before it becomes critical.',

            creativeTypesAndOptimisation:
              'Desktop app ads perform best with creative that shows the product in action. Short-form video (15–30 seconds) demonstrating a key workflow — particularly one that solves a frustrating manual task — consistently outperforms static images in click-through rate. Pair the video with a strong hook in the first 3 seconds: a question, a bold claim, or a before/after visual. Static images still have a place in retargeting where frequency is already high and you want a lower-cost impression format.\n\nFor copy, lead with the outcome the user achieves, not the features of the app. "Cut your reporting time in half" beats "Advanced data export with 40+ formats". Your primary text should be concise (under 125 characters for mobile feeds), your headline should reinforce the CTA, and your description should add a supporting proof point such as a user count or a review excerpt.\n\nThe optimisation process should follow a 3-phase cycle: (1) Test — run 3–5 creative variants per ad set with an equal budget split for 7 days. (2) Cut — pause anything with CTR below 0.8% or CPR above 2× target after sufficient spend. (3) Scale — increase budget by 20% every 48 hours on winning ad sets, and refresh creatives every 4–6 weeks to stay ahead of fatigue. Your current ad fatigue alert is a signal to enter phase 1 immediately.',

            keyTakeaways: [
              'Rotate creatives immediately to address the active Ad Fatigue alert — pause the worst-performing variants and introduce at least two new concepts this week.',
              'Do not edit budgets or creatives on the learning-phase campaign; let it exit the learning phase organically over the next 48–72 hours.',
              'Set your conversion event to the most downstream trackable action (purchase or trial start) to maximise algorithm quality.',
              'Monitor frequency daily and set an automated rule to pause ad sets when frequency exceeds 3.5 in prospecting audiences.',
              'Follow the test→cut→scale creative cycle: 7-day test, cull underperformers, scale winners at +20% budget increments every 48 hours.',
            ],
          },
          contextSnapshot: {
            gates:         ['Ad Fatigue', 'Learning Phase'],
            totalSpend:    868.70,
            campaignCount: 2,
          },
        };

        const updated = [seedGuide, ...store.savedGuides()];
        patchState(store, { savedGuides: updated, activeGuideId: seededId });
        persist(updated);
      },
    };
  })
);
