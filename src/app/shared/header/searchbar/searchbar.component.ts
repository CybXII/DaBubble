import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../services/search.service';
import { TimestampToDatePipe } from '../../../pipes/timestamp-to-date.pipe';
import { AuthService } from '../../services/auth.service';
import { ChannelsService } from '../../services/channels.service';
import { UserDialogService } from '../../services/user-dialog.service';
import { MessagesService } from '../../services/messages.service';
import { doc } from 'firebase/firestore';
import { StateService } from '../../services/state.service';
import { ViewportScroller } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ProfileviewComponent } from '../../profileview/profileview.component';

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
  threadMessageResults: any[] = [];
  userResults: any[] = [];
  channelResults: any[] = [];
  privateChannelResults: any[] = [];
  isSearchActive: boolean = false;
  isSearchTouched: boolean = false;

  constructor(
    public searchService: SearchService,
    private authService: AuthService,
    private channelService: ChannelsService,
    public dialog: MatDialog,
    private userDialogService: UserDialogService,
    private messageService: MessagesService,
    private stateService: StateService,
    private viewportScroller: ViewportScroller
  ) {
    this.searchService.messageResults$.subscribe((results) => {
      this.messageResults = results;
      // console.log('Search results messages PAUL:', this.messageResults);
    });
    this.searchService.threadMessageResults$.subscribe((results) => {
      this.threadMessageResults = results;
      // console.log('Search results messages:', this.threadMessageResults);
    });
    this.searchService.userResults$.subscribe((results) => {
      this.userResults = results;
      // console.log('Search results user:', this.userResults);
    });
    this.searchService.channelResults$.subscribe((results) => {
      this.channelResults = results;
      // console.log('Search results channel:', this.channelResults);
    });
    this.searchService.privateChannelResults$.subscribe((results) => {
      this.privateChannelResults = results;
      // console.log('Search results chats:', this.privateChannelResults);
    });
  }

  onInputChange(userId: string): void {
    if (this.searchText.length == 1) {
      this.searchService.loadMessages(userId);
      this.searchService.loadThreadMessages(userId);
      this.searchService.loadUsers(this.userId);
      this.searchService.loadChannels();
    }

    this.isSearchActive = this.searchText.length >= 4;

    this.isSearchTouched = this.searchText.length > 0;

    if (this.searchText.length >= 4) {
      this.searchService.searchMessages(this.searchText, this.userId);
      this.searchService.searchThreadMessages(this.searchText);
      this.searchService.searchUsers(this.searchText, 'name');
      this.searchService.searchChannels(
        this.searchText,
        this.userId,
        'channel'
      );
      this.searchService.searchChannels(
        this.searchText,
        this.userId,
        'private'
      );
      console.log('userid searchbar', this.userId);
    }
  }

  clearSearch(): void {
    this.searchText = '';
    this.isSearchActive = false;
    this.isSearchTouched = false;
    this.messageResults = [];
    this.threadMessageResults = [];
    this.userResults = [];
    this.channelResults = [];
    this.privateChannelResults = [];
  }

  goToSearchResult(
    channelId: string | null,
    messageId: string | null,
    docId: string | null,
    userId: string | null,
    isThreadMessage: boolean | null
  ): void {
    console.log(
      'Navigating to:',
      'channelId: ',
      channelId,
      'docId: ',
      docId,
      'userId: ',
      userId,
      'isThreadMessage: ',
      isThreadMessage,
      'messageId: ',
      messageId
    );
    if (channelId && !messageId && !isThreadMessage && !docId) {
      this.channelService.selectChannel(channelId);
    } else if (channelId && messageId && !isThreadMessage && !docId) {
      this.channelService.selectChannel(channelId);
      setTimeout(() => {
        const element = document.getElementById(messageId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    } else if (channelId && messageId && isThreadMessage && docId) {
      this.channelService.selectChannel(channelId);
      this.messageService.setMessageId(messageId);
      setTimeout(() => {
        const element = document.getElementById(messageId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      setTimeout(() => {    
        this.stateService.setThreadchatState('in');
        this.messageService.loadThreadMessages(messageId);
        setTimeout(() => {
        const element = document.getElementById(docId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      }, 500);
    } else if (channelId && messageId && isThreadMessage == undefined) {
      this.channelService.selectChannel(channelId);
      this.messageService.setMessageId(messageId);
    } else if (userId !== this.userId) {
      this.openDialogUser(userId)
    }
    this.clearSearch();
  }

  openDialogUser(id: string | null): void {
    this.dialog.open(ProfileviewComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
      data: { ID: id },
    });
  }

  get userId() {
    return this.authService.userId() as string;
  }
}
