import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AdPreviewApiService } from './ad-preview-api.service';
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

const mockPreview = { body: '<iframe src="https://www.facebook.com/ads/api/preview_iframe.php?..."></iframe>' };

describe('AdPreviewApiService', () => {
  let service: AdPreviewApiService;
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

    service = TestBed.inject(AdPreviewApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── getAdPreview ────────────────────────────────────────────────────────────

  it('getAdPreview() should GET from the ad previews endpoint with the specified format', async () => {
    const promise = service.getAdPreview('ad_123', 'MOBILE_FEED_STANDARD');

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/ad_123/previews` &&
      r.params.get('access_token') === 'test-token' &&
      r.params.get('ad_format') === 'MOBILE_FEED_STANDARD'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [mockPreview] });

    const result = await promise;
    expect(result).toEqual(mockPreview);
  });

  it('getAdPreview() should default to DESKTOP_FEED_STANDARD when no format is provided', async () => {
    const promise = service.getAdPreview('ad_123');

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/ad_123/previews` &&
      r.params.get('ad_format') === 'DESKTOP_FEED_STANDARD'
    );
    req.flush({ data: [mockPreview] });

    const result = await promise;
    expect(result).toEqual(mockPreview);
  });

  it('getAdPreview() should throw when the API returns an empty data array', async () => {
    const promise = service.getAdPreview('ad_123');

    const req = httpMock.expectOne(r => r.url === `${GRAPH_BASE}/ad_123/previews`);
    req.flush({ data: [] });

    await expect(promise).rejects.toThrow('No preview available for this ad.');
  });

  it('getAdPreview() should throw when no access token is available', async () => {
    mockStore.accessToken.set(null);
    await expect(service.getAdPreview('ad_123')).rejects.toThrow('Not authenticated');
  });

  // ── getCreativePreview ──────────────────────────────────────────────────────

  it('getCreativePreview() should GET from the generatepreviews endpoint with creative JSON', async () => {
    const promise = service.getCreativePreview('creative_456', 'INSTAGRAM_STANDARD');

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/act_123/generatepreviews` &&
      r.params.get('access_token') === 'test-token' &&
      r.params.get('ad_format') === 'INSTAGRAM_STANDARD'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('creative')).toBe(JSON.stringify({ creative_id: 'creative_456' }));
    req.flush({ data: [mockPreview] });

    const result = await promise;
    expect(result).toEqual(mockPreview);
  });

  it('getCreativePreview() should default to DESKTOP_FEED_STANDARD when no format is provided', async () => {
    const promise = service.getCreativePreview('creative_456');

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/act_123/generatepreviews` &&
      r.params.get('ad_format') === 'DESKTOP_FEED_STANDARD'
    );
    req.flush({ data: [mockPreview] });

    await promise;
  });

  it('getCreativePreview() should throw when no ad account is selected', async () => {
    mockStore.adAccountId.set(null);
    await expect(service.getCreativePreview('creative_456')).rejects.toThrow('No ad account selected.');
  });

  it('getCreativePreview() should throw when the API returns an empty data array', async () => {
    const promise = service.getCreativePreview('creative_456');

    const req = httpMock.expectOne(r => r.url === `${GRAPH_BASE}/act_123/generatepreviews`);
    req.flush({ data: [] });

    await expect(promise).rejects.toThrow('No preview available for this creative.');
  });

  it('getCreativePreview() should throw when no access token is available', async () => {
    mockStore.accessToken.set(null);
    await expect(service.getCreativePreview('creative_456')).rejects.toThrow('Not authenticated');
  });
});
