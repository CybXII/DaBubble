import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../services/search.service';
import { TimestampToDatePipe } from '../../../pipes/timestamp-to-date.pipe';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [CommonModule, FormsModule, TimestampToDatePipe],
  templateUrl: './searchbar.component.html',
  styleUrl: './searchbar.component.scss',
})
export class SearchbarComponent {
  messageResultsActive = false;
  searchText: string = '';
  messageResults: any[] = [];
  userResults: any[] = [];
  channelResults: any[] = [];
  privateChannelResults: any[] = [];
  isSearchActive: boolean = false;
  isSearchTouched: boolean = false;

  constructor(private searchService: SearchService, private authService: AuthService) {
    this.searchService.messageResults$.subscribe((results) => {
      this.messageResults = results;
      console.log('Search results messages:', this.messageResults);
    });
    this.searchService.userResults$.subscribe((results) => {
      this.userResults = results;
      console.log('Search results user:', this.userResults);
    });
    this.searchService.channelResults$.subscribe((results) => {
      this.channelResults = results;
      console.log('Search results channel:', this.channelResults);
    });
    this.searchService.privateChannelResults$.subscribe((results) => {
      this.privateChannelResults = results;
      console.log('Search results chats:', this.privateChannelResults);
    });
  }

  onInputChange(): void {
    if (this.searchText.length == 1) {
      this.searchService.loadMessages();
      this.searchService.loadUsers();
      this.searchService.loadChannels();
    }

    this.isSearchActive = this.searchText.length >= 4;

    this.isSearchTouched = this.searchText.length > 0;

    if (this.searchText.length >= 4) {
      this.searchService.searchMessages(this.searchText, this.userId);
      this.searchService.searchUsers(this.searchText);
      this.searchService.searchChannels(this.searchText, this.userId);
      console.log('userid searchbar',this.userId);
      
      this.searchService.searchPrivateChannels(this.searchText, this.userId);
    }
  }

  clearSearch(): void {
    this.searchText = '';
    this.isSearchActive = false;
    this.isSearchTouched = false;
    this.messageResults = [];
    this.userResults = [];
    this.channelResults = [];
    this.privateChannelResults = [];
  }

  goToSearchResult(
    channelId: string | null,
    docId: string | null,
    userId: string | null
  ): void {
    console.log(
      'Navigating to:',
      'channelId: ',
      channelId,
      'docId: ',
      docId,
      'userId: ',
      userId
    );
    alert('Zu früh gefreut, ist noch nicht fertig!');
    this.clearSearch();
  }

  get userId() {
    return this.authService.userId() as string;
  }

  logUserId() {
    console.log(this.userId);
  }
}