import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SchedulerService } from './scheduler.service';

describe('SchedulerService', () => {
  let service: SchedulerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SchedulerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('exposes lastSyncAt as null before any sync', () => {
    expect(service.lastSyncAt()).toBeNull();
  });

  it('exposes nextSyncAt as null when not running in Electron', () => {
    // In the test environment the scheduler bridge is not available,
    // so nextSyncAt stays null.
    expect(service.nextSyncAt()).toBeNull();
  });
});
