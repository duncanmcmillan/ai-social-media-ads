import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AuthComponent } from './auth.component';
import { AuthStore } from '../store/auth.store';

const buildMockStore = (overrides: Partial<{
  isAuthenticated: boolean;
  adAccountId: string | null;
  isLoading: boolean;
  error: string | null;
}> = {}) => ({
  isAuthenticated: signal(overrides.isAuthenticated ?? false),
  accessToken: signal<string | null>(null),
  adAccountId: signal<string | null>(overrides.adAccountId ?? null),
  isLoading: signal(overrides.isLoading ?? false),
  error: signal<string | null>(overrides.error ?? null),
  loadStoredTokens: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
  deleteAllData: vi.fn().mockResolvedValue(undefined),
  setError: vi.fn(),
});

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let mockStore: ReturnType<typeof buildMockStore>;

  beforeEach(async () => {
    mockStore = buildMockStore();

    await TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [{ provide: AuthStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show "Not connected" status when not authenticated', () => {
    const badge = fixture.nativeElement.querySelector('.status-badge--disconnected');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Not connected');
  });

  it('should show "Connect with Facebook" button when not authenticated', () => {
    const button = fixture.nativeElement.querySelector('.btn-primary');
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Connect with Facebook');
  });

  it('should show "Connected" status when authenticated', async () => {
    mockStore = buildMockStore({ isAuthenticated: true, adAccountId: 'act_123' });
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [{ provide: AuthStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.status-badge--connected');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Connected');
  });

  it('should show the ad account ID when authenticated', async () => {
    mockStore = buildMockStore({ isAuthenticated: true, adAccountId: 'act_9876543210' });
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [{ provide: AuthStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    fixture.detectChanges();

    const detail = fixture.nativeElement.querySelector('.status-detail');
    expect(detail.textContent).toContain('act_9876543210');
  });

  it('should display an error message when store.error() is set', async () => {
    mockStore = buildMockStore({ error: 'Configure your Facebook App ID' });
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [{ provide: AuthStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.error-msg');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Configure your Facebook App ID');
  });

  it('signIn should call store.setError with a helpful message', async () => {
    const btn = fixture.nativeElement.querySelector('.btn-primary');
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockStore.setError).toHaveBeenCalledWith(
      'Configure your Facebook App ID in settings to enable OAuth login.'
    );
  });

  it('signOut button should call store.signOut', async () => {
    mockStore = buildMockStore({ isAuthenticated: true });
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [{ provide: AuthStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.btn-outline').click();
    await fixture.whenStable();
    expect(mockStore.signOut).toHaveBeenCalled();
  });
});
