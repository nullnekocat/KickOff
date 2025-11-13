import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { environment } from '../../environments/environment';
import { SocketService } from '../../services/socket.service';
import { ChatSelectionService, SelectedChat } from '../../services/chat-selection.service';
import { MessageService, MediaData } from '../../services/message.service';
import { EncryptionService } from '../../services/encryption.service';
import { WebRTCService } from '../../services/webrtc.service';

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
  messages: any[] = [];

  currentUserId = '';
  currentUserName = '';
  uploading = false;

  // Estados de llamada
  abrirLlamadaVoz = false;
  abrirVideollamada = false;
  enLlamada = false;

  // Llamada entrante
  llamadaEntrante = false;
  tipoLlamadaEntrante: 'voz' | 'video' | null = null;
  nombreLlamante: string | null = null;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;

  constructor(
    private socketService: SocketService,
    private chatSelection: ChatSelectionService,
    private messageService: MessageService,
    private encryptionService: EncryptionService,
    private webrtcService: WebRTCService
  ) { }

  async ngOnInit(): Promise<void> {
    // Obtener usuario actual
    const res = await fetch(`${environment.apiUrl}/api/users/me`, { credentials: 'include' });
    const user = await res.json();
    this.currentUserId = user.id;
    this.currentUserName = user.name;
    localStorage.setItem('currentUserId', user.id);

    if (!this.encryptionService.getPublicKey() || !this.encryptionService.getPrivateKey()) {
      await this.encryptionService.generateAndStoreKeyPair();
    }

    // Mensajes
    this.socketService.onMessage((msg) => {
      if (msg.roomId !== this.roomId || msg.senderId === this.currentUserId) return;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.messages.push({
        senderName: msg.senderName,
        text: msg.text,
        sender: msg.senderId === this.currentUserId ? 'me' : 'other',
        time,
        isEncrypted: msg.isEncrypted,
        media: msg.media || null
      });
      setTimeout(() => this.scrollToBottom(), 10);
    });

    this.socketService.localMessage$.subscribe((msg) => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.messages.push({
        senderName: this.currentUserName,
        text: msg.text || '',
        sender: 'me',
        time,
        isEncrypted: msg.isEncrypted || false,
        media: msg.media || null
      });
      setTimeout(() => this.scrollToBottom(), 10);
    });

    // roomKey ready
    this.socketService.roomKeyReady$.subscribe(roomId => {
      if (roomId === this.roomId) this.roomKeyReady = true;
    });

    // Chat seleccionado
    this.selSub = this.chatSelection.selected$.subscribe(async sel => {
      this.selectedChat = sel;
      this.messages = [];
      if (!sel) return;

      let newRoom: string;
      if (sel.type === 'grupo') {
        newRoom = sel.id; // el _id del grupo
      } else {
        newRoom = [this.currentUserId, sel.id].sort().join('_');
      }

      if (newRoom !== this.lastRoomId) {
        this.roomId = newRoom;
        this.loadEncryptionState(newRoom);
        this.lastRoomId = newRoom;
        this.socketService.joinRoom(newRoom);
        if (sel.type === 'privado') {
          this.socketService.sendPublicKey(this.currentUserId);
          await this.socketService.ensureRoomKey(newRoom, this.currentUserId, sel.id);
        }
        await this.loadMessageHistory(newRoom);
      }
    });

    // WebRTC — llamada entrante
    this.webrtcService.onIncomingCallDetailed(({ from, isVideo }) => {
      console.log('📩 Llamada entrante de', from, isVideo ? 'Video' : 'Voz');
      this.llamadaEntrante = true;
      this.tipoLlamadaEntrante = isVideo ? 'video' : 'voz';
      this.nombreLlamante = from;
    });

    // Stream remoto
    this.webrtcService.onRemoteStream(remote => {
      if (this.remoteVideoRef?.nativeElement) this.remoteVideoRef.nativeElement.srcObject = remote;
    });

    // Cuando termina llamada
    this.webrtcService.onCallEnded(() => {
      this.abrirLlamadaVoz = false;
      this.abrirVideollamada = false;
      this.enLlamada = false;
    });

    // Estado online/offline
    this.socketService.onUserStatusChange(({ userId, status }) => {
      if (this.selectedChat?.id === userId)
        this.selectedChat.status = status;
    });
  }

  // --- Mensajes --- //
  async loadMessageHistory(roomId: string) {
    this.messageService.getMessages(roomId).subscribe({
      next: async msgs => {
        const roomKeyB64 = this.socketService.getStoredRoomKeyBase64(roomId);
        this.messages = await Promise.all(msgs.map(async (m) => ({
          senderName: m.senderName || (m.senderId === this.currentUserId ? this.currentUserName : 'Usuario'),
          text: m.isEncrypted && roomKeyB64
            ? await this.socketService.aesDecryptBase64(roomKeyB64, m.text, m.iv || '').catch(() => '[Error]')
            : m.text,
          sender: m.senderId === this.currentUserId ? 'me' : 'other',
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEncrypted: m.isEncrypted,
          media: m.media || null
        })));
        console.log(this.messages);
        setTimeout(() => this.scrollToBottom(), 200);
      }
    });

  }

  toggleEncryption() {
    if (!this.roomKeyReady) return;
    this.encryptionEnabled = !this.encryptionEnabled;
    if (this.roomId) localStorage.setItem(`encEnabled_${this.roomId}`, JSON.stringify(this.encryptionEnabled));
  }

  private loadEncryptionState(roomId: string) {
    const stored = localStorage.getItem(`encEnabled_${roomId}`);
    this.encryptionEnabled = stored ? JSON.parse(stored) : false;
  }

  async sendMessage() {
    if (this.inputMessage.trim() && this.roomId)
      await this.socketService.sendMessage(this.roomId, this.inputMessage, this.encryptionEnabled);
    this.inputMessage = '';
  }

  async sendFile(event: any) {
    const file = event.target.files[0];
    if (file && this.roomId)
      await this.socketService.sendMediaMessage(this.roomId, file, this.encryptionEnabled);
    event.target.value = '';
  }

  scrollToBottom() {
    if (this.messagesContainer)
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
  }

  // --- Llamadas --- //
  async iniciarLlamadaVoz() {
    if (!this.roomId) return;
    console.log('📞 Iniciando llamada de voz...');
    this.abrirLlamadaVoz = true;

    try {
      const stream = await this.webrtcService.startCall(this.roomId, false);
      if (stream && this.localVideoRef?.nativeElement) this.localVideoRef.nativeElement.srcObject = stream;
      this.enLlamada = true;
    } catch (err) {
      console.error('❌ Error iniciando llamada de voz:', err);
    }
  }

  async iniciarVideollamada() {
    if (!this.roomId) return;
    console.log('🎥 Iniciando videollamada...');
    this.abrirVideollamada = true;

    try {
      const stream = await this.webrtcService.startCall(this.roomId, true);
      if (stream && this.localVideoRef?.nativeElement) this.localVideoRef.nativeElement.srcObject = stream;
      this.enLlamada = true;
    } catch (err) {
      console.error('❌ Error iniciando videollamada:', err);
    }
  }

  async aceptarLlamadaEntrante() {
    if (!this.roomId) return;
    this.llamadaEntrante = false;
    console.log('✅ Aceptando llamada entrante...');

    try {
      const stream = await this.webrtcService.acceptIncomingCall(this.roomId);
      if (stream && this.localVideoRef?.nativeElement)
        this.localVideoRef.nativeElement.srcObject = stream;

      this.webrtcService.onRemoteStream(remote => {
        if (remote && this.remoteVideoRef?.nativeElement)
          this.remoteVideoRef.nativeElement.srcObject = remote;
      });

      if (this.tipoLlamadaEntrante === 'video') this.abrirVideollamada = true;
      else this.abrirLlamadaVoz = true;

      this.enLlamada = true;
    } catch (err) {
      console.error('❌ Error al aceptar llamada:', err);
    }
  }

  rechazarLlamadaEntrante() {
    console.log('🚫 Llamada rechazada');
    this.webrtcService.rejectIncomingCall();
    this.llamadaEntrante = false;
  }

  cerrarLlamada() {
    console.log('📴 Cerrando llamada');
    this.webrtcService.endCall();
    this.abrirLlamadaVoz = false;
    this.abrirVideollamada = false;
    this.enLlamada = false;
    if (this.localVideoRef?.nativeElement) this.localVideoRef.nativeElement.srcObject = null;
    if (this.remoteVideoRef?.nativeElement) this.remoteVideoRef.nativeElement.srcObject = null;
  }

  ngOnDestroy() {
    this.selSub?.unsubscribe();
  }
}
