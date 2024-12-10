import { Component } from '@angular/core';
import { MainchatComponent } from '../../main/mainchat/mainchat.component';
import { ThreadchatComponent } from '../../main/threadchat/threadchat.component';
import { MenuComponent } from '../../main/menu/menu.component';
import { MenutogglerComponent } from '../../main/shared/menutoggler/menutoggler.component';
import { slideAnimationLeft, slideAnimationRight } from './../animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-builder',
  imports: [MainchatComponent, ThreadchatComponent,MenuComponent, MenutogglerComponent, CommonModule],
  templateUrl: './builder.component.html',
  styleUrl: './builder.component.scss',
  animations: [slideAnimationRight, slideAnimationLeft]
})
export class BuilderComponent {
  builder: string[] = ["menu", "mainchat", "threadchat"];
  menuOpened = true;
  threadchatOpened = true;
  menuState = 'in'; // Initialzustand
  threadchatState = 'in';

  toggleMenu() {
    if (this.menuState === 'in') {
      this.menuState = 'out'; // Von "in" zu "out"
      setTimeout(() => {
        this.menuOpened = false; // Element nach Animation ausblenden
      }, 300); // Animationsdauer
    } else {
      this.menuOpened = true; // Element einblenden
      setTimeout(() => {
        this.menuState = 'in'; // Animation rückwärts abspielen
      });
    }
  }
  
  toggleThreadChat() {
    if (this.threadchatState === 'in') {
      this.threadchatState = 'out'; // Von "in" zu "out"
      setTimeout(() => {
        this.threadchatOpened = false; // Element nach Animation ausblenden
      }, 300); // Animationsdauer
    } else {
      this.threadchatOpened = true; // Element einblenden
      setTimeout(() => {
        this.threadchatState = 'in'; // Animation rückwärts abspielen
      });
    }
  }

  onAnimationDone(event: any, type: string) {
    if (event.toState === 'in') {
      if (type === 'menu') {
        this.menuOpened = true; // Steuerung über die `@if`-Bedingung
      }
      if (type === 'threadchat') {
        this.threadchatOpened = true;
      }
    }
    else if(event.toState === 'out') {
      if (type === 'menu') {
        this.menuOpened = false; // Steuerung über die `@if`-Bedingung
      }
      if (type === 'threadchat') {
        this.threadchatOpened = false;
      }
    }
  
  }
}
