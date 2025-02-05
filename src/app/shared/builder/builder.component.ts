import { Component, HostListener } from '@angular/core';
import { MenuComponent } from '../../main/menu/menu.component';
import { MenutogglerComponent } from '../../main/shared/menutoggler/menutoggler.component';
import { slideAnimationLeft, slideAnimationRight } from './../animations';
import { CommonModule } from '@angular/common';
import { MessagesService } from '../services/messages.service';
import { StateService } from '../services/state.service';
import { ChatComponent } from '../../main/chat/chat.component';

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [ChatComponent, MenuComponent, MenutogglerComponent, CommonModule],
  templateUrl: './builder.component.html',
  styleUrls: ['./builder.component.scss'],
  animations: [slideAnimationRight, slideAnimationLeft],
})
export class BuilderComponent {
  builder: string[] = ['menu', 'mainchat', 'threadchat'];
  menuOpened = true;
  threadchatOpened = false;
  menuState = 'in';
  threadchatState = 'out';
  smallWindow = false;
  mobile = true;
  threadWasOpen = false;
  constructor(private messagesService: MessagesService, private stateService: StateService) {}

  @HostListener('window:resize', [])
onResize(): void {
  const wasMobile = this.mobile;
  this.smallWindow = window.innerWidth <= 1400;
  this.mobile = window.innerWidth <= 900;

  if (this.mobile && !wasMobile) {
    this.closeMenu();
    } else if (!this.mobile && wasMobile) {
    this.menuOpened = true;
  }
}

  ngOnInit(): void {
    this.onResize();

    this.stateService.menuState$.subscribe((state) => {
      this.menuState = state;
      this.menuOpened = state === 'in';
    });

    this.stateService.threadchatState$.subscribe((state) => {
      this.threadchatState = state;
      this.threadchatOpened = state === 'in';
    });
  }

  toggleMenu(): void {
    this.menuState = this.menuState === 'in' ? 'out' : 'in';
    this.menuOpened = this.menuState === 'in';
  
    if (this.mobile && this.menuOpened) {
      if (this.threadchatOpened) {
        this.threadWasOpen = true;
        this.stateService.setThreadchatState('out');
      } else {
        this.threadWasOpen = false;
      }
    } else if (this.mobile && !this.menuOpened) {
      if (this.threadWasOpen) {
        this.toggleThreadChat();
      }
    }
  }

  toggleThreadChat(): void {
    if (this.threadchatState === 'in') {
      this.threadchatState = 'out';
      setTimeout(() => {
        this.threadchatOpened = false;
      }, 300);
    } else {
      if (this.mobile && this.menuOpened) {
        this.closeMenu();
      }
      this.threadchatOpened = true;
      setTimeout(() => {
        this.threadchatState = 'in';
      });
    }
  }


  closeMenu(): void {
    this.menuState = 'out';
    setTimeout(() => {
      this.menuOpened = false;
    }, 300);
  }


  onAnimationDone(event: any, type: string): void {
    if (event.toState === 'in') {
      if (type === 'menu') {
        this.menuOpened = true;
      }
      if (type === 'threadchat') {
        this.threadchatOpened = true;
      }
    } else if (event.toState === 'out') {
      if (type === 'menu') {
        this.menuOpened = false;
      }
      if (type === 'threadchat') {
        this.threadchatOpened = false;
      }
    }
  }
}
