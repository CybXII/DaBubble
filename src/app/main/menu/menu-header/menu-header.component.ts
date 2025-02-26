import { Component, HostListener } from '@angular/core';
import { SharedService } from '../../../shared/services/newmessage.service';
import { SearchbarComponent } from '../../../shared/header/searchbar/searchbar.component';
import { StateService } from '../../../shared/services/state.service';


@Component({
  selector: 'app-menu-header',
  imports: [SearchbarComponent],
  standalone: true, 
  templateUrl: './menu-header.component.html',
  styleUrl: './menu-header.component.scss'
})
export class MenuHeaderComponent {
  smallWindow = false;
  mobile = false;

  /**
   * The constructor for the MenuHeaderComponent class.
   * It sets the currentUrl property to the current route, and calls the onResize method.
   * @param sharedService The injected SharedService service.
   * @param stateService The injected StateService service.
   */
  constructor(private sharedService: SharedService, private stateService: StateService) {
    this.onResize();
  }

  /**
   * Handles window resize events.
   * When the window width is less than 1400px, the chat and menu are stacked vertically.
   * When the window width is less than 900px, the menu is closed and the chat is full width.
   * The boolean properties `smallWindow` and `mobile` are updated accordingly.
  */
  @HostListener('window:resize', [])
  onResize(): void {
    this.smallWindow = window.innerWidth <= 1400;
    this.mobile = window.innerWidth <= 900;
  }

  /**
   * Toggles the menu state between 'in' and 'out'.
   * If the screen is narrow (mobile) and the menu is opened, the thread chat is closed.
   * If the screen is narrow (mobile) and the menu is closed, the thread chat is opened if it was open before.
   */
  createNewMessage() {
    this.sharedService.updateVariable('createMessagePressed');
    this.stateService.setThreadchatState("out");
  }
}
