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

  /** Electron version string shown in the nav bar meta badge. */
  protected readonly info = isElectron
    ? `Node: ${eWin.versions.node()}  Chrome: ${eWin.versions.chrome()}  Electron: ${eWin.versions.electron()}`
    : 'Browser';

  /** Whether the GDPR consent banner should be shown. */
  protected readonly showConsentBanner = signal(false);

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
  }

  /**
   * Records GDPR consent when the user accepts the privacy notice.
   * @returns Promise that resolves once the consent record has been written.
   */
  protected async acceptConsent(): Promise<void> {
    await eWin.gdpr.setConsent();
    this.showConsentBanner.set(false);
  }
}
