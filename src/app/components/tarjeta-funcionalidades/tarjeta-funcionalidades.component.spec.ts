import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TarjetaFuncionalidadesComponent } from './tarjeta-funcionalidades.component';

describe('TarjetaFuncionalidadesComponent', () => {
  let component: TarjetaFuncionalidadesComponent;
  let fixture: ComponentFixture<TarjetaFuncionalidadesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TarjetaFuncionalidadesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaFuncionalidadesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
