import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
    senderId: string;
    senderName: string;
    text: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
    private socket!: Socket;
    public socketId: string | undefined = '';

    constructor() {
        // La cookie JWT será enviada automáticamente
        this.socket = io('http://localhost:3000', { withCredentials: true });

        this.socket.on('connect', () => {
        this.socketId = this.socket.id;
        console.log('✅ Socket conectado:', this.socketId);
        });

        this.socket.on('disconnect', (reason) => {
        console.warn('⚠️ Socket desconectado:', reason);
        });
    }

    // 📦 Unirse a un room privado
    joinRoom(roomId: string) {
        this.socket.emit('joinRoom', { roomId });
        console.log('📤 Uniendo al room:', roomId);
    }

    // 💬 Enviar mensaje al room actual
    sendMessage(roomId: string, text: string): void {
        if (!roomId) return;
        this.socket.emit('message', { roomId, text });
    }

    onMessage(callback: (message: ChatMessage) => void): void {
        this.socket.on('message', callback);
    }
}