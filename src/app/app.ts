/**
 * @fileoverview Root application component.
 * Renders the navigation shell and router outlet. On first launch in Electron,
 * checks GDPR consent and prompts the user if consent has not yet been given.
 * Also checks Facebook auth state to guide the user to the auth tab when needed.
 */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from './auth';
import { LicenceStore, SchedulerService } from './core';

const THEME_KEY = 'theme';

type ElectronWindow = Window & {
  versions: { node: () => string; chrome: () => string; electron: () => string; ping: () => Promise<string> };
  gdpr: { checkConsent: () => Promise<{ consented: boolean }>; setConsent: () => Promise<void> };
};

const eWin = window as unknown as ElectronWindow;
const isElectron = !!eWin.versions;

/** Root standalone component — renders the top nav and router outlet. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements AfterViewInit {
  private readonly authStore = inject(AuthStore);
  private readonly licenceStore = inject(LicenceStore);
  // Injected here to ensure IPC listeners register at app launch, not just when
  // the Dashboard route is first visited.
  private readonly schedulerService = inject(SchedulerService);

  /** Electron version string shown in the nav bar meta badge. */
  protected readonly info = isElectron
    ? `Node: ${eWin.versions.node()}  Chrome: ${eWin.versions.chrome()}  Electron: ${eWin.versions.electron()}`
    : 'Browser';

  /** Whether the GDPR consent banner should be shown. */
  protected readonly showConsentBanner = signal(false);

  /** Whether the dark theme is currently active. */
  protected readonly isDark = signal(localStorage.getItem(THEME_KEY) === 'dark');

  constructor() {
    // Apply persisted theme class before first render to avoid a flash.
    document.documentElement.classList.toggle('dark-theme', this.isDark());
  }

  /**
   * Checks GDPR consent and loads stored auth tokens after the view initialises.
   * No-op when not running inside Electron.
   * @returns Promise that resolves when initialisation is complete.
   */
  async ngAfterViewInit(): Promise<void> {
    if (!isElectron) return;

    await eWin.versions.ping();

    const { consented } = await eWin.gdpr.checkConsent();
    if (!consented) {
      this.showConsentBanner.set(true);
    }

    await this.authStore.loadStoredTokens();
    void this.licenceStore.checkLicence();
  }

  /**
   * Records GDPR consent when the user accepts the privacy notice.
   * @returns Promise that resolves once the consent record has been written.
   */
  protected async acceptConsent(): Promise<void> {
    await eWin.gdpr.setConsent();
    this.showConsentBanner.set(false);
  }

  /**
   * Toggles between light and dark themes and persists the preference to localStorage.
   */
  protected toggleTheme(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    document.documentElement.classList.toggle('dark-theme', next);
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  }
}
