import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from './services/user'; // ajusta la ruta a tu service

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  onLogin() {
    // Obtener valores directamente del DOM
    const name = (document.getElementById('nickname') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    if (!name || !password) {
      alert('Por favor ingresa usuario y contraseña');
      return;
    }

    this.userService.login(name, password).subscribe({
    next: (res: any) => {
      localStorage.setItem('token', res.token);
      alert('✅ Login exitoso');
      this.router.navigate(['/home']);
    },
    error: (err) => {
      console.error(err);
      alert('❌ Usuario o contraseña incorrectos');
    }
  });

  }
  goToSignin() {
    this.router.navigate(['/signin']);
  }
}
