import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Importiere FormsModule
import { SearchService } from '../../shared/services/search.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-createmessage',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './createmessage.component.html',
  styleUrl: './createmessage.component.scss'
})
export class CreatemessageComponent {

  searchText: string = '';
  userResults: any[] = [];
  channelResults: any[] = [];
  mailadressResults: any[] = [];


  constructor(private searchService: SearchService, private authService: AuthService) {
    this.searchService.loadUsers(this.userId);
    this.searchService.loadChannels();

    this.searchService.userResults$.subscribe((results) => {
      this.userResults = results;
    });

    this.searchService.channelResults$.subscribe((results) => {
      this.channelResults = results;
    });

  }


  onInputChange() {
    console.log("du schreibst was!");
    if (this.searchText[0] === "#") {
      if (this.searchText.length == 1) { //alle!
        this.searchService.searchChannels('', this.userId, 'channel');
      }
      else {
        this.searchService.searchChannels(this.searchText[1].slice(1), this.userId, 'channel');

      }
    }
    else if (this.searchText[0] === "@") {
      if (this.searchText.length == 1) { // alle!
        this.searchService.searchUsers('', 'name');
      }
      else {
        //this.searchService.searchUsers(this.searchText[1].slice(1), 'name');
      }
    }
  }


  get userId() {
    return this.authService.userId() as string;
  }

}

