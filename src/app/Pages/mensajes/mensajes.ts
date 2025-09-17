import { Component } from '@angular/core';
import { ListaChats } from '../../Components/lista-chats/lista-chats';
import { ChatAbierto } from '../../Components/chat-abierto/chat-abierto';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [ListaChats, ChatAbierto, NgClass],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.css'
})
export class Mensajes {

}
