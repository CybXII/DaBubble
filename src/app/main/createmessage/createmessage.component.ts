import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Importiere FormsModule
import { CommonModule } from '@angular/common';
import { SearchService } from '../../shared/services/search.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-createmessage',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './createmessage.component.html',
  styleUrl: './createmessage.component.scss'
})
export class CreatemessageComponent {

  searchText: string = '';
  searchFor: string = '';

  userResults: any[] = [];
  channelResults: any[] = [];
  privateChannelResults: any[] = [];
  mailadressResults: any[] = [];

  click() {

  }

  constructor(private searchService: SearchService, private authService: AuthService) {
    this.searchService.loadUsers(this.userId);
    this.searchService.loadChannels();

    this.searchService.userResults$.subscribe((results) => {
      console.log('Search results user komp:', this.userResults);
      this.userResults = results;
    });

    this.searchService.channelResults$.subscribe((results) => {
      console.log('Search results channel komp:', this.channelResults);
      this.channelResults = results;
    });

    this.searchService.privateChannelResults$.subscribe((results) => {
      this.privateChannelResults = results;
      console.log('Search results priv channel komp:', this.privateChannelResults);
    });

  }


  onInputChange() {
    //console.log("du schreibst was!");
    if (this.searchText[0] === "#") {
      this.searchFor = "channels";
      if (this.searchText.length == 1) {
        //alle!
        this.searchService.searchChannels('', this.userId, 'channel');
      } else {
        // filtern
        this.searchService.searchChannels(this.searchText.slice(1), this.userId, 'channel');
      }
    }
    else if (this.searchText[0] === "@") {
      this.searchFor = "users";
      if (this.searchText.length == 1) {
        //alle!
        this.searchService.searchUsers('', 'name');
      } else {
        // filtern
        this.searchService.searchUsers(this.searchText.slice(1), 'name');
      }
    }
    // ohne "vorzeichen"
    else {
      this.searchFor = "users";
      if (this.searchText.length == 0) {
        //alle!
        this.searchService.searchUsers('', 'email');
      } else {
        // filtern
        this.searchService.searchUsers(this.searchText, 'email');
      }
    }
  }




  get userId() {
    return this.authService.userId() as string;
  }

}

