import { Bienvenida } from '../../Components/bienvenida/bienvenida';
import { Menu } from '../../Components/menu/menu';
import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Bienvenida, Menu, NgClass], //Menu
  templateUrl: './home.html',
  styleUrl: './home.css' 
})
export class Home {
  

}
