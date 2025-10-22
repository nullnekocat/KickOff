import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface Recompensa {
  nombre: string;
  puntos: number;
}

@Component({
  selector: 'app-recompensas',
  imports: [CommonModule],
  templateUrl: './recompensas.html',
  styleUrl: './recompensas.css'
})
export class Recompensas {
  recompensas: Recompensa[]= [
     { nombre: 'Haber creado tu primer chat', puntos: 10 },
    { nombre: 'Añadir contacto a chat', puntos: 10 }
  ]
}
