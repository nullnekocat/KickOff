import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface Integrante {
  nombre: string;
  correo: string;
}

@Component({
  selector: 'app-integrantes',
  imports: [CommonModule],
  templateUrl: './integrantes.html',
  styleUrl: './integrantes.css'
})
export class Integrantes {
  integrantes: Integrante[] = [
    { nombre: 'Carlos Sánchez', correo: 'carlos@gmail.com' },
    { nombre: 'Ana Torres', correo: 'ana@gmail.com' }
  ];
}
