import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './ranking.html',
  styleUrl: './ranking.css'
})
export class Ranking {
  showModal = false;
}
