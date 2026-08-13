/**
 * @fileoverview Meta Setup tab component.
 * A video library of guided setup walkthroughs for Meta prerequisites —
 * App credentials, Ad Account, Pages, permissions, and Pixel configuration.
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { VideoModalComponent } from '../../shared/video-modal/video-modal.component';

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

/** Meta Setup tab — guided video walkthroughs for Meta prerequisites. */
@Component({
  selector: 'app-meta-setup',
  imports: [VideoModalComponent],
  templateUrl: './meta-setup.component.html',
  styleUrl: './meta-setup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetaSetupComponent {
  protected readonly videos = SETUP_VIDEOS;

  /** Key of the currently open video modal, or null. */
  protected readonly openKey = signal<string | null>(null);

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
}
