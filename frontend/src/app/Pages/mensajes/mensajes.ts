import { Component } from '@angular/core';
import { ListaChats } from '../../Components/lista-chats/lista-chats';
import { ChatAbierto } from '../../Components/chat-abierto/chat-abierto';
import { Integrantes } from "../../Components/integrantes/integrantes";
import { Tareas } from "../../Components/tareas/tareas";
import { Recompensas } from '../../Components/recompensas/recompensas';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [ListaChats, ChatAbierto, Integrantes, 
    Tareas, Recompensas, NgClass],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.css'
})
export class Mensajes {
  leftOpen = false;
  rightOpen = false;

  toggleLeft() {
    this.leftOpen = !this.leftOpen;
    if (this.rightOpen) this.rightOpen = false; // opcional, para no abrir los dos a la vez
  }

  toggleRight() {
    this.rightOpen = !this.rightOpen;
    if (this.leftOpen) this.leftOpen = false;
  }
}
