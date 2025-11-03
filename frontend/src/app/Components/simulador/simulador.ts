import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-simulador',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './simulador.html',
  styleUrl: './simulador.css'
})
export class Simulador {
  teams = [
    { name: 'Alemania', flag: '🇩🇪' },
  { name: 'Arabia Saudita', flag: '🇸🇦' },
  { name: 'Argelia', flag: '🇩🇿' },
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Bélgica', flag: '🇧🇪' },
  { name: 'Brasil', flag: '🇧🇷' },
  { name: 'Camerún', flag: '🇨🇲' },
  { name: 'Canadá', flag: '🇨🇦' },
  { name: 'Chile', flag: '🇨🇱' },
  { name: 'Colombia', flag: '🇨🇴' },
  { name: 'Corea del Sur', flag: '🇰🇷' },
  { name: 'Costa Rica', flag: '🇨🇷' },
  { name: 'Croacia', flag: '🇭🇷' },
  { name: 'Dinamarca', flag: '🇩🇰' },
  { name: 'Ecuador', flag: '🇪🇨' },
  { name: 'Egipto', flag: '🇪🇬' },
  { name: 'Emiratos Árabes Unidos', flag: '🇦🇪' },
  { name: 'EEUU', flag: '🇺🇸' },
  { name: 'España', flag: '🇪🇸' },
  { name: 'Francia', flag: '🇫🇷' },
  { name: 'Ghana', flag: '🇬🇭' },
  { name: 'Honduras', flag: '🇭🇳' },
  { name: 'Inglaterra', flag: '🏴' },
  { name: 'Irán', flag: '🇮🇷' },
  { name: 'Italia', flag: '🇮🇹' },
  { name: 'Jamaica', flag: '🇯🇲' },
  { name: 'Japón', flag: '🇯🇵' },
  { name: 'Marruecos', flag: '🇲🇦' },
  { name: 'México', flag: '🇲🇽' },
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'Noruega', flag: '🇳🇴' },
  { name: 'Nueva Zelanda', flag: '🇳🇿' },
  { name: 'Países Bajos', flag: '🇳🇱' },
  { name: 'Panamá', flag: '🇵🇦' },
  { name: 'Paraguay', flag: '🇵🇾' },
  { name: 'Polonia', flag: '🇵🇱' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Qatar', flag: '🇶🇦' },
  { name: 'Senegal', flag: '🇸🇳' },
  { name: 'Serbia', flag: '🇷🇸' },
  { name: 'Sudáfrica', flag: '🇿🇦' },
  { name: 'Suecia', flag: '🇸🇪' },
  { name: 'Suiza', flag: '🇨🇭' },
  { name: 'Túnez', flag: '🇹🇳' },
  { name: 'Turquía', flag: '🇹🇷' },
  { name: 'Uruguay', flag: '🇺🇾' },
  { name: 'Uzbekistán', flag: '🇺🇿' }
  ];

  selectedTeam: string | null = null;
  loading = false;
  showResults = false;

  selectTeam(team: string) {
    this.selectedTeam = team;
  }

  startSimulation() {
    if (!this.selectedTeam) return;
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.showResults = true;
    }, 1000);
  }

  reset() {
    this.selectedTeam = null;
    this.loading = false;
    this.showResults = false;
  }
}
