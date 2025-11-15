import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SocketService } from '../../services/socket.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, MatIconModule, HttpClientModule],
  templateUrl: './ranking.html',
  styleUrl: './ranking.css'
})
export class Ranking {
  showModal = false;
  users: Array<any> = [];
  mePoints: number = 0;
  meStreak: number = 0;
  currentUserId: string | null = null;

  private api = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient, private socket: SocketService) {}

  ngOnInit() {
    this.currentUserId = localStorage.getItem('currentUserId');
    // fetch ranking (requires auth)
    this.http.get<any[]>(`${this.api}/users`, { withCredentials: true }).subscribe({
      next: (data) => { this.users = (data || []).sort((a,b) => (b.points||0) - (a.points||0)); },
      error: (err) => { console.warn('No se pudo cargar el ranking (¿no logueado?):', err); this.users = []; }
    });

    // fetch current user points/streak
    this.http.get<any>(`${this.api}/users/me/details`, { withCredentials: true }).subscribe({
      next: (d) => { this.mePoints = d.points || 0; this.meStreak = d.dailyStreak || 0; },
      error: () => { this.mePoints = 0; this.meStreak = 0; }
    });

    // Subscribe to live updates for points
    this.socket.on('user:points-updated', (payload: any) => {
      try {
        const { userId, points, dailyStreak } = payload || {};
        if (!userId) return;

        // Update local me block if it's the current user
        if (this.currentUserId && userId === this.currentUserId) {
          this.mePoints = points || 0;
          this.meStreak = dailyStreak || 0;
        }

        // Update ranking list if present
        const idx = this.users.findIndex(u => String(u._id) === String(userId));
        if (idx >= 0) {
          this.users[idx].points = points;
          this.users[idx].dailyStreak = dailyStreak;
          // re-sort
          this.users.sort((a, b) => (b.points || 0) - (a.points || 0));
        } else {
          // optionally insert user if not present
          this.users.push({ _id: userId, name: 'Usuario', points: points || 0, dailyStreak: dailyStreak || 0 });
          this.users.sort((a, b) => (b.points || 0) - (a.points || 0));
        }
      } catch (e) { console.warn('Error procesando actualización de puntos', e); }
    });
  }

  isCurrent(u: any): boolean {
    return !!(this.currentUserId && u && u._id && String(u._id) === String(this.currentUserId));
  }

  displayName(u: any): string {
    if (!u) return '';
    return this.isCurrent(u) ? `${u.name} (Tú)` : (u.name || 'Usuario');
  }
}
