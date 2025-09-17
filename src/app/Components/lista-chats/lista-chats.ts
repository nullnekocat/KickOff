import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

interface Chat {
  id: number;
  name: string;
  type: 'privado' | 'grupo';
}

@Component({
  selector: 'app-lista-chats',
  imports: [NgClass],
  templateUrl: './lista-chats.html',
  styleUrl: './lista-chats.css'
})
export class ListaChats {
selectedTab: 'privados' | 'grupos' = 'privados';

  chats: Chat[] = [
    { id: 1, name: 'Juan Pérez', type: 'privado' },
    { id: 2, name: 'María López', type: 'privado' },
    { id: 3, name: 'Equipo Proyecto X', type: 'grupo' },
    { id: 4, name: 'Familia', type: 'grupo' },
  ];

  get chatsFiltrados() {
    return this.chats.filter(c => 
      this.selectedTab === 'privados' ? c.type === 'privado' : c.type === 'grupo'
    );
  }

  selectTab(tab: 'privados' | 'grupos') {
    this.selectedTab = tab;
  }

  openChat(chat: Chat) {
    console.log('Abrir chat:', chat);
    // Aquí luego conectamos con ChatWindowComponent
  }
}
