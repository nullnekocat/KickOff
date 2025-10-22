import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http'; 
import { UserService } from './services/user.service'; 


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  /**/
  constructor(
    private router: Router
  ) {}
  
    private service = inject(UserService);
    
  onLogin() {
    const name = (document.getElementById('nickname') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    if (!name || !password) {
      alert('Por favor ingresa usuario y contraseña');
      return;
    }

    this.router.navigate(['/home']);
    /* */
    this.service.login(name, password).subscribe({
      next: (res: any) => {
        localStorage.setItem('user', JSON.stringify(res.user));
        alert('✅ Login exitoso');
        
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
