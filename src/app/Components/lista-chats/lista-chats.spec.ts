import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaChats } from './lista-chats';

describe('ListaChats', () => {
  let component: ListaChats;
  let fixture: ComponentFixture<ListaChats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaChats]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaChats);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
