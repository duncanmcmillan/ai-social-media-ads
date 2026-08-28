/**
 * @fileoverview Meta Setup tab component.
 * Hosts a step-by-step wizard guiding users through the Meta Developer ecosystem
 * prerequisites (Business Portfolio → Developer App → Ad Account → Facebook Page →
 * Meta Pixel → OAuth Connect). Once all steps are complete the wizard is replaced
 * by a reference card listing all collected IDs with one-click copy buttons.
 * Also hosts the licence key entry section for LemonSqueezy Pro activation.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VideoModalComponent } from '../../shared/video-modal/video-modal.component';
import { ImageModalComponent } from '../../shared/image-modal/image-modal.component';
import type { LightboxImage } from '../../shared/image-modal/image-modal.component';
import { ScreenshotStripComponent } from '../../shared/screenshot-strip/screenshot-strip.component';
import { LicenceStore } from '../../core';
import { AuthStore } from '../../auth';
import { WorkspaceStore } from '../../workspace';
import { SetupStore } from '../store/setup.store';
import { SETUP_STEPS } from '../model/setup.model';
import type { StepKey } from '../model/setup.model';
import type { FacebookAdAccount } from '../../auth';

/** A single setup guide entry. */
interface SetupVideo {
  /** Unique key used to track which modal is open. */
  key: string;
  /** Display title. */
  title: string;
  /** One or two sentence description of what the video covers. */
  description: string;
  /** Path to the video file inside dist/videos/, or null if not yet recorded. */
  src: string | null;
  /** Topics covered, shown as chips below the description. */
  topics: string[];
}

const SETUP_VIDEOS: SetupVideo[] = [
  {
    key: 'meta-app-setup',
    title: 'Meta App, Ad Account & Permissions',
    description:
      'How to create a Meta developer app, link your ad account, configure app pages, ' +
      'and set the correct user permissions so the app can manage your campaigns.',
    src: null,
    topics: ['Developer App', 'Ad Account', 'Facebook Pages', 'User Permissions', 'App Review'],
  },
  {
    key: 'meta-pixel-setup',
    title: 'Meta Pixel Setup',
    description:
      'How to create a Meta Pixel (Dataset), install it on your website, verify it is ' +
      'firing correctly, and link it to your ad account ready for conversion tracking.',
    src: null,
    topics: ['Create Pixel', 'Website Install', 'Event Testing', 'Conversion Tracking'],
  },
];

/**
 * Screenshot walkthrough images for the Business Portfolio step.
 * Served from public/ so they are included in the Angular build output.
 */
const BPORT_SCREENSHOTS: LightboxImage[] = [
  {
    src: 'meta-setup/screenshots/meta-create-biz-portfolio-1.png',
    caption: 'Step 1 — Open Meta Business Suite and click "Create a business portfolio"',
  },
  {
    src: 'meta-setup/screenshots/meta-create-biz-portfolio-2.png',
    caption: 'Step 2 — Enter your portfolio name and contact details, then click Create',
  },
  {
    src: 'meta-setup/screenshots/meta-create-biz-portfolio-3.png',
    caption: 'Step 3 — Review and confirm your business portfolio details',
  },
  {
    src: 'meta-setup/screenshots/meta-create-biz-portfolio-4.png',
    caption: 'Step 4 — Your new portfolio appears in the sidebar dropdown',
  },
  {
    src: 'meta-setup/screenshots/meta-create-biz-portfolio-5.png',
    caption: 'Step 5 — Find your Portfolio ID under Settings → Business Info',
  },
];

/** Screenshot walkthrough images for the Developer App step. */
const DEV_APP_SCREENSHOTS: LightboxImage[] = [
  {
    src: 'meta-setup/screenshots/meta-create-app-1.png',
    caption: 'Step 1 — Go to developers.facebook.com/apps and click "Create App"',
  },
  {
    src: 'meta-setup/screenshots/meta-create-app-2.png',
    caption: 'Step 2 — Enter your app name and contact email, then click Next',
  },
  {
    src: 'meta-setup/screenshots/meta-create-app-3.png',
    caption: 'Step 3 — Select "Create & manage ads with Marketing API" as your use case',
  },
  {
    src: 'meta-setup/screenshots/meta-create-app-4.png',
    caption: 'Step 4 — Connect your AIAds Business Portfolio',
  },
  {
    src: 'meta-setup/screenshots/meta-create-app-5.png',
    caption: 'Step 5 — Review publishing requirements (typically none at this stage)',
  },
  {
    src: 'meta-setup/screenshots/meta-create-app-6.png',
    caption: 'Step 6 — Review the overview and click "Create app"',
  },
  {
    src: 'meta-setup/screenshots/meta-create-app-7.png',
    caption: 'Step 7 — Copy your App ID and App Secret from App Settings → Basic',
  },
];

/** Screenshot walkthrough images for the Facebook Page step. */
const FB_PAGE_SCREENSHOTS: LightboxImage[] = [
  {
    src: 'meta-setup/screenshots/meta-create-fb-page-1.png',
    caption: 'Step 1 — Go to business.facebook.com and select your AIAds Business Portfolio',
  },
  {
    src: 'meta-setup/screenshots/meta-create-fb-page-2.png',
    caption: 'Step 2 — Go to Settings → Pages — "No Pages added" appears; click "+ Add"',
  },
  {
    src: 'meta-setup/screenshots/meta-create-fb-page-3.png',
    caption: 'Step 3 — Enter your Page name, category and bio, then click Next',
  },
  {
    src: 'meta-setup/screenshots/meta-create-fb-page-4.png',
    caption: 'Step 4 — Review and confirm, accept Meta Commercial Terms, then click "Create Page"',
  },
  {
    src: 'meta-setup/screenshots/meta-create-fb-page-5.png',
    caption: 'Step 5 — Your new Facebook Page appears — copy the Page ID shown below the name',
  },
];

/** Screenshot walkthrough images for the Meta Dataset step. */
const DATASET_SCREENSHOTS: LightboxImage[] = [
  {
    src: 'meta-setup/screenshots/meta-create-dataset-1.png',
    caption: 'Step 1 — Go to Meta Business Suite and select your AIAds Business Portfolio',
  },
  {
    src: 'meta-setup/screenshots/meta-create-dataset-2.png',
    caption: 'Step 2 — Go to Settings → Data Sources → Datasets & pixels and click "+ Add"',
  },
  {
    src: 'meta-setup/screenshots/meta-create-dataset-3.png',
    caption: 'Step 3 — Enter a dataset name and optional category, then click Create',
  },
  {
    src: 'meta-setup/screenshots/meta-create-dataset-4.png',
    caption: 'Step 4 — Select the ad account(s) to connect to this dataset, then click Next',
  },
  {
    src: 'meta-setup/screenshots/meta-create-dataset-5.png',
    caption: 'Step 5 — Dataset created — click "Go to Events Manager"',
  },
  {
    src: 'meta-setup/screenshots/meta-create-dataset-6.png',
    caption: 'Step 6 — In Events Manager click "Connect data", select Web, then click Next',
  },
  {
    src: 'meta-setup/screenshots/meta-create-dataset-7.png',
    caption: 'Step 7 — Select your dataset from the dropdown, then click Next',
  },
  {
    src: 'meta-setup/screenshots/meta-create-dataset-8.png',
    caption: 'Step 8 — Choose "Set up Meta Pixel" to connect your web data, then click Next',
  },
  {
    src: 'meta-setup/screenshots/meta-create-dataset-9.png',
    caption: 'Step 9 — Choose "Add Meta Pixel code to website yourself", then click Next',
  },
  {
    src: 'meta-setup/screenshots/meta-create-dataset-10.png',
    caption: 'Step 10 — Copy the Meta Pixel base code and paste it into your website\'s <head>, then click Next',
  },
  {
    src: 'meta-setup/screenshots/meta-create-dataset-11.png',
    caption: 'Step 11 — Configure Automatic Advanced Matching (recommended), then click Done',
  },
  {
    src: 'meta-setup/screenshots/meta-create-dataset-12.png',
    caption: 'Step 12 — Datasets overview — your Dataset ID appears below the name; copy it for Step 5 here',
  },
  {
    src: 'meta-setup/screenshots/meta-create-dataset-13.png',
    caption: 'Step 13 — Return to "Connect data" and choose "Set up Conversions API" for server-side tracking',
  },
  {
    src: 'meta-setup/screenshots/meta-create-dataset-14.png',
    caption: 'Step 14 — Choose "Set up manually" to implement the Conversions API yourself',
  },
  {
    src: 'meta-setup/screenshots/meta-create-dataset-15.png',
    caption: 'Step 15 — Manual Implementation Overview — follow the 3-step guide to send events via the API',
  },
];

/** Screenshot walkthrough images for the Ad Account step. */
const AD_ACCOUNT_SCREENSHOTS: LightboxImage[] = [
  {
    src: 'meta-setup/screenshots/meta-create-ad-account-1.png',
    caption: 'Step 1 — Go to business.facebook.com and select your AIAds Business Portfolio',
  },
  {
    src: 'meta-setup/screenshots/meta-create-ad-account-2.png',
    caption: 'Step 2 — Go to Settings → Ad accounts and click "+ Add"',
  },
  {
    src: 'meta-setup/screenshots/meta-create-ad-account-3.png',
    caption: 'Step 3 — Choose "Create a new ad account" (or add an existing one)',
  },
  {
    src: 'meta-setup/screenshots/meta-create-ad-account-4.png',
    caption: 'Step 4 — Enter a name, time zone, and currency for the account',
  },
  {
    src: 'meta-setup/screenshots/meta-create-ad-account-5.png',
    caption: 'Step 5 — Select "My business" as the account usage',
  },
  {
    src: 'meta-setup/screenshots/meta-create-ad-account-6.png',
    caption: 'Step 6 — Review and confirm, then click "Create ad account"',
  },
  {
    src: 'meta-setup/screenshots/meta-create-ad-account-7.png',
    caption: 'Step 7 — Your Ad Account ID is shown in Settings — copy it for reference',
  },
];

/** Meta Setup tab — wizard, reference card, video walkthroughs, and licence management. */
@Component({
  selector: 'app-meta-setup',
  imports: [VideoModalComponent, ImageModalComponent, ScreenshotStripComponent, FormsModule],
  templateUrl: './meta-setup.component.html',
  styleUrl: './meta-setup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetaSetupComponent {
  protected readonly videos              = SETUP_VIDEOS;
  protected readonly steps               = SETUP_STEPS;
  protected readonly bportScreenshots     = BPORT_SCREENSHOTS;
  protected readonly devAppScreenshots    = DEV_APP_SCREENSHOTS;
  protected readonly adAccountScreenshots = AD_ACCOUNT_SCREENSHOTS;
  protected readonly fbPageScreenshots    = FB_PAGE_SCREENSHOTS;
  protected readonly datasetScreenshots   = DATASET_SCREENSHOTS;

  // ── Stores ──────────────────────────────────────────────────────────────
  protected readonly licenceStore   = inject(LicenceStore);
  protected readonly setupStore     = inject(SetupStore);
  protected readonly authStore      = inject(AuthStore);
  protected readonly workspaceStore = inject(WorkspaceStore);

  // ── Video modal ──────────────────────────────────────────────────────────
  /** Key of the currently open video modal, or null. */
  protected readonly openKey = signal<string | null>(null);

  // ── Image lightbox ────────────────────────────────────────────────────────
  /** Index of the lightbox image to open, or null when closed. */
  protected readonly lightboxIndex = signal<number | null>(null);
  /** The image set currently loaded in the lightbox. */
  protected lightboxImages: LightboxImage[] = [];

  /**
   * Opens the image lightbox for a given set of images at the specified index.
   *
   * @param images - The array of images to display.
   * @param index - The index to open at.
   */
  protected openLightbox(images: LightboxImage[], index: number): void {
    this.lightboxImages = images;
    this.lightboxIndex.set(index);
  }

  // ── Wizard form inputs (local, not persisted) ────────────────────────────
  /** Input value for the Business Portfolio ID field. */
  protected businessPortfolioIdInput = '';
  /** Input value for the App ID field. */
  protected appIdInput = '';
  /** Input value for the App Secret field. */
  protected appSecretInput = '';
  /** Input value for the manual Ad Account ID field. */
  protected adAccountInput = '';
  /** The ad account selected from the authenticated dropdown. */
  protected selectedAdAccount = signal<FacebookAdAccount | null>(null);
  /** Page ID selected from the authenticated dropdown. */
  protected selectedPageId = signal<string>('');
  /** Pixel ID selected from the authenticated dropdown. */
  protected selectedPixelId = signal<string>('');
  /** Input value for a manually entered Facebook Page ID. */
  protected manualPageIdInput = '';
  /** Input value for a manually entered Pixel ID. */
  protected manualPixelIdInput = '';

  // ── Licence key input ────────────────────────────────────────────────────
  /** Current value of the licence key input field. */
  protected licenceKeyInput = '';

  // ── Reference card data ──────────────────────────────────────────────────
  /** App ID shown on the reference card (from auth store). */
  protected readonly refAppId = computed(() => this.authStore.appId() ?? '');
  /** Ad Account ID on the reference card — authenticated selection takes priority over manual entry. */
  protected readonly refAdAccountId = computed(
    () => this.authStore.selectedAccount()?.id ?? this.setupStore.manualAdAccountId()
  );
  /** Facebook Page ID on the reference card (from workspace defaults). */
  protected readonly refPageId = computed(() => this.workspaceStore.metaDefaults().facebookPageId);
  /** Pixel ID on the reference card (from workspace defaults). */
  protected readonly refPixelId = computed(() => this.workspaceStore.metaDefaults().pixelId);
  /** Connected user name on the reference card. */
  protected readonly refUser = computed(() => this.authStore.user()?.name ?? '');

  // ── Video modal helpers ──────────────────────────────────────────────────
  protected openVideo(key: string, src: string | null): void {
    if (src) this.openKey.set(key);
  }

  protected get openSrc(): string {
    const key = this.openKey();
    return key ? (this.videos.find(v => v.key === key)?.src ?? '') : '';
  }

  protected get openTitle(): string {
    const key = this.openKey();
    return this.videos.find(v => v.key === key)?.title ?? '';
  }

  // ── Wizard helpers ───────────────────────────────────────────────────────
  /**
   * Returns true when the given step is currently expanded.
   *
   * @param key - The step key to test.
   */
  protected isStepOpen(key: StepKey): boolean {
    return this.setupStore.openStep() === key;
  }

  // ── Step 1 — Business Portfolio ──────────────────────────────────────────
  /**
   * Saves the Business Portfolio ID and marks step 1 as complete.
   */
  protected markBusinessPortfolioDone(): void {
    this.setupStore.setBusinessPortfolioId(this.businessPortfolioIdInput.trim());
    this.setupStore.completeStep('business-portfolio');
  }

  // ── Step 2 — Developer App ───────────────────────────────────────────────
  /**
   * Saves the App ID and App Secret via the auth store, then marks step 2 complete.
   *
   * @returns Promise resolving after credentials are saved.
   */
  protected async saveDeveloperApp(): Promise<void> {
    await this.authStore.saveCredentials(this.appIdInput.trim(), this.appSecretInput.trim());
    if (this.authStore.appId()) {
      this.setupStore.completeStep('developer-app');
    }
  }

  // ── Step 3 — Ad Account (authenticated path) ─────────────────────────────
  /**
   * Selects the chosen authenticated ad account and marks step 3 complete.
   */
  protected saveAdAccount(): void {
    const account = this.selectedAdAccount();
    if (!account) return;
    this.authStore.selectAccount(account);
    this.setupStore.completeStep('ad-account');
  }

  /**
   * Saves a manually entered Ad Account ID for reference and marks step 3 complete.
   */
  protected saveManualAdAccount(): void {
    this.setupStore.setManualAdAccountId(this.adAccountInput.trim());
    this.setupStore.completeStep('ad-account');
  }

  // ── Step 4 — Facebook Page ───────────────────────────────────────────────
  /**
   * Triggers a page-list fetch from the Graph API.
   */
  protected fetchPages(): void {
    void this.authStore.fetchPages();
  }

  /**
   * Saves the selected Facebook Page ID to workspace defaults and marks step 4 complete.
   */
  protected async saveFacebookPage(): Promise<void> {
    const pageId = this.selectedPageId() || this.manualPageIdInput.trim();
    if (!pageId) return;
    this.workspaceStore.updateMetaDefaults({ facebookPageId: pageId });
    this.setupStore.completeStep('facebook-page');
  }

  // ── Step 5 — Meta Pixel ──────────────────────────────────────────────────
  /**
   * Triggers a pixel-list fetch from the Graph API for the selected ad account.
   */
  protected fetchPixels(): void {
    const accountId = this.authStore.selectedAccount()?.id;
    if (accountId) void this.authStore.fetchPixels(accountId);
  }

  /**
   * Saves the selected Pixel ID to workspace defaults and marks step 5 complete.
   */
  protected async savePixel(): Promise<void> {
    const pixelId = this.selectedPixelId() || this.manualPixelIdInput.trim();
    if (!pixelId) return;
    this.workspaceStore.updateMetaDefaults({ pixelId });
    this.setupStore.completeStep('pixel');
  }

  // ── Step 6 — Connect Facebook ────────────────────────────────────────────
  /**
   * Starts the Facebook OAuth flow and marks step 6 complete on success.
   *
   * @returns Promise resolving after OAuth completes or fails.
   */
  protected async connectFacebook(): Promise<void> {
    await this.authStore.connectFacebook();
    if (this.authStore.isAuthenticated()) {
      this.setupStore.completeStep('connect');
    }
  }

  /**
   * Marks the connect step done when the user is already authenticated.
   */
  protected markConnectDone(): void {
    this.setupStore.completeStep('connect');
  }

  // ── Reference card ───────────────────────────────────────────────────────
  /**
   * Copies the given text to the system clipboard.
   *
   * @param text - The text to copy.
   */
  protected copyToClipboard(text: string): void {
    void navigator.clipboard.writeText(text);
  }

  // ── Licence ──────────────────────────────────────────────────────────────
  /**
   * Submits the licence key input to the store for activation.
   * No-op when the input is blank or a check is already in flight.
   */
  protected onActivate(): void {
    const key = this.licenceKeyInput.trim();
    if (!key || this.licenceStore.isChecking()) return;
    void this.licenceStore.activateLicence(key);
  }

  /**
   * Deactivates the current licence on this machine.
   * Prompts the user first to avoid accidental deactivation.
   */
  protected onDeactivate(): void {
    if (!confirm('Deactivate your Pro licence on this machine? You can re-activate on another device.')) return;
    void this.licenceStore.deactivateLicence();
  }
}
