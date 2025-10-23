import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from './services/user.service';
import { UserRegister } from './models/user.model'; // importa el modelo

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './signin.html',
  styleUrls: ['./signin.css']
})
export class Signin {
  constructor(
    private router: Router,
    private service: UserService
  ) {}

  onRegister() {
    // Obtener los valores del formulario
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const name = (document.getElementById('nickname') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    if (this.validators(email, name, password)) {
      //Crear un objeto
      const newUser: UserRegister = {
        name,
        email,
        password,
        status: 0,
        createdAt: new Date()
      };

      // Llamar al backend
      this.service.createUser(newUser).subscribe({
        next: (res) => {
          alert('Usuario registrado correctamente');
          console.log('Nuevo usuario:', res);
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Error al registrar usuario:', err);
          alert('Ocurrió un error al registrar el usuario');
        }
      });
    }
  }

  validators(email: string, name: string, password: string): boolean {
    try {
      if (!email) throw 'El correo es requerido.';
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) throw 'El correo no tiene un formato válido.';
      if (!name) throw 'El nombre de usuario es requerido.';
      if (name.length < 3) throw 'El nombre debe tener al menos 3 caracteres.';
      if (!password) throw 'La contraseña es requerida.';
      if (password.length < 6) throw 'La contraseña debe tener al menos 6 caracteres.';
      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        throw 'La contraseña debe contener letras y números.';
      }
    } catch (e) {
      alert(e);
      return false;
    }
    return true;
  }
}
