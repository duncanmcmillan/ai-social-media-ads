import { vi } from 'vitest';

// matchMedia polyfill for Angular Material CDK BreakpointObserver (jsdom does not implement it).
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })),
});

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReviewStepComponent } from './review-step.component';
import { NewCampaignStore } from '../../store/new-campaign.store';
import type { PreflightItem } from './review-step.component';
import type { DraftCreative } from '../../model/draft.model';

/** Minimal DraftCreative for test setup. */
function makeCreative(overrides: Partial<DraftCreative> = {}): DraftCreative {
  return {
    id: crypto.randomUUID(),
    fileName: 'test.jpg',
    fileType: 'image',
    objectUrl: '',
    tones: [],
    hook: '',
    length: 'Medium',
    primaryText: 'Hello world',
    headline: 'Buy now',
    description: '',
    cta: 'LEARN_MORE',
    launchStatus: 'paused',
    adCreationMode: 'separate',
    adFormat: 'SINGLE_IMAGE' as const,
    carouselCards: [],
    collectionCards: [],
    instantExperienceId: '',
    ...overrides,
  };
}

describe('ReviewStepComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReviewStepComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ReviewStepComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show campaign name when set', () => {
    const fixture = TestBed.createComponent(ReviewStepComponent);
    const store = TestBed.inject(NewCampaignStore);
    store.updateCampaign({ name: 'Summer Sale', objective: 'OUTCOME_SALES', budgetAmount: 50 });
    // Open accordion to reveal campaign summary
    fixture.componentInstance['summaryOpen'].set(true);
    fixture.detectChanges();
    // Campaign name is now in an inline editable input, not a dd element.
    const nameInput = fixture.nativeElement.querySelector('#rs-camp-name') as HTMLInputElement;
    expect(nameInput).toBeTruthy();
    expect(nameInput.value).toBe('Summer Sale');
  });

  it('should show "No ad sets" empty state when adSets is empty', () => {
    const fixture = TestBed.createComponent(ReviewStepComponent);
    fixture.componentInstance['summaryOpen'].set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No ad sets');
  });

  it('should show "No creatives" empty state when creatives is empty', () => {
    const fixture = TestBed.createComponent(ReviewStepComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No creatives');
  });

  it('preflightOk returns false when creatives are missing', () => {
    const fixture = TestBed.createComponent(ReviewStepComponent);
    const comp = fixture.componentInstance as unknown as {
      preflightOk: () => boolean;
      preflightItems: () => PreflightItem[];
    };
    fixture.detectChanges();
    expect(comp.preflightOk()).toBe(false);
    expect(comp.preflightItems().find(i => i.label === 'Creatives uploaded')?.ok).toBe(false);
  });

  it('allReviewed returns false with no reviewed creatives', () => {
    const fixture = TestBed.createComponent(ReviewStepComponent);
    const store = TestBed.inject(NewCampaignStore);
    store.addCreative(makeCreative());
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { allReviewed: () => boolean };
    expect(comp.allReviewed()).toBe(false);
  });

  it('toggleReviewed marks a creative as reviewed', () => {
    const fixture = TestBed.createComponent(ReviewStepComponent);
    const store = TestBed.inject(NewCampaignStore);
    const creative = makeCreative({ id: 'c1' });
    store.addCreative(creative);
    fixture.detectChanges();

    const comp = fixture.componentInstance as unknown as {
      toggleReviewed: (id: string) => void;
      reviewedIds: () => ReadonlySet<string>;
      allReviewed: () => boolean;
    };

    comp.toggleReviewed('c1');
    expect(comp.reviewedIds().has('c1')).toBe(true);
    expect(comp.allReviewed()).toBe(true);
  });

  it('toggleReviewed un-marks a creative when called twice', () => {
    const fixture = TestBed.createComponent(ReviewStepComponent);
    const store = TestBed.inject(NewCampaignStore);
    store.addCreative(makeCreative({ id: 'c2' }));
    fixture.detectChanges();

    const comp = fixture.componentInstance as unknown as {
      toggleReviewed: (id: string) => void;
      reviewedIds: () => ReadonlySet<string>;
    };

    comp.toggleReviewed('c2');
    comp.toggleReviewed('c2');
    expect(comp.reviewedIds().has('c2')).toBe(false);
  });

  it('allReviewed returns false when only some creatives are reviewed', () => {
    const fixture = TestBed.createComponent(ReviewStepComponent);
    const store = TestBed.inject(NewCampaignStore);
    store.addCreative(makeCreative({ id: 'c3' }));
    store.addCreative(makeCreative({ id: 'c4' }));
    fixture.detectChanges();

    const comp = fixture.componentInstance as unknown as {
      toggleReviewed: (id: string) => void;
      allReviewed: () => boolean;
    };

    comp.toggleReviewed('c3');
    expect(comp.allReviewed()).toBe(false);
  });

  it('fmtCurrency returns formatted string for positive values', () => {
    const fixture = TestBed.createComponent(ReviewStepComponent);
    const comp = fixture.componentInstance as unknown as {
      fmtCurrency: (v: number | null) => string;
    };
    fixture.detectChanges();
    expect(comp.fmtCurrency(50)).toContain('50');
  });

  it('campaignReviewed defaults to false', () => {
    const fixture = TestBed.createComponent(ReviewStepComponent);
    const store = TestBed.inject(NewCampaignStore);
    fixture.detectChanges();
    // campaignReviewed now delegates to the store signal.
    expect(store.campaignReviewed()).toBe(false);
  });

  it('adSetsReviewed defaults to false', () => {
    const fixture = TestBed.createComponent(ReviewStepComponent);
    const store = TestBed.inject(NewCampaignStore);
    fixture.detectChanges();
    // adSetsReviewed now delegates to the store signal.
    expect(store.adSetsReviewed()).toBe(false);
  });

  it('preflight includes Campaign reviewed and Ad sets reviewed items', () => {
    const fixture = TestBed.createComponent(ReviewStepComponent);
    const comp = fixture.componentInstance as unknown as { preflightItems: () => PreflightItem[] };
    fixture.detectChanges();
    const labels = comp.preflightItems().map(i => i.label);
    expect(labels).toContain('Campaign reviewed');
    expect(labels).toContain('Ad sets reviewed');
  });

  it('fmtCurrency returns "—" for null or zero', () => {
    const fixture = TestBed.createComponent(ReviewStepComponent);
    const comp = fixture.componentInstance as unknown as {
      fmtCurrency: (v: number | null) => string;
    };
    fixture.detectChanges();
    expect(comp.fmtCurrency(null)).toBe('—');
    expect(comp.fmtCurrency(0)).toBe('—');
  });
});
