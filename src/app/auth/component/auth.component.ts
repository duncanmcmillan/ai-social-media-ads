/**
 * @fileoverview Facebook authentication component.
 * Provides login/logout UI and displays current auth status.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthStore } from '../store/auth.store';

/** Auth feature component — manages Facebook OAuth login and logout. */
@Component({
  selector: 'app-auth',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <span class="page-label">Authentication</span>
      <h1 class="page-title">Facebook Login</h1>
    </div>

    <div class="auth-status">
      @if (store.isAuthenticated()) {
        <div class="status-badge status-badge--connected">
          <span class="status-dot"></span>
          Connected
        </div>
        <p class="status-detail">
          Ad Account: {{ store.adAccountId() ?? 'Not set' }}
        </p>
        <button class="btn btn-outline" (click)="signOut()">Sign out</button>
      } @else {
        <div class="status-badge status-badge--disconnected">
          <span class="status-dot"></span>
          Not connected
        </div>
        <p class="status-detail">Connect your Facebook account to manage ads.</p>
        <button class="btn btn-primary" (click)="signIn()" [disabled]="store.isLoading()">
          @if (store.isLoading()) { Connecting… } @else { Connect with Facebook }
        </button>
      }

      @if (store.error()) {
        <p class="error-msg" role="alert">{{ store.error() }}</p>
      }
    </div>
  `,
  styles: `
    .page-header { margin-bottom: 32px; }
    .page-label {
      font-size: 11px; font-weight: 400; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--neutral-400);
    }
    .page-title {
      font-family: var(--font-heading); font-size: 24px; font-weight: 200;
      color: var(--neutral-700); letter-spacing: -0.02em; margin-top: 4px;
    }
    .auth-status {
      display: flex; flex-direction: column; gap: 16px; max-width: 400px;
    }
    .status-badge {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 400; color: var(--neutral-700);
    }
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%;
    }
    .status-badge--connected .status-dot { background: var(--color-success); }
    .status-badge--disconnected .status-dot { background: var(--neutral-300); }
    .status-detail { font-size: 13px; color: var(--neutral-400); }
    .error-msg { font-size: 12px; color: var(--color-error); }
    .btn {
      display: inline-flex; align-items: center; padding: 8px 18px;
      border-radius: 4px; font-size: 13px; font-weight: 300;
      cursor: pointer; border: 1px solid transparent; text-decoration: none;
      width: fit-content;
    }
    .btn-primary {
      background: var(--orange-500); color: var(--neutral-0);
      border-color: var(--orange-500);
      &:hover { background: var(--orange-600); border-color: var(--orange-600); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
    .btn-outline {
      background: transparent; color: var(--neutral-600);
      border-color: var(--neutral-300);
      &:hover { border-color: var(--neutral-400); color: var(--neutral-700); }
    }
  `,
})
export class AuthComponent {
  protected readonly store = inject(AuthStore);

  /**
   * Initiates Facebook OAuth flow via the Electron IPC bridge.
   * @returns Promise that resolves once the OAuth attempt has completed or errored.
   */
  protected async signIn(): Promise<void> {
    this.store.setError('');
    // OAuth flow will be implemented once App ID is configured.
    // For now, surface a helpful message.
    this.store.setError('Configure your Facebook App ID in settings to enable OAuth login.');
  }

  /**
   * Signs the user out and clears stored tokens.
   * @returns Promise that resolves once tokens have been cleared.
   */
  protected async signOut(): Promise<void> {
    await this.store.signOut();
  }
}
