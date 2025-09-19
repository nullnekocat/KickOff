import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Simulador } from './simulador';

describe('Simulador', () => {
  let component: Simulador;
  let fixture: ComponentFixture<Simulador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Simulador]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Simulador);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
