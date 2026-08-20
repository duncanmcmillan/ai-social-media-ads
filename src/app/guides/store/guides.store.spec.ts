// Set up an in-memory localStorage mock before any module code runs.
// The test environment does not provide a full localStorage implementation.
const localStorageData: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem:    (key: string) => localStorageData[key] ?? null,
  setItem:    (key: string, value: string) => { localStorageData[key] = value; },
  removeItem: (key: string) => { delete localStorageData[key]; },
  clear:      () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); },
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { GuidesStore } from './guides.store';
import { AiService } from '../../core/services/ai/ai.service';
import type { GuideContent } from '../../core/services/ai/ai.service';

describe('GuidesStore', () => {
  let store: InstanceType<typeof GuidesStore>;
  let aiService: AiService;

  const mockGuideContent: GuideContent = {
    summary: 'Test summary.',
    campaignObjectiveDetails: 'Objective details.',
    monitoringTechniques: 'Monitoring techniques.',
    funnelMetrics: 'Funnel metrics.',
    creativeTypesAndOptimisation: 'Creative types.',
    keyTakeaways: ['Takeaway 1', 'Takeaway 2'],
  };

  beforeEach(() => {
    // Reset storage before each test.
    Object.keys(localStorageData).forEach(k => delete localStorageData[k]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        GuidesStore,
      ],
    });

    store = TestBed.inject(GuidesStore);
    aiService = TestBed.inject(AiService);
  });

  afterEach(() => {
    Object.keys(localStorageData).forEach(k => delete localStorageData[k]);
    vi.restoreAllMocks();
  });

  it('creates the store', () => {
    expect(store).toBeTruthy();
  });

  it('has correct initial state', () => {
    expect(store.selectedAppType()).toBe('desktop-app');
    expect(store.selectedObjective()).toBe('OUTCOME_SALES');
    expect(store.savedGuides()).toEqual([]);
    expect(store.isGenerating()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.activeGuideId()).toBeNull();
  });

  it('setAppType updates selectedAppType', () => {
    store.setAppType('ecommerce');
    expect(store.selectedAppType()).toBe('ecommerce');
  });

  it('setObjective updates selectedObjective', () => {
    store.setObjective('OUTCOME_LEADS');
    expect(store.selectedObjective()).toBe('OUTCOME_LEADS');
  });

  it('seedTestData loads a pre-written guide', () => {
    store.seedTestData();
    expect(store.savedGuides().length).toBe(1);
    expect(store.savedGuides()[0].appType).toBe('desktop-app');
    expect(store.savedGuides()[0].objective).toBe('OUTCOME_SALES');
    expect(store.activeGuideId()).toBe('seed-desktop-sales-001');
    expect(store.activeGuide()).not.toBeNull();
    expect(store.activeGuide()!.contextSnapshot.campaignCount).toBe(2);
    expect(store.activeGuide()!.content.keyTakeaways.length).toBeGreaterThanOrEqual(4);
  });

  it('seedTestData is idempotent — calling twice does not duplicate the guide', () => {
    store.seedTestData();
    store.seedTestData();
    expect(store.savedGuides().filter(g => g.id === 'seed-desktop-sales-001').length).toBe(1);
  });

  it('activeGuide computed returns null when no guide is selected', () => {
    expect(store.activeGuide()).toBeNull();
  });

  it('activeGuide computed returns the selected guide', () => {
    store.seedTestData();
    expect(store.activeGuide()?.id).toBe('seed-desktop-sales-001');
  });

  it('sortedGuides computed returns guides newest first', () => {
    store.seedTestData();
    expect(store.sortedGuides().length).toBe(1);
    expect(store.sortedGuides()[0].id).toBe('seed-desktop-sales-001');
  });

  it('selectGuide sets activeGuideId', () => {
    store.seedTestData();
    store.selectGuide('seed-desktop-sales-001');
    expect(store.activeGuideId()).toBe('seed-desktop-sales-001');
  });

  it('deleteGuide removes the guide and clears activeGuideId when active', () => {
    store.seedTestData();
    store.deleteGuide('seed-desktop-sales-001');
    expect(store.savedGuides().length).toBe(0);
    expect(store.activeGuideId()).toBeNull();
    expect(store.activeGuide()).toBeNull();
  });

  it('deleteGuide does not clear activeGuideId when a different guide is active', () => {
    store.seedTestData();
    store.deleteGuide('non-existent-id');
    expect(store.activeGuideId()).toBe('seed-desktop-sales-001');
  });

  it('generate calls aiService.generateGuide and saves the guide', async () => {
    const spy = vi.spyOn(aiService, 'generateGuide').mockResolvedValue(mockGuideContent);

    await store.generate({
      appType: 'saas',
      objective: 'OUTCOME_LEADS',
      gates: ['Ad Fatigue'],
      totalSpend: 500,
      campaignCount: 3,
    });

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith({
      appType: 'saas',
      objective: 'OUTCOME_LEADS',
      gates: ['Ad Fatigue'],
      totalSpend: 500,
      campaignCount: 3,
    });
    expect(store.savedGuides().length).toBe(1);
    expect(store.savedGuides()[0].appType).toBe('saas');
    expect(store.savedGuides()[0].objective).toBe('OUTCOME_LEADS');
    expect(store.isGenerating()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.activeGuideId()).toBe(store.savedGuides()[0].id);
  });

  it('generate sets error state on failure', async () => {
    vi.spyOn(aiService, 'generateGuide').mockRejectedValue(new Error('API error'));

    await store.generate({
      appType: 'ecommerce',
      objective: 'OUTCOME_SALES',
      gates: [],
      totalSpend: 100,
      campaignCount: 1,
    });

    expect(store.isGenerating()).toBe(false);
    expect(store.error()).toBeTruthy();
    expect(store.savedGuides().length).toBe(0);
  });

  it('persists guides to localStorage after generate', async () => {
    vi.spyOn(aiService, 'generateGuide').mockResolvedValue(mockGuideContent);

    await store.generate({
      appType: 'mobile-app',
      objective: 'OUTCOME_APP_PROMOTION',
      gates: [],
      totalSpend: 0,
      campaignCount: 0,
    });

    const stored = JSON.parse(localStorageData['ai-fb-ads:guides'] ?? '[]') as unknown[];
    expect(stored.length).toBe(1);
  });

  it('persists guides to localStorage after deleteGuide', () => {
    store.seedTestData();
    store.deleteGuide('seed-desktop-sales-001');
    const stored = JSON.parse(localStorageData['ai-fb-ads:guides'] ?? '[]') as unknown[];
    expect(stored.length).toBe(0);
  });
});
