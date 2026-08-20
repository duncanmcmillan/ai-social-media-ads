import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { InsightsApiService } from './insights-api.service';
import type { InsightMetrics } from './insights-api.service';
import { AuthStore } from '../../../../auth';

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';

const buildMockStore = (overrides: Partial<{
  accessToken: string | null;
  adAccountId: string | null;
}> = {}) => ({
  accessToken: signal<string | null>(overrides.accessToken !== undefined ? overrides.accessToken : 'test-token'),
  adAccountId: signal<string | null>(overrides.adAccountId !== undefined ? overrides.adAccountId : 'act_123'),
  isAuthenticated: signal(true),
  isLoading: signal(false),
  error: signal<string | null>(null),
  appId: signal<string | null>(null),
  loadStoredTokens: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
  deleteAllData: vi.fn().mockResolvedValue(undefined),
  setError: vi.fn(),
});

const mockMetrics: InsightMetrics = {
  impressions: '1000',
  clicks: '50',
  ctr: '5.00',
  cpc: '0.20',
  cpm: '10.00',
  spend: '10.00',
  reach: '900',
  dateStart: '2024-01-01',
  dateStop: '2024-01-31',
};

describe('InsightsApiService', () => {
  let service: InsightsApiService;
  let httpMock: HttpTestingController;
  let mockStore: ReturnType<typeof buildMockStore>;

  beforeEach(() => {
    mockStore = buildMockStore();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthStore, useValue: mockStore },
      ],
    });

    service = TestBed.inject(InsightsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getInsights ─────────────────────────────────────────────────────────────

  it('getInsights() should GET from the correct insights URL with fields and date preset', async () => {
    const promise = service.getInsights('campaign_abc', 'last_7d');

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/campaign_abc/insights` &&
      r.params.get('access_token') === 'test-token' &&
      r.params.get('date_preset') === 'last_7d'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('fields')).toContain('impressions,clicks,ctr');
    req.flush({ data: [mockMetrics] });

    const result = await promise;
    expect(result).toEqual([mockMetrics]);
  });

  it('getInsights() should default to last_30d when no date preset is provided', async () => {
    const promise = service.getInsights('adset_xyz');

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/adset_xyz/insights` &&
      r.params.get('date_preset') === 'last_30d'
    );
    req.flush({ data: [] });

    await promise;
  });

  it('getInsights() should return an empty array when the API returns no data', async () => {
    const promise = service.getInsights('ad_123');

    const req = httpMock.expectOne(r => r.url === `${GRAPH_BASE}/ad_123/insights`);
    req.flush({ data: [] });

    const result = await promise;
    expect(result).toEqual([]);
  });

  it('getInsights() should throw when no access token is available', async () => {
    mockStore.accessToken.set(null);
    await expect(service.getInsights('campaign_abc')).rejects.toThrow('Not authenticated');
  });

  // ── getAccountInsights ──────────────────────────────────────────────────────

  it('getAccountInsights() should query insights using the ad account ID', async () => {
    const promise = service.getAccountInsights('this_month');

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/act_123/insights` &&
      r.params.get('date_preset') === 'this_month'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('fields')).toContain('actions');

    // API response uses snake_case; the service maps it to camelCase.
    req.flush({
      data: [{
        impressions: '1000', clicks: '50', ctr: '5.00', cpc: '0.20',
        cpm: '10.00', spend: '10.00', reach: '900',
        date_start: '2024-01-01', date_stop: '2024-01-31',
      }],
    });

    const result = await promise;
    expect(result[0]).toMatchObject({
      impressions: '1000', clicks: '50', ctr: '5.00', cpc: '0.20',
      cpm: '10.00', spend: '10.00', reach: '900',
      dateStart: '2024-01-01', dateStop: '2024-01-31',
    });
  });

  it('getAccountInsights() should throw when no ad account is selected', async () => {
    mockStore.adAccountId.set(null);
    await expect(service.getAccountInsights()).rejects.toThrow('No ad account selected.');
  });

  it('getAccountInsights() should default to last_30d', async () => {
    const promise = service.getAccountInsights();

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/act_123/insights` &&
      r.params.get('date_preset') === 'last_30d'
    );
    req.flush({ data: [] });

    await promise;
  });
});
