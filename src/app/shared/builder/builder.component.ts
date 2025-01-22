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

  constructor(private messagesService: MessagesService) {}

  @HostListener('window:resize', [])
onResize(): void {
  const wasMobile = this.mobile;
  this.smallWindow = window.innerWidth <= 1400;
  this.mobile = window.innerWidth <= 900;

  if (this.mobile && !wasMobile) {
    // Wenn wir in den Mobile-Modus wechseln, Menü schließen
    this.menuOpened = false;
  } else if (!this.mobile && wasMobile) {
    // Wenn wir den Mobile-Modus verlassen, Menü wieder öffnen
    this.menuOpened = true;
  }
}

  ngOnInit(): void {
    this.onResize();

    this.messagesService.threadchatState$.subscribe((state) => {
      this.threadchatState = state ? 'in' : 'out';
    });
  }

  toggleMenu(): void {
    this.menuState = this.menuState === 'in' ? 'out' : 'in';
    this.menuOpened = this.menuState === 'in';
  
    // Mobile Logik: Schließe Threadchat, wenn Menü geöffnet wird
    if (this.mobile && this.menuOpened) {
      this.threadchatOpened = false;
      this.threadchatState = 'out';
    }
  }
  
  // toggleThreadChat(): void {
  //   if (this.threadchatState === 'in') {
  //     this.threadchatState = 'out';
  //     setTimeout(() => {
  //       this.threadchatOpened = false;
  //     }, 300);
  //   } else {
  //     this.threadchatOpened = true;
  //     setTimeout(() => {
  //       this.threadchatState = 'in';
  //     });
  //   }
  // }

  toggleThreadChat(): void {

    if (this.threadchatState === 'in') {
      this.threadchatState = 'out';
      setTimeout(() => {
        this.threadchatOpened = false;
      }, 300);
    } else {
      if (this.mobile && this.menuOpened) {
        // Im mobilen Modus Menü schließen, wenn Threadchat geöffnet wird
        // this.closeMenu();
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

  shouldRenderMenu(): boolean {
    return this.menuOpened || !this.smallWindow;
  }
  
  shouldRenderMainChat(): boolean {
    if (this.mobile){
      return !this.menuOpened && !this.threadchatOpened
    } else if (this.smallWindow && !this.threadchatOpened){
      return true;
    }
    else {
      return true
    }
  }
  
  shouldRenderThreadChat(): boolean {
    if (!this.mobile){
      return true}
    else 
      return this.threadchatOpened;
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
