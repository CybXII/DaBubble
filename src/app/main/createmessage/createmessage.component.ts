import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Importiere FormsModule
import { CommonModule } from '@angular/common';
import { SearchService } from '../../shared/services/search.service';
import { AuthService } from '../../shared/services/auth.service';
import { SharedService } from '../../shared/services/newmessage.service';

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


  clearResults() {
    this.userResults = [];
    this.channelResults = [];
    this.privateChannelResults = [];
    this.mailadressResults = [];
  }

  clickUser(target: string, userId: string) {
    this.searchText = target;
    
    this.sharedService.setTargetString("toUser");

    this.sharedService.setSearchString(target);
    this.sharedService.setUserIdString(userId);

    this.clearResults();
  }

  clickChannel(target: string, channelId: string) {
    this.searchText = target;
    this.sharedService.setTargetString("toChannel");
    this.sharedService.setSearchString(target);
    this.sharedService.setChannelIdString(channelId);
    this.clearResults();
  }


  constructor(private searchService: SearchService, private authService: AuthService, private sharedService: SharedService) {
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

    this.sharedService.searchString$.subscribe((value) => {
      this.searchText = value;
      this.onInputChange();
    });

  }





  onInputChange() {
    console.log("ch ch changes!");
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



