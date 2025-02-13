import { Component, HostListener } from '@angular/core';
import { SharedService } from '../../../shared/services/newmessage.service';
import { } from '@ctrl/ngx-emoji-mart';
import { SearchbarComponent } from '../../../shared/header/searchbar/searchbar.component';
import { StateService } from '../../../shared/services/state.service';


@Component({
  selector: 'app-menu-header',
  imports: [SearchbarComponent],
  standalone: true,   // <-- Add this line
  templateUrl: './menu-header.component.html',
  styleUrl: './menu-header.component.scss'
})
export class MenuHeaderComponent {
  smallWindow = false;
  mobile = false;



  constructor(private sharedService: SharedService, private stateService: StateService) {
    this.onResize();

  }

  @HostListener('window:resize', [])
  onResize(): void {
    this.smallWindow = window.innerWidth <= 1400;
    this.mobile = window.innerWidth <= 900;
  }

  createNewMessage() {
    console.log("createnewmessage klicked");
    
    // mainchat updaten
    this.sharedService.updateVariable('createMessagePressed');
    // falls thread ausgeklappt - einklappen
    this.stateService.setThreadchatState("out");

  }



}
