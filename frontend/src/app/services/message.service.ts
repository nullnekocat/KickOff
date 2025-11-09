import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Message {
    _id?: string;
    roomId: string;
    senderId: string;
    text: string;
    isEncrypted: boolean;
    createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
    private api = 'http://localhost:3000/api/messages';

    constructor(private http: HttpClient) {}

    // Obtener mensajes por roomId
    getMessages(roomId: string): Observable<Message[]> {
        return this.http.get<Message[]>(`${this.api}/${roomId}`, { withCredentials: true });
    }

    // Crear mensaje manualmente (si no lo envías por socket)
    //sendMessage(message: Partial<Message>): Observable<Message> {
    //    return this.http.post<Message>(this.api, message, { withCredentials: true });
    //}
}