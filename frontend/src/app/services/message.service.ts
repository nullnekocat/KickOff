import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MediaData {
    url: string | null;
    type: 'image' | 'video' | 'audio' | 'file' | null;
    name: string | null;
}

export interface Message {
    _id?: string;
    roomId: string;
    senderId: string;
    text: string;
    iv?: string;
    isEncrypted: boolean;
    media?: MediaData | null;
    createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
    private api = 'http://localhost:3000/api/messages';

    constructor(private http: HttpClient) { }

    // Obtener mensajes por roomId
    getMessages(roomId: string): Observable<Message[]> {
        return this.http.get<Message[]>(`${this.api}/${roomId}`, { withCredentials: true });
    }
}