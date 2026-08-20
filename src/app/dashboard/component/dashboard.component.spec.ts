import { vi } from 'vitest';

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
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should be created', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows empty state when no data is loaded', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state')).not.toBeNull();
  });

  it('shows load test data button in empty state', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const seedBtn = compiled.querySelector('.seed-btn');
    expect(seedBtn).not.toBeNull();
    expect(seedBtn?.textContent?.trim()).toBe('Load test data');
  });

  it('shows the preset select in toolbar', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.preset-select')).not.toBeNull();
  });

  it('shows the sync button', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const syncBtn = compiled.querySelector<HTMLButtonElement>('button[aria-label="Sync dashboard data"]');
    expect(syncBtn).not.toBeNull();
  });

  describe('after seedTestData', () => {
    it('renders campaign cards', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.componentInstance['store'].seedTestData();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('.campaign-card').length).toBeGreaterThan(0);
    });

    it('renders verdict badges on ads', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.componentInstance['store'].seedTestData();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('.verdict-badge').length).toBeGreaterThan(0);
    });

    it('renders gate cards', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.componentInstance['store'].seedTestData();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('.gate-card').length).toBeGreaterThan(0);
    });

    it('renders recommendation cards', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.componentInstance['store'].seedTestData();
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('.rec-card').length).toBeGreaterThan(0);
    });
  });
});
