import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampaignsComponent } from './campaigns.component';

describe('CampaignsComponent', () => {
  let component: CampaignsComponent;
  let fixture: ComponentFixture<CampaignsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampaignsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the placeholder title', () => {
    const title = fixture.nativeElement.querySelector('.placeholder-title');
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('Campaigns');
  });

  it('should render the placeholder label', () => {
    const label = fixture.nativeElement.querySelector('.placeholder-label');
    expect(label).toBeTruthy();
    expect(label.textContent.trim()).toBe('Feature');
  });

  it('should render the placeholder subtitle', () => {
    const sub = fixture.nativeElement.querySelector('.placeholder-sub');
    expect(sub).toBeTruthy();
    expect(sub.textContent).toContain('Campaign list');
  });
});
