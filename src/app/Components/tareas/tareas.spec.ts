import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tareas } from './tareas';

describe('Tareas', () => {
  let component: Tareas;
  let fixture: ComponentFixture<Tareas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tareas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tareas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
