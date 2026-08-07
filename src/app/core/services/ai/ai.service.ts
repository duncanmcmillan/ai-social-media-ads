/**
 * @fileoverview AI service — wraps the Electron IPC bridge for Claude API calls.
 * The Anthropic API key is stored encrypted in the main process and never
 * passes through the renderer.
 */
import { Injectable } from '@angular/core';

/** Shape returned by ai:generate-draft. */
export interface GeneratedDraft {
  campaignName: string;
  objective: string;
  adSets: GeneratedAdSet[];
}

export interface GeneratedAdSet {
  name: string;
  targeting: { countries: string[]; minAge: number; maxAge: number };
  optimizationGoal: string;
  billingEvent: string;
}

/** Context sent to ai:generate-copy. */
export interface CopyContext {
  campaignName: string;
  objective: string;
  fileName: string;
  tones: string[];
  hook: string;
  length: string;
}

/** Shape returned by ai:generate-copy. */
export interface GeneratedCopy {
  primaryText: string;
  headline: string;
  description: string;
}

declare global {
  interface Window {
    ai: {
      saveApiKey(key: string): Promise<void>;
      loadApiKey(): Promise<boolean>;
      generateDraft(prompt: string): Promise<GeneratedDraft>;
      generateCopy(context: CopyContext): Promise<GeneratedCopy>;
    };
  }
}

@Injectable({ providedIn: 'root' })
export class AiService {
  /** Saves the Anthropic API key to encrypted Electron storage. */
  saveApiKey(key: string): Promise<void> {
    return window.ai.saveApiKey(key);
  }

  /** Returns true if an API key is already stored. */
  loadApiKey(): Promise<boolean> {
    return window.ai.loadApiKey();
  }

  /** Generates a campaign draft from a natural-language description. */
  generateDraft(prompt: string): Promise<GeneratedDraft> {
    return window.ai.generateDraft(prompt);
  }

  /** Generates ad copy for the active creative. */
  generateCopy(context: CopyContext): Promise<GeneratedCopy> {
    return window.ai.generateCopy(context);
  }
}
