import { Component } from '@angular/core';
import { ListaChats } from '../../Components/lista-chats/lista-chats';
import { ChatAbierto } from '../../Components/chat-abierto/chat-abierto';
import { Integrantes } from "../../Components/integrantes/integrantes";
import { Tareas } from "../../Components/tareas/tareas";
import { NgClass, CommonModule, NgIf } from '@angular/common';
import { ChatSelectionService } from '../../services/chat-selection.service';
import { SocketService } from '../../services/socket.service';
import { OnInit, OnDestroy } from '@angular/core';


@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [CommonModule, NgIf, ListaChats, ChatAbierto, Integrantes, 
    Tareas, NgClass],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.css'
})
export class Mensajes implements OnInit, OnDestroy {
  leftOpen = false;
  rightOpen = false;
  isGroupSelected = false;

  constructor(private chatSelection: ChatSelectionService, private socketService: SocketService) {
    // subscribe to selection to show/hide right panel only for groups
    this.chatSelection.selected$.subscribe(sel => {
      if (sel && sel.type === 'grupo') {
        this.isGroupSelected = true;
        this.rightOpen = true; // open right panel automatically for groups
      } else {
        this.isGroupSelected = false;
        this.rightOpen = false; // hide for privados or none
      }
    });
  }

  ngOnInit(): void {
    // when entering the Mensajes page, declare presence=online so other users see you
    try { this.socketService.emit('presence', { status: 1 }); }
    catch (e) { console.warn('Could not emit presence online', e); }
  }

  ngOnDestroy(): void {
    // when leaving the Mensajes page, declare presence=offline
    try { this.socketService.emit('presence', { status: 0 }); }
    catch (e) { console.warn('Could not emit presence offline', e); }
  }

  toggleLeft() {
    this.leftOpen = !this.leftOpen;
    if (this.rightOpen) this.rightOpen = false; // opcional, para no abrir los dos a la vez
  }

  toggleRight() {
    // only allow toggling if a group is selected
    if (!this.isGroupSelected) return;
    this.rightOpen = !this.rightOpen;
    if (this.leftOpen) this.leftOpen = false;
  }
}
