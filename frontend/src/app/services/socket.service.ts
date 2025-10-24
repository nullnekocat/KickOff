import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
    from: string;
    text: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
    private socket: Socket;
    public socketId: string | undefined = '';

    constructor() {
        this.socket = io('http://localhost:3000');
        this.socket.on('connect', () => {
            this.socketId = this.socket.id;
        });
    }

    sendMessage(message: string): void {
        this.socket.emit('message', message);
    }

    onMessage(callback: (message: ChatMessage) => void): void {
        this.socket.on('message', callback);
    }
}