import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-chat-abierto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './chat-abierto.html',
  styleUrls: ['./chat-abierto.css']
})
export class ChatAbierto implements OnInit{
  abrirLlamadaVoz: boolean = false;
  enLlamadaVoz: boolean = false;
  abrirVideollamada: boolean = false;

  inputMessage = '';
  messages: { senderName: string; text: string; sender: 'me' | 'other'; time: string; }[] = [];
  currentUserName: string = 'Usted';

  constructor(private socketService: SocketService) {}

  ngOnInit(): void {
    this.socketService.onMessage((msg) => {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });   
      const isMe = msg.from === this.socketService.socketId;
      this.messages.push({
        senderName: isMe ? 'Usted' : msg.from,
        text: msg.text,
        sender: isMe ? 'me' : 'other',  // If the message is from myself, style as 'me', else 'other'
        time: time
      });
      setTimeout(() => this.scrollToBottom(), 0);
    });
  }

  sendMessage() {
    if (this.inputMessage.trim()) {
      this.socketService.sendMessage(this.inputMessage);
      this.inputMessage = '';
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
}
