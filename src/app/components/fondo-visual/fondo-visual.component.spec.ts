import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FondoVisualComponent } from './fondo-visual.component';

describe('FondoVisualComponent', () => {
  let component: FondoVisualComponent;
  let fixture: ComponentFixture<FondoVisualComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FondoVisualComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FondoVisualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
