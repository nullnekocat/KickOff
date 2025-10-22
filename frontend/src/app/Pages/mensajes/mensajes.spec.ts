import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mensajes } from './mensajes';

describe('Mensajes', () => {
  let component: Mensajes;
  let fixture: ComponentFixture<Mensajes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mensajes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mensajes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
