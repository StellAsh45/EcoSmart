import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EcoSmartLogoComponent } from './eco-smart-logo.component';

describe('EcoAulaLogoComponent', () => {
  let component: EcoSmartLogoComponent;
  let fixture: ComponentFixture<EcoSmartLogoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [EcoSmartLogoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EcoSmartLogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
