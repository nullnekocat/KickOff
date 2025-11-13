import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SocketService } from '../../services/socket.service';
import { ChatSelectionService } from '../../services/chat-selection.service';
import { UserService } from '../../services/user.service';
import { GroupService } from '../../services/group.service';

interface Chat {
  id: string;
  name: string;
  email?: string; // private
  membersCount?: number; // group
  status?: number;
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
  contactos: any[] = [];
  grupos: Chat[] = [];

  showModal = false;
  loading = false;
  filtroContactos = '';
  seleccionados: string[] = [];
  nombreGrupo = '';

  constructor(
    private userService: UserService,
    private groupService: GroupService,
    public chatSelection: ChatSelectionService,
    private socketService: SocketService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadUsers();
    this.loadGroups();

    // Actualiza estado en tiempo real
    this.socketService.onUserStatusChange(({ userId, status }) => {
      const user = this.chats.find(u => u.id === userId);
      if (user) user.status = status;
    });

    this.socketService.onNewGroup((group) => {
      console.log('📢 Nuevo grupo recibido por socket:', group);

      // Convertir a estructura Chat y evitar duplicados
      const exists = this.chats.some(c => c.id === group._id);
      if (exists) return;

      const mapped = {
        id: group._id,
        name: group.name,
        members: group.members || [],
        membersCount: group.members?.length || 0,
        status: 1,
        type: 'grupo' as const
      };

      this.grupos = [...this.grupos, mapped];
    });
  }

  // --- PRIVADOS --- //
  loadUsers() {
    this.loading = true;
    this.userService.getAllOtherUsers().subscribe({
      next: (users) => {
        this.chats = users.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          status: u.status,
          type: 'privado',
        }));
        this.contactos = users;
      },
      error: (err) => console.error('❌ Error cargando usuarios:', err),
      complete: () => this.loading = false
    });
  }

  // --- GRUPOS --- //
  loadGroups() {
    this.groupService.getMyGroups().subscribe({
      next: (groups) => {
        console.log('📦 Grupos cargados:', groups);
        this.grupos = groups.map(g => ({
          id: g._id,
          name: g.name,
          members: g.members || [],
          membersCount: (g.members && g.members.length) || 0,
          status: 1,
          type: 'grupo' as const
        }));
      },
      error: (err) => {
        console.error('❌ Error cargando grupos:', err);
      }
    });
  }

  get chatsFiltrados() {
    return this.selectedTab === 'privados' ? this.chats : this.grupos;
  }

  selectTab(tab: 'privados' | 'grupos') {
    this.selectedTab = tab;
  }

  // --- CHAT --- //
  openChat(chat: any) {
    console.log('🟢 Chat clickeado:', chat);

    if (chat.type === 'grupo') {
      this.chatSelection.setSelected({
        id: String(chat.id),
        name: chat.name,
        members: chat.members || [],
        status: chat.status || 0,
        type: 'grupo'
      } as any);
    } else {
      this.chatSelection.setSelected({
        id: String(chat.id),
        name: chat.name,
        email: chat.email || '',
        status: chat.status || 0,
        type: 'privado'
      });
    }
  }

  // --- MODAL CREAR GRUPO --- //
  get contactosFiltrados() {
    return this.contactos.filter(c =>
      c.name.toLowerCase().includes(this.filtroContactos.toLowerCase())
    );
  }

  crearGrupo() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.seleccionados = [];
    this.filtroContactos = '';
    this.nombreGrupo = '';
  }

  toggleSeleccion(contactoId: string) {
    if (this.seleccionados.includes(contactoId)) {
      this.seleccionados = this.seleccionados.filter(c => c !== contactoId);
    } else {
      this.seleccionados.push(contactoId);
    }
  }

  crearGrupoConfirmado() {
    const nombreGrupoInput = (document.querySelector('input[placeholder="Nombre del grupo"]') as HTMLInputElement)?.value.trim();
    if (!nombreGrupoInput) {
      alert('Por favor ingresa un nombre para el grupo');
      return;
    }

    if (this.seleccionados.length < 2) {
      alert('Selecciona al menos 2 contactos para crear un grupo');
      return;
    }

    console.log('📤 Creando grupo con:', this.seleccionados);

    this.groupService.createGroup(nombreGrupoInput, this.seleccionados).subscribe({
      next: (group) => {
        console.log('✅ Grupo creado:', group);

        this.closeModal();
        this.loadGroups();
      },
      error: (err) => {
        console.error('❌ Error al crear grupo:', err);
        alert('Error al crear grupo');
      }
    });
  }

}
