import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

import { environment } from '../../environments/environment';
import { SocketService } from '../../services/socket.service';
import { ChatSelectionService, SelectedChat } from '../../services/chat-selection.service';
import { MessageService, MediaData } from '../../services/message.service';
import { EncryptionService } from '../../services/encryption.service';
import { WebrtcService } from '../../services/webrtc.service';

@Component({
  selector: 'app-chat-abierto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  providers: [WebrtcService], // 🔧 AÑADIDO: instancia separada por componente
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
  otherUser: any = null;
  integrantes: any[] = [];
  uploading = false;

  // Estados de llamada
  abrirLlamadaVoz = false;
  abrirVideollamada = false;

  callState: 'idle' | 'calling' | 'incoming' | 'inCall' = 'idle';
  incomingFrom: string | null = null;
  activeTarget: string | null = null;

  // Subscripciones
  private subs: Subscription[] = [];

  // Llamada entrante
  llamadaEntrante = false;
  tipoLlamadaEntrante: 'voz' | 'video' | null = null;
  nombreLlamante: string | null = null;
  idLlamante: string | null = null;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('localVideo', { static: false }) localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: false }) remoteVideo!: ElementRef<HTMLVideoElement>;

  constructor(
    private socketService: SocketService,
    private chatSelection: ChatSelectionService,
    private messageService: MessageService,
    private encryptionService: EncryptionService,
    private webrtcService: WebrtcService,
    private cd: ChangeDetectorRef,
    
  ) { }

  
  async ngOnInit(): Promise<void> {
    
    try {
      const res = await fetch(`${environment.apiUrl}/api/users/me`, { credentials: 'include' });
      const user = await res.json();
      this.currentUserId = user.id;
      this.currentUserName = user.name;
      localStorage.setItem('currentUserId', user.id);
    } catch (err) {
      console.error('Error fetching current user:', err);
    }

    if (!this.encryptionService.getPublicKey() || !this.encryptionService.getPrivateKey()) {
      await this.encryptionService.generateAndStoreKeyPair();
    }

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

    this.socketService.roomKeyReady$.subscribe(roomId => {
      if (roomId === this.roomId) this.roomKeyReady = true;
    });

    this.selSub = this.chatSelection.selected$.subscribe(async sel => {
      this.selectedChat = sel;
      this.messages = [];
      if (!sel) return;

      this.integrantes = sel?.members || [];

      if (sel.type === 'privado') {
        this.otherUser = (sel.members && sel.members.length) ? sel.members[0] : null;
      } else {
        this.otherUser = null;
      }

      let newRoom: string;
      if (sel.type === 'grupo') {
        newRoom = sel.id;
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

    const s1 = this.webrtcService.onIncomingCallDetailed()
      .subscribe(({ from, isVideo }: { from: string; isVideo: boolean }) => {
        this.callState = 'incoming';
        this.incomingFrom = from;
        this.llamadaEntrante = true;
        this.tipoLlamadaEntrante = isVideo ? 'video' : 'voz';
        this.idLlamante = from;

        const caller = this.otherUser;
        this.nombreLlamante = caller ? caller.name : 'Usuario desconocido';

        try { this.cd.detectChanges(); } catch (e) { }

      });
    this.subs.push(s1);

    const s2 = this.webrtcService.onLocalStream()
      .subscribe(stream => {
        if (!stream) {
          if (this.localVideo?.nativeElement) {
            this.localVideo.nativeElement.srcObject = null;
          }
          return;
        }
        this.cd.detectChanges();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (this.localVideo?.nativeElement) {
              this.attachStream(this.localVideo.nativeElement, stream, true);
            } else {
              console.warn('localVideo element not found in DOM');
            }
          });
        });
      });
    this.subs.push(s2);


    const s3 = this.webrtcService.onRemoteStream()
      .subscribe(stream => {
        if (!stream) {
          if (this.remoteVideo?.nativeElement) {
            this.remoteVideo.nativeElement.srcObject = null;
          }
          return;
        }
        if (this.callState === 'calling') {
          this.callState = 'inCall';
          try { this.cd.detectChanges(); } catch (e) { /* ignore */ }
        }
        this.cd.detectChanges();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (this.remoteVideo?.nativeElement) {
              this.attachStream(this.remoteVideo.nativeElement, stream, false);
            } else {
              setTimeout(() => {
                if (this.remoteVideo?.nativeElement) {
                  this.attachStream(this.remoteVideo.nativeElement, stream, false);
                } else {
                  console.error('remoteVideo STILL not in DOM after retry');
                }
              }, 200);
            }
          });
        });
      });
    this.subs.push(s3);

    const s4 = this.webrtcService.onCallEnded()
      .subscribe(() => {
        this.cleanupCallUI();
      });
    this.subs.push(s4);

    this.socketService.onUserStatusChange(({ userId, status }) => {
      if (this.selectedChat?.id === userId) {
        this.selectedChat.status = status;
      }
    });
  }

  // --- Mensajes --- //
  async loadMessageHistory(roomId: string) {
    this.messageService.getMessages(roomId).subscribe({
      next: async msgs => {
        const roomKeyB64 = this.socketService.getStoredRoomKeyBase64(roomId);
        this.messages = await Promise.all(msgs.map(async (m) => ({
          senderName: this.resolveSenderName(m.senderId),
          text: m.isEncrypted && roomKeyB64
            ? await this.socketService.aesDecryptBase64(roomKeyB64, m.text, m.iv || '').catch(() => '[Error]')
            : m.text,
          sender: m.senderId === this.currentUserId ? 'me' : 'other',
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEncrypted: m.isEncrypted,
          media: m.media || null
        })));
        setTimeout(() => this.scrollToBottom(), 200);
      }
    });
  }

  private resolveSenderName(senderId: any): string {
    const sid = String(senderId);
    const me = String(this.currentUserId);

    if (sid === me) return this.currentUserName;

    if (this.selectedChat?.type === 'privado') {
      return this.otherUser?.name || 'Usuario';
    }

    const found = this.integrantes?.find(m => String(m._id) === sid);
    return found ? (found.name || found.fullname || 'Usuario') : 'Usuario';
  }

  toggleEncryption() {
    if (!this.roomKeyReady) return;
    this.encryptionEnabled = !this.encryptionEnabled;
    if (this.roomId) {
      localStorage.setItem(`encEnabled_${this.roomId}`, JSON.stringify(this.encryptionEnabled));
    }
  }

  private loadEncryptionState(roomId: string) {
    const stored = localStorage.getItem(`encEnabled_${roomId}`);
    this.encryptionEnabled = stored ? JSON.parse(stored) : false;
  }

  async sendMessage() {
    if (this.inputMessage.trim() && this.roomId) {
      await this.socketService.sendMessage(this.roomId, this.inputMessage, this.encryptionEnabled);
    }
    this.inputMessage = '';
  }

  async sendFile(event: any) {
    const file = event.target.files[0];
    if (file && this.roomId) {
      await this.socketService.sendMediaMessage(this.roomId, file, this.encryptionEnabled);
    }
    event.target.value = '';
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    }
  }

  // --- Llamadas --- //
  async startCall() {
    if (this.callState !== 'idle') {
      console.warn('Ya hay una llamada en curso');
      return;
    }

    const selected = this.chatSelection.getSelected();
    if (!selected?.id) {
      console.warn('No hay chat seleccionado');
      return;
    }

    const targetUserId = selected.id;

    this.callState = 'calling';
    this.activeTarget = targetUserId;
    this.abrirVideollamada = true;

    try {
      await this.webrtcService.callUser(targetUserId);
    } catch (err) {
      console.error('rror iniciando llamada:', err);
      this.cleanupCallUI();
    }
  }

  async acceptCall() {
    if (!this.incomingFrom) {
      console.warn('No hay llamada entrante');
      return;
    }

    const from = this.incomingFrom;

    console.log('Aceptando llamada de', from);

    this.llamadaEntrante = false;
    this.abrirVideollamada = true;
    this.callState = 'inCall';
    this.activeTarget = from;

    // 🔧 El servicio se encarga de obtener el stream
    try {
      await this.webrtcService.acceptCall(from);
      this.incomingFrom = null;
    } catch (err) {
      console.error('Error aceptando llamada:', err);
      this.cleanupCallUI();
    }
  }

  rejectCall() {
    if (!this.incomingFrom) return;

    console.log('Rechazando llamada de', this.incomingFrom);

    this.webrtcService.rejectCall(this.incomingFrom);
    this.cleanupCallUI();
  }

  hangUp() {
    console.log('Colgando llamada');

    this.webrtcService.endCall();
    this.cleanupCallUI();
  }

  private cleanupCallUI() {
    this.callState = 'idle';
    this.incomingFrom = null;
    this.activeTarget = null;
    this.abrirVideollamada = false;
    this.abrirLlamadaVoz = false;
    this.llamadaEntrante = false;
    this.nombreLlamante = null;
    this.idLlamante = null;

    // Limpiar elementos de video
    if (this.localVideo?.nativeElement) {
      try {
        this.localVideo.nativeElement.srcObject = null;
      } catch (e) { }
    }
    if (this.remoteVideo?.nativeElement) {
      try {
        this.remoteVideo.nativeElement.srcObject = null;
      } catch (e) { }
    }
  }

  private attachStream(
    video: HTMLVideoElement,
    stream: MediaStream,
    isLocal: boolean
  ) {
    if (!video || !stream) {
      console.warn('⚠️ attachStream: video o stream es null');
      return;
    }

    try {
      const prev = video.srcObject as MediaStream | null;

      // Si es exactamente el mismo stream, no hacer nada
      if (prev && prev.id === stream.id) {
        const prevIds = prev.getTracks().map(t => t.id).sort().join(',');
        const newIds = stream.getTracks().map(t => t.id).sort().join(',');
        if (prevIds === newIds) {
          return;
        }
      }

      video.srcObject = stream;
      video.playsInline = true;
      video.muted = isLocal; // Solo mutear el video local

      // Event listener para metadata
      const onLoaded = () => {
        video.removeEventListener('loadedmetadata', onLoaded);
      };
      video.addEventListener('loadedmetadata', onLoaded);

    } catch (err) {
      console.error('attachStream error:', err);
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.selSub?.unsubscribe();
  }
}