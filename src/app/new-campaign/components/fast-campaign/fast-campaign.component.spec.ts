import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })),
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FastCampaignComponent } from './fast-campaign.component';
import { NewCampaignStore } from '../../store/new-campaign.store';

describe('FastCampaignComponent', () => {
  let fixture: ComponentFixture<FastCampaignComponent>;
  let component: FastCampaignComponent;
  let store: InstanceType<typeof NewCampaignStore>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FastCampaignComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FastCampaignComponent);
    component = fixture.componentInstance;
    store     = TestBed.inject(NewCampaignStore);
    router    = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should require objective before file drop is active', () => {
    // No objective selected — canDrop should be false.
    const canDrop = (component as unknown as { canDrop: () => boolean }).canDrop;
    expect(canDrop()).toBe(false);

    // Select an objective.
    const pill = fixture.nativeElement.querySelector('.fc-pill') as HTMLButtonElement;
    pill.click();
    fixture.detectChanges();

    expect(canDrop()).toBe(true);
  });

  it('should disable file input when no objective is selected', () => {
    const input = fixture.nativeElement.querySelector('.fc-file-input') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('should enable file input after selecting an objective', () => {
    const pill = fixture.nativeElement.querySelector('.fc-pill') as HTMLButtonElement;
    pill.click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.fc-file-input') as HTMLInputElement;
    expect(input.disabled).toBe(false);
  });

  it('should call store.reset() before patching on file upload', async () => {
    const resetSpy = vi.spyOn(store, 'reset');
    const updateSpy = vi.spyOn(store, 'updateCampaign');

    // Set an objective so canDrop is true.
    const pill = fixture.nativeElement.querySelector('.fc-pill') as HTMLButtonElement;
    pill.click();
    fixture.detectChanges();

    // Stub out AI methods to avoid real HTTP calls.
    vi.spyOn(store, 'generateDraft').mockResolvedValue(undefined);
    vi.spyOn(store, 'generateCopy').mockResolvedValue(undefined);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const file = new File(['img'], 'test.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;
    (component as unknown as { onFilesSelected: (e: Event) => void }).onFilesSelected(event);

    // Allow microtasks to flush.
    await Promise.resolve();

    expect(resetSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ objective: expect.any(String) }));
  });

  it('should navigate to /new-campaign/review after AI resolves', async () => {
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const pill = fixture.nativeElement.querySelector('.fc-pill') as HTMLButtonElement;
    pill.click();
    fixture.detectChanges();

    vi.spyOn(store, 'generateDraft').mockResolvedValue(undefined);
    vi.spyOn(store, 'generateCopy').mockResolvedValue(undefined);

    const file = new File(['img'], 'test.png', { type: 'image/png' });
    const event = { target: { files: [file], value: '' } } as unknown as Event;
    (component as unknown as { onFilesSelected: (e: Event) => void }).onFilesSelected(event);

    // Allow all sequential awaits to settle (generateDraft → generateCopy → navigate).
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(navSpy).toHaveBeenCalledWith('/new-campaign/review');
  });

  it('should show progress bar while generating', () => {
    // Manually trigger generating state.
    store.setGeneratingAdSets(true);
    fixture.detectChanges();

    const progress = fixture.nativeElement.querySelector('.fc-progress-wrap');
    expect(progress).toBeTruthy();
  });
});
