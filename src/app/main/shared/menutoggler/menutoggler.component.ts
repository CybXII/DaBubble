import { NgClass } from '@angular/common';
import { Component, HostListener, Input  } from '@angular/core';

@Component({
  selector: 'app-menutoggler',
  standalone: true,
  imports: [NgClass],
  templateUrl: './menutoggler.component.html',
  styleUrl: './menutoggler.component.scss'
})
export class MenutogglerComponent {
  @Input() menuState!: string;
  mobile = false;
  menuOpen = false

  /**
   * Initializes the MenutogglerComponent and calls the onResize method
   * to set the initial state for the mobile view based on the window size.
   */
  constructor (){
    this.onResize();
  }


  /**
   * Checks if the window width is below 900px and sets the mobile variable accordingly.
   * This is used to determine whether the menu should be displayed as a slide-in menu
   * or as a dropdown menu.
  */
  @HostListener('window:resize', [])
  onResize(): void {
    this.mobile = window.innerWidth <= 900;
  }
}
