import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Recompensas } from './recompensas';

describe('Recompensas', () => {
  let component: Recompensas;
  let fixture: ComponentFixture<Recompensas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recompensas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Recompensas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
