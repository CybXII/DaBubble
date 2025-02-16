import { Component, HostListener } from '@angular/core';
import { MenuHeaderComponent } from './menu-header/menu-header.component';
import { MenuChannelsComponent } from './menu-channels/menu-channels.component';
import { MenuPrivateMessagesComponent } from './menu-private-messages/menu-private-messages.component';
import { SearchbarComponent } from "../../shared/header/searchbar/searchbar.component";
import { SharedService } from '../../shared/services/newmessage.service';
import { StateService } from '../../shared/services/state.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [MenuHeaderComponent, MenuChannelsComponent, MenuPrivateMessagesComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {

  /**
   * The constructor for the MenuComponent class.
   * It injects the SharedService and StateService services.
   * @param sharedService The injected SharedService service.
   * @param stateService The injected StateService service.
   */
  constructor(private sharedService: SharedService, private stateService: StateService) {}

  /**
   * Creates a new message.
   * Sets the state of the menu to 'out' and notifies the shared service
   * that the create message button was pressed.
   */
  createNewMessage() {
    this.sharedService.updateVariable('createMessagePressed');
    this.stateService.setMenuState("out");
  }
}
