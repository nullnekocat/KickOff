import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Integrantes } from './integrantes';

describe('Integrantes', () => {
  let component: Integrantes;
  let fixture: ComponentFixture<Integrantes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Integrantes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Integrantes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
