import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-chat-abierto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, NgClass],
  templateUrl: './chat-abierto.html',
  styleUrls: ['./chat-abierto.css']
})
export class ChatAbierto {
  abrirLlamadaVoz: boolean = false;
  enLlamadaVoz: boolean = false;
  abrirVideollamada: boolean = false;

  inputMessage = '';
  currentUserName: string = 'Usted';
  messages: { senderName: string, text: string, sender: 'me' | 'other', time: string }[] = [
    { senderName: 'Carlos Sanchez', text: '¡Hola! ¿Cómo están?', sender: 'other', time: '10:05 AM' },
    {senderName: 'Usted', text: 'Todo bien, gracias. ¿Y tú?', sender: 'me', time: '10:07 AM' },
    { senderName: 'Carlos Sanchez', text: 'He subido el archivo al servidor', sender: 'other', time: '10:10 AM' }
  ];

  constructor() {}

  sendMessage() {
    if (!this.inputMessage.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.messages.push({
      senderName: this.currentUserName, // aquí usamos la propiedad
      text: this.inputMessage,
      sender: 'me',
      time
    });

    this.inputMessage = '';
    setTimeout(() => this.scrollToBottom(), 0);
  }

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

  scrollToBottom() {
    const container = document.querySelector('.overflow-y-auto');
    if (container) container.scrollTop = container.scrollHeight;
  }

  abrirLlamadaVozModal() {
    this.abrirLlamadaVoz = true;
    this.enLlamadaVoz = false;
  }

  // Aceptar llamada de voz
  iniciarLlamadaVoz() {
    this.enLlamadaVoz = true;
    console.log('Llamada de voz iniciada');
    // Aquí podrías integrar WebRTC o tu servicio de llamadas
  }

  // Cerrar/Rechazar llamada
  cerrarLlamadaVoz() {
    this.abrirLlamadaVoz = false;
    this.enLlamadaVoz = false;
    console.log('Llamada de voz finalizada');
  }

  abrirLlamada() { this.abrirVideollamada = true; }
  cerrarLlamada() { this.abrirVideollamada = false; }

  iniciarLlamada() {
    // Aquí lógica para iniciar WebRTC
    console.log('Llamada iniciada');
  }


}
