import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { SocketService } from '../../services/socket.service';
import { ChatSelectionService, SelectedChat } from '../../services/chat-selection.service';
import { MessageService, Message } from '../../services/message.service';

@Component({
  selector: 'app-chat-abierto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './chat-abierto.html',
  styleUrls: ['./chat-abierto.css']
})
export class ChatAbierto implements OnInit, OnDestroy{
  selectedChat: SelectedChat | null = null;
  private selSub?: Subscription;
  roomId: string | null = null;
  lastRoomId: string | null = null;

  inputMessage = '';
  messages: { senderName: string; text: string; sender: 'me' | 'other'; time: string; }[] = [];
  currentUserId: string = '';
  currentUserName: string = '';

  abrirLlamadaVoz: boolean = false;
  enLlamadaVoz: boolean = false;
  abrirVideollamada: boolean = false;

  constructor(private socketService: SocketService,
              private chatSelection: ChatSelectionService,
              private messageService: MessageService) {}

  async ngOnInit(): Promise<void> {
    // Obtener el usuario actual
    const res = await fetch('http://localhost:3000/api/users/me', { credentials: 'include' });
    const user = await res.json();
    this.currentUserId = user.id;
    this.currentUserName = user.name;

    // Suscribirse al chat seleccionado
    this.selSub = this.chatSelection.selected$.subscribe(sel => {
      console.log('📩 ChatAbierto recibió:', sel);
      this.selectedChat = sel;
      this.messages = [];

      if (sel) {
        const newRoom = [this.currentUserId, sel.id].sort().join('_');

        if (newRoom !== this.lastRoomId) {
          this.roomId = newRoom;
          this.lastRoomId = newRoom;
          console.log('🏠 Entrando al room:', this.roomId);
          this.socketService.joinRoom(this.roomId);

          //Cargar historial del room desde MongoDB
          this.loadMessageHistory(this.roomId);
        }
      }
    });


    // Iniciar socket listener
    this.socketService.onMessage((msg) => {

      if (msg.roomId !== this.roomId) return;

      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const isMe = msg.senderId === this.currentUserId;

      this.messages.push({
        senderName: msg.senderName,
        text: msg.text,
        sender: isMe ? 'me' : 'other',
        time,
      });

      setTimeout(() => this.scrollToBottom(), 0);
    });
  }

  loadMessageHistory(roomId: string) {
    this.messageService.getMessages(roomId).subscribe({
      next: (msgs) => {
        console.log(`📚 ${msgs.length} mensajes cargados del room ${roomId}`);
        this.messages = msgs.map(m => ({
          senderName: m.senderId === this.currentUserId ? this.currentUserName : this.selectedChat?.name || 'Usuario',
          text: m.text,
          sender: m.senderId === this.currentUserId ? 'me' : 'other',
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setTimeout(() => this.scrollToBottom(), 0);
      },
      error: (err) => console.error('❌ Error cargando historial:', err)
    });
  }

  sendMessage() {
    if (!this.inputMessage.trim() || !this.roomId) return;
    this.socketService.sendMessage(this.roomId, this.inputMessage);
    this.inputMessage = '';
  }
    /*
    if (!this.inputMessage.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.messages.push({
      senderName: this.currentUserName, 
      text: this.inputMessage,
      sender: 'me',
      time
    });

    this.inputMessage = '';
    setTimeout(() => this.scrollToBottom(), 0);
    */
  
  /*
  TODO: File system
  sendFile(event: any) {
    const file = event.target.files[0];
    if (file) {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.messages.push({
        senderName: this.currentUserName, 
        text: `Archivo: ${file.name}`,
        sender: 'me',
        time
      });
      setTimeout(() => this.scrollToBottom(), 0);
    }
    event.target.value = '';
  }
  */

  scrollToBottom() {
    const container = document.querySelector('.overflow-y-auto');
    if (container) container.scrollTop = container.scrollHeight;
  }

  
  abrirLlamadaVozModal() {
    this.abrirLlamadaVoz = true;
    this.enLlamadaVoz = false;
  }

  iniciarLlamadaVoz() {
    this.enLlamadaVoz = true;
    console.log('Llamada de voz iniciada');
    //TODO: implement WebRTC for calls
  }

  cerrarLlamadaVoz() {
    this.abrirLlamadaVoz = false;
    this.enLlamadaVoz = false;
    console.log('Llamada de voz finalizada');
  }

  abrirLlamada() { this.abrirVideollamada = true; }
  cerrarLlamada() { this.abrirVideollamada = false; }

  iniciarLlamada() {
    //TODO: implement WebRTC for calls
    console.log('Llamada iniciada');
  }

  ngOnDestroy(): void {
    this.selSub?.unsubscribe();
  }
}
