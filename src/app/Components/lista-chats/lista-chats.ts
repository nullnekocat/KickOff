import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';

interface Chat {
  id: number;
  name: string;
  type: 'privado' | 'grupo';
}

@Component({
  selector: 'app-lista-chats',
  standalone: true,
  imports: [NgClass, NgIf, NgFor, FormsModule],
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
  }

  //modal 
  showModal = false;
  filtroContactos = '';
  contactos: string[] = ['Juan Pérez', 'María López', 'Carlos Sánchez', 'Ana Torres', 'Luis Gómez'];
  seleccionados: string[] = [];

  get contactosFiltrados() {
    return this.contactos.filter(c => 
      c.toLowerCase().includes(this.filtroContactos.toLowerCase())
    );
  }

  crearGrupo() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.seleccionados = [];
    this.filtroContactos = '';
  }

  toggleSeleccion(contacto: string) {
    if (this.seleccionados.includes(contacto)) {
      this.seleccionados = this.seleccionados.filter(c => c !== contacto);
    } else {
      this.seleccionados.push(contacto);
    }
  }

  crearGrupoConfirmado() {
    console.log("Grupo creado con:", this.seleccionados);
    this.showModal = false;
    this.seleccionados = [];
    this.filtroContactos = '';
  }
}
