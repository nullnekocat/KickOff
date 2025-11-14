import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatSelectionService } from '../../services/chat-selection.service';

@Component({
  selector: 'app-integrantes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './integrantes.html',
  styleUrl: './integrantes.css'
})
export class Integrantes {

  integrantes: any[] = [];
  groupId = '';

  constructor(private chatSelection: ChatSelectionService) {}

  ngOnInit() {
    this.chatSelection.selected$.subscribe(chat => {
      if (!chat || chat.type !== 'grupo') {
        this.integrantes = [];
        this.groupId = '';
        return;
      }

      this.groupId = chat.id;
      this.integrantes = chat.members || [];
    });
  }

}
