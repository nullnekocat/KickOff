import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatSelectionService } from '../../services/chat-selection.service';
import { UserService } from '../../services/user.service';

interface Chat {
  id: string;
  name: string;
  email: string;
  status: number;
  type: 'privado' | 'grupo';
}

@Component({
  selector: 'app-lista-chats',
  standalone: true,
  imports: [NgClass, NgIf, NgFor, FormsModule],
  templateUrl: './lista-chats.html',
  styleUrl: './lista-chats.css'
})
export class ListaChats implements OnInit {
  selectedTab: 'privados' | 'grupos' = 'privados';
  chats: Chat[] = [];
  contactos: string[] = [];

  showModal = false;
  loading = false;
  filtroContactos = '';
  seleccionados: string[] = [];

  constructor(private userService: UserService,
            public chatSelection: ChatSelectionService,
            private router: Router) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.userService.getAllOtherUsers().subscribe({
      next: (users) => {
        
        /*
        console.log('📥 Respuesta del backend:', users);
        if (!users || users.length === 0) {
          console.warn('⚠️ No se recibieron usuarios o la lista está vacía.');
        }
        */

        this.chats = users.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          status: u.status,
          type: 'privado',
        }));
        this.contactos = users.map(u => u.name);
      },
      error: (err) => {
        console.error('❌ Error cargando usuarios:', err);
      },
      complete:() => this.loading = false
    });
  }

  get chatsFiltrados() {
    return this.chats.filter(c => 
      this.selectedTab === 'privados' ? c.type === 'privado' : c.type === 'grupo'
    );
  }

  selectTab(tab: 'privados' | 'grupos') {
    this.selectedTab = tab;
  }

  openChat(chat: Chat) {
    console.log('🟢 Chat clickeado:', chat);
    // establece seleccionado en el servicio
    this.chatSelection.setSelected({
      id: String(chat.id),
      name: chat.name,
      email: chat.email,
      status: chat.status
    });
    console.log('📤 Enviado al servicio:', this.chatSelection.getSelected());
  }

  //modal 
  /*
  showModal = false;
  filtroContactos = '';
  contactos: string[] = ['Juan Pérez', 'María López', 'Carlos Sánchez', 'Ana Torres', 'Luis Gómez'];
  seleccionados: string[] = [];
  */

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
