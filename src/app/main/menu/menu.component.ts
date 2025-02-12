import { Component, HostListener } from '@angular/core';
import { MenuHeaderComponent } from './menu-header/menu-header.component';
import { MenuChannelsComponent } from './menu-channels/menu-channels.component';
import { MenuPrivateMessagesComponent } from './menu-private-messages/menu-private-messages.component';
import { SearchbarComponent } from "../../shared/header/searchbar/searchbar.component";
import { SharedService } from '../../shared/services/newmessage.service';


@Component({
  selector: 'app-menu',
  standalone: true,   // <-- Add this line
  imports: [MenuHeaderComponent, MenuChannelsComponent, MenuPrivateMessagesComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {


  constructor(private sharedService: SharedService){}

  createNewMessage()
  {
    this.sharedService.updateVariable('createMessagePressed');
    console.log("create Message Pressed");
    // menü togglen ...
  }

}
