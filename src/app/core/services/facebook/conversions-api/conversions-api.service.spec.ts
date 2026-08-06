import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { ConversionsApiService } from './conversions-api.service';
import type { ServerEvent } from './conversions-api.service';
import { AuthStore } from '../../../../auth';

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';
const PIXEL_ID = 'pixel_123456';

const buildMockStore = (overrides: Partial<{ accessToken: string | null }> = {}) => ({
  accessToken: signal<string | null>(overrides.accessToken !== undefined ? overrides.accessToken : 'test-token'),
  adAccountId: signal<string | null>('act_123'),
  isAuthenticated: signal(true),
  isLoading: signal(false),
  error: signal<string | null>(null),
  appId: signal<string | null>(null),
  loadStoredTokens: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
  deleteAllData: vi.fn().mockResolvedValue(undefined),
  setError: vi.fn(),
});

const makeEvent = (overrides: Partial<ServerEvent> = {}): ServerEvent => ({
  event_name: 'Purchase',
  event_time: 1700000000,
  action_source: 'website',
  user_data: {
    client_ip_address: '1.2.3.4',
    client_user_agent: 'Mozilla/5.0',
  },
  custom_data: {
    value: 99.99,
    currency: 'USD',
  },
  ...overrides,
});

const mockResponse = { events_received: 1, messages: [], fbtrace_id: 'abc123' };

describe('ConversionsApiService', () => {
  let service: ConversionsApiService;
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

    service = TestBed.inject(ConversionsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── sendEvents ──────────────────────────────────────────────────────────────

  it('sendEvents() should POST to the correct pixel events endpoint', async () => {
    const events = [makeEvent()];
    const promise = service.sendEvents(PIXEL_ID, events);

    const req = httpMock.expectOne(r =>
      r.url === `${GRAPH_BASE}/${PIXEL_ID}/events` &&
      r.params.get('access_token') === 'test-token'
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ data: events });
    req.flush(mockResponse);

    const result = await promise;
    expect(result).toEqual(mockResponse);
  });

  it('sendEvents() should include test_event_code in the payload when provided', async () => {
    const events = [makeEvent()];
    const promise = service.sendEvents(PIXEL_ID, events, 'TEST12345');

    const req = httpMock.expectOne(r => r.url === `${GRAPH_BASE}/${PIXEL_ID}/events`);
    expect(req.request.body).toEqual({ data: events, test_event_code: 'TEST12345' });
    req.flush({ ...mockResponse, messages: ['Successfully received 1 event(s).'] });

    await promise;
  });

  it('sendEvents() should send multiple events in a single batch', async () => {
    const events = [
      makeEvent({ event_name: 'ViewContent' }),
      makeEvent({ event_name: 'AddToCart', custom_data: { value: 25.00, currency: 'GBP' } }),
      makeEvent({ event_name: 'Purchase' }),
    ];

    const promise = service.sendEvents(PIXEL_ID, events);

    const req = httpMock.expectOne(r => r.url === `${GRAPH_BASE}/${PIXEL_ID}/events`);
    expect(req.request.body.data).toHaveLength(3);
    req.flush({ events_received: 3, messages: [], fbtrace_id: 'xyz789' });

    const result = await promise;
    expect(result.events_received).toBe(3);
  });

  it('sendEvents() should not include test_event_code when not provided', async () => {
    const promise = service.sendEvents(PIXEL_ID, [makeEvent()]);

    const req = httpMock.expectOne(r => r.url === `${GRAPH_BASE}/${PIXEL_ID}/events`);
    expect(req.request.body).not.toHaveProperty('test_event_code');
    req.flush(mockResponse);

    await promise;
  });

  it('sendEvents() should throw when pixelId is empty', async () => {
    await expect(service.sendEvents('', [makeEvent()])).rejects.toThrow(
      'A pixel / dataset ID is required.'
    );
  });

  it('sendEvents() should throw when the events array is empty', async () => {
    await expect(service.sendEvents(PIXEL_ID, [])).rejects.toThrow(
      'At least one event is required.'
    );
  });

  it('sendEvents() should throw when more than 1,000 events are provided', async () => {
    const events = Array.from({ length: 1001 }, () => makeEvent());
    await expect(service.sendEvents(PIXEL_ID, events)).rejects.toThrow(
      'A maximum of 1,000 events can be sent per request.'
    );
  });

  it('sendEvents() should throw when no access token is available', async () => {
    mockStore.accessToken.set(null);
    await expect(service.sendEvents(PIXEL_ID, [makeEvent()])).rejects.toThrow('Not authenticated');
  });

  // ── sendEvent ───────────────────────────────────────────────────────────────

  it('sendEvent() should POST a single event wrapped in a data array', async () => {
    const event = makeEvent({ event_id: 'evt_unique_001' });
    const promise = service.sendEvent(PIXEL_ID, event);

    const req = httpMock.expectOne(r => r.url === `${GRAPH_BASE}/${PIXEL_ID}/events`);
    expect(req.request.body.data).toHaveLength(1);
    expect(req.request.body.data[0]).toEqual(event);
    req.flush(mockResponse);

    const result = await promise;
    expect(result).toEqual(mockResponse);
  });

  it('sendEvent() should forward the testEventCode to sendEvents', async () => {
    const promise = service.sendEvent(PIXEL_ID, makeEvent(), 'TEST99999');

    const req = httpMock.expectOne(r => r.url === `${GRAPH_BASE}/${PIXEL_ID}/events`);
    expect(req.request.body.test_event_code).toBe('TEST99999');
    req.flush(mockResponse);

    await promise;
  });

  it('sendEvent() should throw when no access token is available', async () => {
    mockStore.accessToken.set(null);
    await expect(service.sendEvent(PIXEL_ID, makeEvent())).rejects.toThrow('Not authenticated');
  });
});
