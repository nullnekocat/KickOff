import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- esto es necesario
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-chat-abierto',
  imports: [NgClass, CommonModule, FormsModule, MatIconModule],
  templateUrl: './chat-abierto.html',
  styleUrl: './chat-abierto.css'
})
export class ChatAbierto {
  inputMessage = '';
  messages: { text: string, sender: 'me' | 'other', time: string }[] = [
    { text: '¡Hola! ¿Cómo estás?', sender: 'other', time: '10:05 AM' },
    { text: 'Todo bien, gracias. ¿Y tú?', sender: 'me', time: '10:07 AM' }
  ];

  sendMessage() {
    if (!this.inputMessage.trim()) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.messages.push({ text: this.inputMessage, sender: 'me', time });
    this.inputMessage = '';
    setTimeout(() => this.scrollToBottom(), 0);
  }

  sendFile(event: any) {
    const file = event.target.files[0];
    if (file) {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.messages.push({ text: `Archivo: ${file.name}`, sender: 'me', time });
      setTimeout(() => this.scrollToBottom(), 0);
    }
    event.target.value = '';
  }

  scrollToBottom() {
    const container = document.querySelector('.overflow-y-auto');
    if (container) container.scrollTop = container.scrollHeight;
  }
}
