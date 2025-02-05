import { NgClass } from '@angular/common';
import { Component, HostListener, Input  } from '@angular/core';

@Component({
  selector: 'app-menutoggler',
  standalone: true,   // <-- Add this line
  imports: [NgClass],
  templateUrl: './menutoggler.component.html',
  styleUrl: './menutoggler.component.scss'
})
export class MenutogglerComponent {
  @Input() menuState!: string;

  mobile = false;
  menuOpen = false

  constructor (){
    this.onResize();
  }
      
  @HostListener('window:resize', [])
  onResize(): void {
    this.mobile = window.innerWidth <= 900;
  }
}
