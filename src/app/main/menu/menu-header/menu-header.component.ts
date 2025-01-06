import { Component} from '@angular/core';
import { SharedService } from '../../../shared/services/newmessage.service';


@Component({
  selector: 'app-menu-header',
  imports: [],
  standalone: true,   // <-- Add this line
  templateUrl: './menu-header.component.html',
  styleUrl: './menu-header.component.scss'
})
export class MenuHeaderComponent {



  constructor(private sharedService: SharedService) {

  }



  selectNewMessage() {
    console.log("new message pressed");
    // mainchat updaten
    this.sharedService.updateVariable('newMessagePressed');
    console.log(this.sharedService.updateVariable);
    

  }



}
