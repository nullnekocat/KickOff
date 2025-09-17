import { Component, signal, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Menu } from './Components/menu/menu';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Menu, NgClass],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('KickOff');
  menuAbierto = false;

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  // Ajustar automáticamente al redimensionar ventana
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth >= 768) {
      this.menuAbierto = true;
    } else {
      this.menuAbierto = false;
    }
  }

}

