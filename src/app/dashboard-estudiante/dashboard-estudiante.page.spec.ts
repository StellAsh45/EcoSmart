import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardEstudiantePage } from './dashboard-estudiante.page';

describe('DashboardEstudiantePage', () => {
  let component: DashboardEstudiantePage;
  let fixture: ComponentFixture<DashboardEstudiantePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardEstudiantePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
