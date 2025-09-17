import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatAbierto } from './chat-abierto';

describe('ChatAbierto', () => {
  let component: ChatAbierto;
  let fixture: ComponentFixture<ChatAbierto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatAbierto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatAbierto);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
