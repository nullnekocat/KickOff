import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // <<< IMPORTANTE
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-menu',
  standalone: true,  // si es standalone
  imports: [CommonModule, RouterModule, MatIconModule, 
  MatButtonModule, MatBadgeModule],
  templateUrl: './menu.html',
  styleUrls: ['./menu.css']
})
export class Menu {
  isMenuOpen = false;
  logoPath = 'assets/Logo_Blanco.png';

  @Output() abrirModalEvent = new EventEmitter<void>();

  constructor(private router: Router) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  onAbrirModal() {
    this.abrirModalEvent.emit();
  }
  
}
