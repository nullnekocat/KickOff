import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Menu } from '../menu/menu';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, MatIconModule, Menu],
  templateUrl: './ranking.html',
  styleUrl: './ranking.css'
})
export class Ranking {
  showModal = false;
}
