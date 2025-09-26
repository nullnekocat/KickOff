import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // <<< IMPORTANTE
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';

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
  abrirModal: boolean = false;
  logoPath = 'assets/Logo_Blanco.png';

  constructor(private router: Router) {}

  cerrarSesion() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
    this.abrirModal = false;
  }
}
