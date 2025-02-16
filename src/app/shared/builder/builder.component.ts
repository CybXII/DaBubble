import { Component, HostListener } from '@angular/core';
import { MenuComponent } from '../../main/menu/menu.component';
import { MenutogglerComponent } from '../../main/shared/menutoggler/menutoggler.component';
import { slideAnimationLeft, slideAnimationRight } from './../animations';
import { CommonModule } from '@angular/common';
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
  threadchatState = 'out';
  menuState = 'in';
  threadchatOpened = false;
  threadWasOpen = false;
  smallWindow = false;
  menuOpened = true;
  mobile = true;

  /**
   * Constructs a new instance of the BuilderComponent.
   *
   * @param stateService The service used to manage the state of the thread chat.
   */
  constructor( private stateService: StateService) {}

  
  @HostListener('window:resize', [])
  /**
   * Handles window resize events.
   * When the window width is less than 1400px, the chat and menu are stacked vertically.
   * When the window width is less than 900px, the menu is closed and the chat is full width.
   * When the window width is greater than 900px and previously was less than 900px, the menu is opened.
   */
  onResize(): void {
    const wasMobile = this.mobile;
    this.smallWindow = window.innerWidth <= 1400;
    this.mobile = window.innerWidth <= 900;
    if (this.mobile && !wasMobile)
      this.closeMenu();
    else if (!this.mobile && wasMobile) 
      this.menuOpened = true;
  }


  /**
   * Initializes the component by calling the onResize method, and subscribing to the menuState and threadchatState observables.
   * When the menuState or threadchatState changes, the corresponding boolean property is updated.
   */
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


  /**
   * Toggles the menu state between 'in' and 'out'.
   * If the screen is narrow (mobile) and the menu is opened, the thread chat is closed.
   * If the screen is narrow (mobile) and the menu is closed, the thread chat is opened if it was open before.
   */
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


  /**
   * Toggles the thread chat state between 'in' and 'out'. 
   * If the thread chat is opened and the screen is narrow (mobile), the menu is closed first.
   * The boolean property threadchatOpened is updated after a short delay to ensure the animation is completed.
   */
  toggleThreadChat(): void {
    if (this.threadchatState === 'in') {
      this.threadchatState = 'out';
      setTimeout(() => {this.threadchatOpened = false;}, 300);
    } else {
      if (this.mobile && this.menuOpened) 
        this.closeMenu();
      this.threadchatOpened = true;
      setTimeout(() => {this.threadchatState = 'in';});
    }
  }


  /**
   * Closes the menu by setting menuState to 'out' and after a short delay sets the menuOpened boolean to false.
   * The menuOpened boolean is set after a short delay to ensure the animation is completed.
   */
  closeMenu(): void {
    this.menuState = 'out';
    setTimeout(() => {
      this.menuOpened = false;
    }, 300);
  }


  /**
   * Updates the menuOpened and threadchatOpened boolean properties based on the completed animation state.
   * The onAnimationDone function is called when the animation is complete and the value of the 'toState' property is either 'in' or 'out'.
   * If the 'toState' property is 'in', the respective boolean is set to true, otherwise it is set to false.
   * @param event - The animation event.
   * @param type - The type of the animation, either 'menu' or 'threadchat'.
   */
  onAnimationDone(event: any, type: string): void {
    if (event.toState === 'in') {
      if (type === 'menu') 
        this.menuOpened = true;
      if (type === 'threadchat') 
        this.threadchatOpened = true;
    } else if (event.toState === 'out') {
      if (type === 'menu') 
        this.menuOpened = false;
      if (type === 'threadchat') 
        this.threadchatOpened = false;
    }
  }
}
