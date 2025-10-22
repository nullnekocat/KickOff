import { Component, signal, HostListener, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Menu } from './Components/menu/menu';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Menu, NgClass, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('KickOff');
  menuAbierto = false;
  isMobile = false;
  showMenu = true;

  
  private router = inject(Router);

  ngOnInit() {
    this.checkScreenSize();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const hiddenRoutes = ['/login', '/signin', ''];
        this.showMenu = !hiddenRoutes.includes(event.urlAfterRedirects);
      });
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;

    if (!this.isMobile) {
      this.menuAbierto = true;
    } else {
      this.menuAbierto = false;
    }
  }

  abrirModal = false;

  cerrarSesion() {
    this.abrirModal = false;
    this.router.navigateByUrl('/login');
    // Lógica real para cerrar sesión
  }

}
