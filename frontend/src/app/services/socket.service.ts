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

    sendMessage(message: string): void {
        if (!this.socket) return;
        this.socket.emit('message', message);
    }

    onMessage(callback: (message: ChatMessage) => void): void {
        if (!this.socket) return;
        this.socket.on('message', callback);
    }
}