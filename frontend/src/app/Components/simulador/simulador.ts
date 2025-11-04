import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Pipe, PipeTransform } from '@angular/core';
import { FormsModule } from '@angular/forms';


interface Team {
  name: string;
  flag: string;
  powerBase?: number;
  offsetRange?: [number, number];
  finalPower?: number;
  points?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  totalOffset?: number; 
}

interface Match {
  teamA: Team;
  teamB: Team;
  goalsA: number;
  goalsB: number;
  winner?: Team;
  loser?: Team;
}

@Pipe({ name: 'charCodeAt', standalone: true })
export class CharCodeAtPipe implements PipeTransform {
  transform(value: string, index: number): string {
    return String.fromCharCode(65 + index);
  }
}

@Component({
  selector: 'app-simulador',
  standalone: true,
  imports: [CommonModule, MatIconModule, CharCodeAtPipe, FormsModule],
  templateUrl: './simulador.html',
  styleUrl: './simulador.css'
})
export class Simulador {
  teams: Team[] = [
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
  ].sort((a, b) => a.name.localeCompare(b.name));

  selectedTeam: string | null = null;
  loading = false;
  showResults = false;
  simulationResults: Team[] = [];
  groups: Team[][] = [];
  knockoutRounds: Team[][] = [];
  champion: Team | null = null;
  eliminatedTeams: Team[] = [];
  qualified32: any[] = [];

  //Apuesta y puntos del usuario
  userPoints: number = 2000;  // saldo inicial
  betAmount: number = 0;      // puntos apostados
  betResult: number = 0;      // resultado final
  reward: number = 0;         // ganancia o pérdida

  // Categorías base
  strongTeams = [
    'Argentina', 'Francia', 'Brasil', 'Inglaterra', 'España', 'Portugal',
    'Alemania', 'Países Bajos', 'Bélgica', 'Italia', 'Croacia'
  ];
  erraticTeams = [
    'México', 'Uruguay', 'Japón', 'Senegal', 'Suiza', 'Marruecos',
    'Polonia', 'Dinamarca', 'Colombia', 'Chile', 'Corea del Sur', 'Australia'
  ];
  weakTeams = [
    'Arabia Saudita', 'Canadá', 'Camerún', 'Costa Rica', 'Ecuador',
    'Egipto', 'Emiratos Árabes Unidos', 'EEUU', 'Ghana', 'Honduras',
    'Irán', 'Jamaica', 'Nigeria', 'Noruega', 'Nueva Zelanda',
    'Panamá', 'Paraguay', 'Qatar', 'Serbia', 'Sudáfrica',
    'Suecia', 'Túnez', 'Turquía', 'Uzbekistán', 'Argelia'
  ];

  selectTeam(team: string) {
    this.selectedTeam = team;
  }

  startSimulation() {
    if (!this.selectedTeam) return;
    if (this.betAmount <= 0 || this.betAmount > 1000) {
      alert('Ingresa una apuesta válida (1 a 1000 puntos)');
      return;
    }
    if (this.betAmount > this.userPoints) {
      alert('No tienes suficientes puntos');
      return;
    }
    this.loading = true;
    this.reward = 0;

    setTimeout(() => {
      // Calcular poder y offset base una sola vez
      this.simulationResults = this.teams.map(t => {
        let base = 50;
        let range: [number, number] = [-20, 20];

        if (this.strongTeams.includes(t.name)) {
          base = this.randomBetween(75, 95);
          range = [-30, 0];
        } else if (this.erraticTeams.includes(t.name)) {
          base = this.randomBetween(50, 70);
          range = [-25, 25];
        } else if (this.weakTeams.includes(t.name)) {
          base = this.randomBetween(40, 60);
          range = [0, 20];
        }

        const offset = this.randomBetween(range[0], range[1]);
        const totalPower = Math.max(0, Math.min(100, base + offset));

        return { ...t, powerBase: base, offsetRange: range, finalPower: totalPower, totalOffset: offset, points: 0, goalsFor: 0, goalsAgainst: 0 };
      });

      // Fase de grupos
      this.groups = this.createGroups(this.simulationResults);
      const qualified = this.playGroupStage(this.groups);

       // Guardar los 32 clasificados
      this.qualified32 = [...qualified];

      //Guardar eliminados /(16 de los 48)
      const qualifiedNames = qualified.map(t => t.name);
      this.eliminatedTeams = this.simulationResults.filter(t => !qualifiedNames.includes(t.name));

      // Fase eliminatoria usando poder + offset
      this.knockoutRounds = [];

      // Guardamos la primera ronda completa (los 32 clasificados)
      let current = [...qualified];
      this.knockoutRounds.push([...current]);

      // Jugar las rondas sucesivas (16, 8, 4, 2, 1)
      while (current.length > 1) {
        current = this.playKnockoutRound(current);
      if (current.length > 1) this.knockoutRounds.push([...current]);
      }


      this.champion = current[0];
      this.loading = false;
      this.showResults = true;
      this.calculateUserReward();

    }, 1200);
  }

  createGroups(teams: Team[]): Team[][] {
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const groups: Team[][] = [];
    for (let i = 0; i < 12; i++) groups.push(shuffled.slice(i * 4, i * 4 + 4));
    return groups;
  }

  calculateUserReward() {
    if (!this.selectedTeam || !this.champion) return;

    //Crear ranking 
    const ranking: Team[] = [];

    // 1️ Equipos eliminados en fase de grupos (33–48)
    ranking.push(...this.eliminatedTeams);

    // 2 Equipos eliminados en cada ronda eliminatoria
    for (let i = 0; i < this.knockoutRounds.length - 1; i++) {
      const current = this.knockoutRounds[i];
      const next = this.knockoutRounds[i + 1];
      const losers = current.filter(t => !next.some(n => n.name === t.name));
      ranking.push(...losers);
    }

    // 3 Subcampeón y campeón
    const finalRound = this.knockoutRounds[this.knockoutRounds.length - 1];
    if (finalRound.length === 2) {
      const [teamA, teamB] = finalRound;
      const loser = teamA.name === this.champion!.name ? teamB : teamA;
      ranking.push(loser);
    }

    ranking.push(this.champion!);

    // Buscar posición (48 = mejor, 1 = peor)
    const position = ranking.findIndex(t => t.name === this.selectedTeam) + 1;
    if (position <= 0) {
      alert("No se encontró la posición final del equipo seleccionado.");
      return;
    }

    const inversePerformance = (position - 1) / 47; 
    const gainFactor = Math.pow(inversePerformance, 2); 

    // - Perdedor (1°) => pierde (-100%)
    // - Ganador (48°) => gana 200%
    const gain = this.betAmount * (gainFactor * 3 - 1);

    //Redondear y aplicar
    this.reward = Math.round(gain);
    this.betResult = this.reward;
    this.userPoints += this.reward;

    let msg = "";
    if (this.reward > 0) {
      msg = `🎉 Tu equipo (${this.selectedTeam}) terminó en el puesto ${position}.\n` +
            `¡Ganaste ${this.reward} puntos!`;
    } else if (this.reward === 0) {
      msg = `😐 Tu equipo (${this.selectedTeam}) terminó en el puesto ${position}.\n` +
            `No ganaste ni perdiste puntos.`;
    } else {
      msg = `😞 Tu equipo (${this.selectedTeam}) terminó en el puesto ${position}.\n` +
            `Perdiste ${Math.abs(this.reward)} puntos.`;
    }

    alert(msg);
  }


  playGroupStage(groups: Team[][]): Team[] {
    const qualified: Team[] = [];
    const thirdPlaces: Team[] = [];

    for (const group of groups) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const match = this.playMatch(group[i], group[j], true);
          this.updateGroupStats(match);
        }
      }

      const sorted = group.sort(
        (a, b) => b.points! - a.points! ||
        (b.goalsFor! - b.goalsAgainst!) - (a.goalsFor! - a.goalsAgainst!)
      );

      qualified.push(sorted[0], sorted[1]);
      thirdPlaces.push(sorted[2]);
    }

    thirdPlaces.sort(
      (a, b) => b.points! - a.points! ||
      (b.goalsFor! - b.goalsAgainst!) - (a.goalsFor! - a.goalsAgainst!)
    );
    qualified.push(...thirdPlaces.slice(0, 8)); // 12*2 + 8 = 32 equipos
    return qualified;
  }

  playKnockoutRound(teams: Team[]): Team[] {
    const winners: Team[] = [];

    for (let i = 0; i < teams.length; i += 2) {
      const a = teams[i];
      const b = teams[i + 1];

      // Coherencia: usar su poder base + offset original + pequeña variación
      const adjustedA = a.finalPower! + this.randomBetween(-5, 5);
      const adjustedB = b.finalPower! + this.randomBetween(-5, 5);

      const winner = adjustedA === adjustedB
        ? (Math.random() > 0.5 ? a : b)
        : (adjustedA > adjustedB ? a : b);

      winners.push(winner);
    }

    return winners;
  }

  playMatch(teamA: Team, teamB: Team, allowDraw: boolean): Match {
    const goalsA = Math.round(this.randomBetween(0, teamA.finalPower!) / 30);
    const goalsB = Math.round(this.randomBetween(0, teamB.finalPower!) / 30);

    let winner: Team | undefined;
    let loser: Team | undefined;

    if (goalsA > goalsB) { winner = teamA; loser = teamB; }
    else if (goalsB > goalsA) { winner = teamB; loser = teamA; }
    else if (!allowDraw) {
      winner = Math.random() > 0.5 ? teamA : teamB;
      loser = winner === teamA ? teamB : teamA;
    }

    return { teamA, teamB, goalsA, goalsB, winner, loser };
  }

  updateGroupStats(match: Match) {
    const { teamA, teamB, goalsA, goalsB } = match;
    teamA.goalsFor! += goalsA;
    teamA.goalsAgainst! += goalsB;
    teamB.goalsFor! += goalsB;
    teamB.goalsAgainst! += goalsA;

    if (goalsA > goalsB) teamA.points! += 3;
    else if (goalsB > goalsA) teamB.points! += 3;
    else { teamA.points!++; teamB.points!++; }
  }

  randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  


  reset() {
    this.selectedTeam = null;
    this.loading = false;
    this.showResults = false;
    this.simulationResults = [];
    this.groups = [];
    this.knockoutRounds = [];
    this.eliminatedTeams = [];
    this.qualified32 = [];
    this.champion = null;
    this.reward = 0;
    this.betAmount = 0;
    this.betResult = 0;
  }
}
