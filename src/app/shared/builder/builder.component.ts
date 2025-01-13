import { Component, HostListener } from '@angular/core';
import { MainchatComponent } from '../../main/mainchat/mainchat.component';
import { ThreadchatComponent } from '../../main/threadchat/threadchat.component';
import { MenuComponent } from '../../main/menu/menu.component';
import { MenutogglerComponent } from '../../main/shared/menutoggler/menutoggler.component';
import { slideAnimationLeft, slideAnimationRight } from './../animations';
import { CommonModule } from '@angular/common';
import { MessagesService } from '../services/messages.service';

@Component({
  selector: 'app-builder',
  standalone: true,   // <-- Add this line
  imports: [MainchatComponent, ThreadchatComponent,MenuComponent, MenutogglerComponent, CommonModule],
  templateUrl: './builder.component.html',
  styleUrl: './builder.component.scss',
  animations: [slideAnimationRight, slideAnimationLeft]
})
export class BuilderComponent {
  builder: string[] = ["menu", "mainchat", "threadchat"];
  menuOpened = true;
  threadchatOpened = false;
  menuState = 'in';
  threadchatState = 'out';
  isMobile = false;
  
  

  constructor(private messagesService: MessagesService) {}

  
  @HostListener('window:resize', [])
  onResize(): void {
    this.isMobile = window.innerWidth <= 1400;
  }


  ngOnInit(): void {
    this.onResize(); // Initial prüfen, ob mobil oder Desktop

    this.messagesService.threadchatState$.subscribe((state) => {
      this.threadchatState = state ? 'in' : 'out';
      if (this.isMobile) {
        this.menuOpened = !state; // Menü ausblenden, wenn Threadchat offen ist
      }
    });
  }


  toggleMenu() {
    if (this.menuState === 'in') {
      this.menuState = 'out';
      setTimeout(() => {
        this.menuOpened = false;
      }, 300);
    } else {
      this.menuOpened = true;
      setTimeout(() => {
        this.menuState = 'in';
      });
    }
  }
  
  toggleThreadChat(): void {
    if (this.threadchatState === 'in') {
      this.threadchatState = 'out';
      setTimeout(() => {
        this.threadchatOpened = false;
        if (this.isMobile) {
          this.menuOpened = true;
        }
      }, 300);
    } else {
      this.threadchatOpened = true;
      if (this.isMobile) {
        this.menuOpened = false; // Menü ausblenden
      }
      setTimeout(() => {
        this.threadchatState = 'in';
      });
    }
  }

  toggleThreadChatOnMessageSelect(): void {
    this.threadchatOpened = true;
    this.threadchatState = 'in';
  }

  onAnimationDone(event: any, type: string) {
    if (event.toState === 'in') {
      if (type === 'menu') {
        this.menuOpened = true;
      }
      if (type === 'threadchat') {
        this.threadchatOpened = true;
      }
    }
    else if(event.toState === 'out') {
      if (type === 'menu') {
        this.menuOpened = false;
      }
      if (type === 'threadchat') {
        this.threadchatOpened = false;
      }
    }
  }

  shouldHideMainChat(): boolean {
    return this.isMobile && this.threadchatOpened;
  }
}
