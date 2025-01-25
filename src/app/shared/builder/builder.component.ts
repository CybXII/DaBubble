import { Component, HostListener } from '@angular/core';
import { MainchatComponent } from '../../main/mainchat/mainchat.component';
import { ThreadchatComponent } from '../../main/threadchat/threadchat.component';
import { MenuComponent } from '../../main/menu/menu.component';
import { MenutogglerComponent } from '../../main/shared/menutoggler/menutoggler.component';
import { slideAnimationLeft, slideAnimationRight } from './../animations';
import { CommonModule } from '@angular/common';
import { MessagesService } from '../services/messages.service';
import { StateService } from '../services/state.service';

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [MainchatComponent, ThreadchatComponent, MenuComponent, MenutogglerComponent, CommonModule],
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

    this.messagesService.threadchatState$.subscribe((state) => {
      this.threadchatState = state ? 'in' : 'out';
    });

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
      // Schließe Threadchat im mobilen Modus, wenn das Menü geöffnet wird
      if (this.threadchatOpened) {
        this.threadWasOpen = true;
        this.messagesService.closeThreadChat();
      } else {
        this.threadWasOpen = false;
      }
    } else if (this.mobile && !this.menuOpened) {
      // Wiederherstellen des Threadchats, falls er vorher geöffnet war
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
        // Schließe das Menü, wenn Threadchat im mobilen Modus geöffnet wird
        this.closeMenu();
      }
      this.threadchatOpened = true;
      setTimeout(() => {
        this.threadchatState = 'in';
      });
    }
  }

  // toggleThreadChat(): void {

  //   if (this.threadchatState === 'in') {
  //     this.threadchatState = 'out';
  //     setTimeout(() => {
  //       this.threadchatOpened = false;
  //       this.threadWasOpen = false;
  //     }, 300);
  //   } else {
  //     if (this.mobile && this.menuOpened) {
  //       // Im mobilen Modus Menü schließen, wenn Threadchat geöffnet wird
  //       this.closeMenu();
  //     }

  //     this.threadchatOpened = true;
  //     setTimeout(() => {
  //       this.threadchatState = 'in';
  //       this.threadWasOpen = true;
  //     });
  //   }
  // }

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
