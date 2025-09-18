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
    { name: 'Argentina', flag: '🇦🇷' },
    { name: 'Brasil', flag: '🇧🇷' },
    { name: 'Francia', flag: '🇫🇷' },
    { name: 'Alemania', flag: '🇩🇪' },
    { name: 'España', flag: '🇪🇸' },
    { name: 'Inglaterra', flag: '🇬🇧' },
    { name: 'México', flag: '🇲🇽' },
    { name: 'EEUU', flag: '🇺🇸' },
    { name: 'Japón', flag: '🇯🇵' },
    { name: 'Portugal', flag: '🇵🇹' },
    { name: 'Países Bajos', flag: '🇳🇱' },
    { name: 'Italia', flag: '🇮🇹' }
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
