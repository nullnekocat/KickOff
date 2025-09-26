import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';

interface Tarea {
  nombre: string;
  completada: boolean;
}

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIcon],
  templateUrl: './tareas.html',
  styleUrl: './tareas.css'
})
export class Tareas { 
  tareas: Tarea[] = [
    { nombre: 'Enviar un mensaje', completada: false},
    { nombre: 'Subir archivos', completada: false},
    { nombre: 'Investiga el Mundial de 2022', completada: false},
  ];

  agregarTarea() {
    const nombre = prompt('Escribe una nueva tarea:');
    if (nombre && nombre.trim() !== '') {
      this.tareas.push({ nombre, completada: false });
    }
  }
}
