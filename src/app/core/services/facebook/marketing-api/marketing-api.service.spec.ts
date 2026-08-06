import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { MarketingApiService } from './marketing-api.service';
import { AuthStore } from '../../../../auth';
import type { CampaignPayload, AdSetPayload, AdPayload } from '../../../models/index';

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

describe('MarketingApiService', () => {
  let service: MarketingApiService;
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

    service = TestBed.inject(MarketingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getCampaigns ────────────────────────────────────────────────────────────

  it('getCampaigns() should GET from the correct URL with auth params', async () => {
    const mockCampaigns = [{ id: '123', name: 'Test Campaign' }];

    const promise = service.getCampaigns();

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/act_123/campaigns` && r.params.get('access_token') === 'test-token'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('fields')).toContain('id,name,status');
    req.flush({ data: mockCampaigns });

    const result = await promise;
    expect(result).toEqual(mockCampaigns);
  });

  it('getCampaigns() should throw when no ad account is set', async () => {
    mockStore.adAccountId.set(null);
    await expect(service.getCampaigns()).rejects.toThrow('No ad account selected.');
  });

  // ── createCampaign ──────────────────────────────────────────────────────────

  it('createCampaign() should POST to the ad account campaigns edge', async () => {
    const payload: CampaignPayload = { name: 'New Campaign', objective: 'OUTCOME_TRAFFIC', status: 'PAUSED' };

    const promise = service.createCampaign(payload);

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/act_123/campaigns` && r.params.get('access_token') === 'test-token'
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: '456' });

    const result = await promise;
    expect(result).toEqual({ id: '456' });
  });

  it('createCampaign() should throw when no ad account is set', async () => {
    mockStore.adAccountId.set(null);
    await expect(service.createCampaign({ name: 'x', objective: 'OUTCOME_TRAFFIC', status: 'PAUSED' })).rejects.toThrow(
      'No ad account selected.'
    );
  });

  // ── updateCampaign ──────────────────────────────────────────────────────────

  it('updateCampaign() should POST to the campaign ID endpoint', async () => {
    const promise = service.updateCampaign('campaign_789', { status: 'ACTIVE' });

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/campaign_789` && r.params.get('access_token') === 'test-token'
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ status: 'ACTIVE' });
    req.flush({ success: true });

    const result = await promise;
    expect(result).toEqual({ success: true });
  });

  // ── getAdSets ───────────────────────────────────────────────────────────────

  it('getAdSets() should GET from the campaign adsets edge', async () => {
    const mockAdSets = [{ id: 'adset_1', name: 'Ad Set One' }];

    const promise = service.getAdSets('campaign_abc');

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/campaign_abc/adsets` && r.params.get('access_token') === 'test-token'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('fields')).toContain('id,name,campaign_id');
    req.flush({ data: mockAdSets });

    const result = await promise;
    expect(result).toEqual(mockAdSets);
  });

  // ── createAdSet ─────────────────────────────────────────────────────────────

  it('createAdSet() should POST to the ad account adsets edge', async () => {
    const payload: AdSetPayload = {
      name: 'New Ad Set',
      campaignId: 'campaign_abc',
      status: 'PAUSED',
      billingEvent: 'IMPRESSIONS',
      optimizationGoal: 'REACH',
      dailyBudget: 1000,
    };

    const promise = service.createAdSet(payload);

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/act_123/adsets` && r.params.get('access_token') === 'test-token'
    );
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'adset_new' });

    const result = await promise;
    expect(result).toEqual({ id: 'adset_new' });
  });

  it('createAdSet() should throw when no ad account is set', async () => {
    mockStore.adAccountId.set(null);
    await expect(
      service.createAdSet({ name: 'x', campaignId: 'y', status: 'PAUSED', billingEvent: 'IMPRESSIONS', optimizationGoal: 'REACH', dailyBudget: 1000 })
    ).rejects.toThrow('No ad account selected.');
  });

  // ── getAds ──────────────────────────────────────────────────────────────────

  it('getAds() should GET from the ad set ads edge', async () => {
    const mockAds = [{ id: 'ad_1', name: 'Ad One' }];

    const promise = service.getAds('adset_xyz');

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/adset_xyz/ads` && r.params.get('access_token') === 'test-token'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('fields')).toContain('id,name,adset_id');
    req.flush({ data: mockAds });

    const result = await promise;
    expect(result).toEqual(mockAds);
  });

  // ── createAd ────────────────────────────────────────────────────────────────

  it('createAd() should POST to the ad account ads edge', async () => {
    const payload: AdPayload = {
      name: 'New Ad',
      adSetId: 'adset_xyz',
      status: 'PAUSED',
      creativeId: 'creative_1',
    };

    const promise = service.createAd(payload);

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/act_123/ads` && r.params.get('access_token') === 'test-token'
    );
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'ad_new' });

    const result = await promise;
    expect(result).toEqual({ id: 'ad_new' });
  });

  it('createAd() should throw when no ad account is set', async () => {
    mockStore.adAccountId.set(null);
    await expect(
      service.createAd({ name: 'x', adSetId: 'y', status: 'PAUSED', creativeId: 'z' })
    ).rejects.toThrow('No ad account selected.');
  });

  // ── auth guard ──────────────────────────────────────────────────────────────

  it('should throw when no access token is available', async () => {
    mockStore.accessToken.set(null);
    await expect(service.getCampaigns()).rejects.toThrow('Not authenticated');
  });
});
