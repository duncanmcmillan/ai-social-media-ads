/**
 * @fileoverview Domain models for the Meta Setup wizard.
 * Defines the ordered sequence of setup steps and their metadata.
 */

/** Stable identifier for each setup step, used as the persisted key. */
export type StepKey =
  | 'business-portfolio'
  | 'developer-app'
  | 'ad-account'
  | 'facebook-page'
  | 'pixel'
  | 'connect';

/** Metadata for a single setup wizard step. */
export interface StepDefinition {
  /** Stable identifier used as the persisted key. */
  key: StepKey;
  /** Display title shown in the accordion header. */
  title: string;
  /** One-line summary shown when the step is collapsed and complete. */
  summary: string;
}

/** Ordered list of all Meta setup steps displayed in the wizard. */
export const SETUP_STEPS: StepDefinition[] = [
  {
    key: 'business-portfolio',
    title: '1. Business Portfolio',
    summary: 'Create a Meta Business Portfolio to manage your assets.',
  },
  {
    key: 'developer-app',
    title: '2. Developer App',
    summary: 'Register a Developer App and save your App ID & Secret.',
  },
  {
    key: 'ad-account',
    title: '3. Ad Account',
    summary: 'Link the ad account this app will manage.',
  },
  {
    key: 'facebook-page',
    title: '4. Facebook Page',
    summary: 'Select the Page shown on your ads.',
  },
  {
    key: 'pixel',
    title: '5. Meta Pixel',
    summary: 'Set up a Pixel to track conversions.',
  },
  {
    key: 'connect',
    title: '6. Connect Facebook',
    summary: 'Authorise this app via Facebook OAuth.',
  },
];
