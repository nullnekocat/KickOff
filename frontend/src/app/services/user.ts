import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/user.model'; // ajusta la ruta si tu model está en otra carpeta

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private api = 'http://localhost:3000/api/users/'; // tu backend

  constructor(private http: HttpClient) { }

  // Obtener todos los usuarios
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.api);
  }

  // Obtener un usuario por ID
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.api}/${id}`);
  }

  // Crear usuario
  createUser(user: User): Observable<User> {
    // Aquí puedes validar antes de mandar al backend
    if (!user.name || !user.email || !user.password) {
      throw new Error('Name, email y password son requeridos');
    }
    return this.http.post<User>(this.api, user);
  }

  // Actualizar usuario
  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.api}/${id}`, user);
  }

  // Eliminar usuario
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

  // Login de usuario
  login(name: string, password: string): Observable<any> {
    if (!name || !password) {
      throw new Error('Nombre de usuario y contraseña son requeridos');
    }
    return this.http.post<any>(`${this.api}login`, { name, password });
  }

}
