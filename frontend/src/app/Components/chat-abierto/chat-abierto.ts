import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { SocketService } from '../../services/socket.service';
import { ChatSelectionService, SelectedChat } from '../../services/chat-selection.service';
import { MessageService, Message } from '../../services/message.service';
import { EncryptionService } from '../../services/encryption.service';

@Component({
  selector: 'app-chat-abierto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './chat-abierto.html',
  styleUrls: ['./chat-abierto.css']
})
export class ChatAbierto implements OnInit, OnDestroy {
  selectedChat: SelectedChat | null = null;
  private selSub?: Subscription;
  roomId: string | null = null;
  lastRoomId: string | null = null;

  roomKeyReady = false;
  encryptionEnabled = false;
  inputMessage = '';
  messages: { senderName: string; text: string; sender: 'me' | 'other'; time: string; isEncrypted: boolean }[] = [];
  currentUserId: string = '';
  currentUserName: string = '';

  abrirLlamadaVoz: boolean = false;
  enLlamadaVoz: boolean = false;
  abrirVideollamada: boolean = false;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  constructor(private socketService: SocketService,
    private chatSelection: ChatSelectionService,
    private messageService: MessageService,
    private encryptionService: EncryptionService) { }

  async ngOnInit(): Promise<void> {
    // Obtener el usuario actual
    const res = await fetch('http://localhost:3000/api/users/me', { credentials: 'include' });
    const user = await res.json();
    this.currentUserId = user.id;
    this.currentUserName = user.name;
    localStorage.setItem('currentUserId', user.id);

    if (!this.encryptionService.getPublicKey() || !this.encryptionService.getPrivateKey()) {
      await this.encryptionService.generateAndStoreKeyPair();
    }

    this.socketService.onMessage((msg) => {
      if (msg.roomId !== this.roomId) return;

      // Ignorar mensajes propios (se muestran localmente)
      if (msg.senderId === this.currentUserId) return;

      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const isMe = msg.senderId === this.currentUserId;

      this.messages.push({
        senderName: msg.senderName,
        text: msg.text,
        sender: isMe ? 'me' : 'other',
        time,
        isEncrypted: msg.isEncrypted
      });
      setTimeout(() => this.scrollToBottom(), 10);
    });

    this.socketService.localMessage$.subscribe((msg) => {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      this.messages.push({
        senderName: this.currentUserName,
        text: msg.text,
        sender: 'me',
        time,
        isEncrypted: msg.isEncrypted
      });

      setTimeout(() => this.scrollToBottom(), 10);
    });

    this.socketService.roomKeyReady$.subscribe(roomId => {
      if (roomId === this.roomId) {
        this.roomKeyReady = true;
        console.log('✅ roomKey lista para', roomId);
      }
    });

    // Suscribirse al chat seleccionado
    this.selSub = this.chatSelection.selected$.subscribe(async sel => {
      this.selectedChat = sel;
      this.messages = [];

      if (sel) {
        const newRoom = [this.currentUserId, sel.id].sort().join('_');

        if (newRoom !== this.lastRoomId) {
          this.roomId = newRoom;
          this.loadEncryptionState(this.roomId);
          this.lastRoomId = newRoom;
          console.log('🏠 Entrando al room:', this.roomId);
          this.socketService.joinRoom(this.roomId);
          this.socketService.sendPublicKey(this.currentUserId);

          await this.socketService.ensureRoomKey(this.roomId, this.currentUserId, sel.id);
          const roomKey = this.socketService.getStoredRoomKeyBase64(this.roomId);
          this.roomKeyReady = !!roomKey;

          await this.loadMessageHistory(this.roomId);
        }
      }
    });

    // Actualizar estado en tiempo real
    this.socketService.onUserStatusChange(({ userId, status }) => {
      if (this.selectedChat && this.selectedChat.id === userId) {
        this.selectedChat.status = status;
        console.log(`⚡ Estado actualizado: ${this.selectedChat.name} -> ${status ? 'En línea' : 'Desconectado'}`);
      }
    });
  }

  async loadMessageHistory(roomId: string) {
    this.messageService.getMessages(roomId).subscribe({
      next: async (msgs) => {
        console.log(`📚 ${msgs.length} mensajes cargados del room ${roomId}`);

        const roomKeyB64 = this.socketService.getStoredRoomKeyBase64(roomId);

        const processed: { senderName: string; text: string; sender: 'me' | 'other'; time: string; isEncrypted: boolean }[] =
          await Promise.all(msgs.map(async (m) => {
            let text = m.text;

            if (m.isEncrypted) {
              if (roomKeyB64) {
                try {
                  text = await this.socketService.aesDecryptBase64(roomKeyB64, m.text, m.iv || '');
                } catch (err) {
                  console.error('❌ Error desencriptando mensaje del historial:', err);
                  text = '[Error al desencriptar]';
                }
              } else {
                text = '[Mensaje encriptado]';
              }
            }

            return {
              senderName: m.senderId === this.currentUserId ? this.currentUserName : (this.selectedChat?.name || 'Usuario'),
              text,
              sender: m.senderId === this.currentUserId ? 'me' : 'other',
              time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isEncrypted: m.isEncrypted
            };
          }));
        this.messages = processed;
        setTimeout(() => this.scrollToBottom(), 200);
      },
      error: (err) => console.error('❌ Error cargando historial:', err)
    });
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  toggleEncryption() {
    if (!this.roomKeyReady) return; // seguridad extra
    this.encryptionEnabled = !this.encryptionEnabled;
    this.saveEncryptionState();
    console.log(this.encryptionEnabled ? '🔒 Encriptación activada' : '🔓 Encriptación desactivada');
  }

  private saveEncryptionState() {
    if (this.roomId) {
      localStorage.setItem(`encEnabled_${this.roomId}`, JSON.stringify(this.encryptionEnabled));
    }
  }

  private loadEncryptionState(roomId: string) {
    const stored = localStorage.getItem(`encEnabled_${roomId}`);
    this.encryptionEnabled = stored ? JSON.parse(stored) : false;
  }

  async sendMessage() {
    if (!this.inputMessage.trim() || !this.roomId) return;

    try {
      await this.socketService.sendMessage(this.roomId, this.inputMessage, this.encryptionEnabled);
      // Limpiar input después de enviar
      this.inputMessage = '';
      setTimeout(() => this.scrollToBottom(), 200);
    } catch (err) {
      console.error('❌ Error enviando mensaje:', err);
    }
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

  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.warn('⚠️ No se pudo hacer scroll:', err);
    }
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
