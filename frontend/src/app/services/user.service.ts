import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserRegister } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private api = 'http://localhost:3000/api/users'; // quitamos la barra final

  constructor(private http: HttpClient) {}

  // Obtener todos los usuarios
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.api);
  }

  getAllOtherUsers() {
    return this.http.get<any[]>(this.api, { withCredentials: true });
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.api}/${id}`);
  }

  createUser(user: UserRegister): Observable<User> {
    return this.http.post<User>(`${this.api}/signin`, user);
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.api}/${id}`, user);
  }

  login(name: string, password: string): Observable<any> {
    if (!name || !password) {
      throw new Error('Nombre de usuario y contraseña son requeridos');
    }
    return this.http.post<any>(`${this.api}/login`, { name, password }, {withCredentials: true});
  }

  logout(): Observable<any> {
    return this.http.post<any>(`${this.api}/logout`, {}, { withCredentials: true });
  }

  // Poner usuario en línea
  setOnline(id: string): Observable<any> {
    return this.http.put(`${this.api}/${id}/online`, {});
  }
}
