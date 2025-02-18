import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../services/search.service';
import { TimestampToDatePipe } from '../../../pipes/timestamp-to-date.pipe';
import { AuthService } from '../../services/auth.service';
import { ChannelsService } from '../../services/channels.service';
import { MessagesService } from '../../services/messages.service';
import { StateService } from '../../services/state.service';
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

  /**
   * The constructor for the SearchbarComponent class.
   * It sets up the class properties from the injected services and sets up subscriptions to the
   * search results.
   * @param searchService The injected SearchService service.
   * @param authService The injected AuthService service.
   * @param channelService The injected ChannelsService service.
   * @param dialog The injected MatDialog service.
   * @param messageService The injected MessagesService service.
   * @param stateService The injected StateService service.
   */
  constructor(
    public searchService: SearchService,
    private authService: AuthService,
    private channelService: ChannelsService,
    public dialog: MatDialog,
    private messageService: MessagesService,
    private stateService: StateService,
  ) {
    this.searchService.messageResults$.subscribe((results) => {this.messageResults = results});
    this.searchService.threadMessageResults$.subscribe((results) => {this.threadMessageResults = results});
    this.searchService.userResults$.subscribe((results) => {this.userResults = results});
    this.searchService.channelResults$.subscribe((results) => {this.channelResults = results});
    this.searchService.privateChannelResults$.subscribe((results) => {this.privateChannelResults = results});
  }

  
  /**
   * Handles input changes for the search bar.
   * 
   * This method loads initial data when the search text length is 1 and triggers searches
   * when the search text length is 4 or more. It updates the state of search activity and 
   * whether the search has been touched based on the length of the search text.
   * 
   * @param {string} userId - The user ID required for loading and searching data.
   */
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
      this.searchService.searchMessages(this.searchText);
      this.searchService.searchThreadMessages(this.searchText);
      this.searchService.searchChannels(this.searchText,this.userId,'private');
      this.searchService.searchChannels(this.searchText,this.userId,'channels');
      this.searchService.searchUsers(this.searchText, 'name');
    }
    if (this.searchText[0] == '@'){
      this.searchService.searchUsers(this.searchText.replace('@', ''), 'name');
    }
    if (this.searchText[0] == '#'){
      this.searchService.searchChannels(this.searchText.replace('#',''),this.userId,'channel');
      this.searchService.searchChannels(this.searchText.replace('#',''),this.userId,'private');
    }
  }


  /**
   * Clears the search input field and resets all related search state variables and results.
   * This sets the search text to an empty string, deactivates the search, and clears 
   * all message, thread message, user, channel, and private channel results.
   */
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


  /**
   * Navigate to the selected search result. The selection is determined by the input parameters.
   * @param channelId The id of the channel the message is in.
   * @param messageId The id of the message.
   * @param docId The id of the thread message.
   * @param userId The id of the user.
   * @param isThreadMessage Whether the message is a thread message.
   */
  goToSearchResult(channelId: string | null,messageId: string | null,docId: string 
  | null,userId: string | null,isThreadMessage: boolean | null): void {
    if (channelId && !messageId && !isThreadMessage && !docId) {
      this.handleChannelSelection(channelId);
    } else if (channelId && messageId && !isThreadMessage && !docId) {
      this.handleMessageSelection(channelId, messageId);
    } else if (channelId && messageId && isThreadMessage && docId) {
      this.handleThreadMessageSelection(channelId, messageId, docId);
    } else if (channelId && messageId && isThreadMessage == undefined) {
      this.handleDirectMessageSelection(channelId, messageId);
    } else if (userId !== this.userId) {
      this.openDialogUser(userId);
    }
    this.clearSearch();
  }


  /**
   * Selects a channel based on the provided channel ID.
   * 
   * @param {string} channelId - The ID of the channel to select.
   */
  private handleChannelSelection(channelId: string): void {
    this.channelService.selectChannel(channelId);
  }


  /**
   * Selects a channel and scrolls to a specific message.
   * 
   * @param {string} channelId - The ID of the channel to select.
   * @param {string} messageId - The ID of the message to scroll to.
   */
  private handleMessageSelection(channelId: string, messageId: string): void {
    this.channelService.selectChannel(channelId);
    setTimeout(() => this.scrollToMessage(messageId), 500);
  }


  /**
   * Selects a channel, sets the message ID, and opens the thread chat.
   * 
   * @param {string} channelId - The ID of the channel.
   * @param {string} messageId - The ID of the message.
   * @param {string} docId - The ID of the document (thread message).
   */
  private handleThreadMessageSelection(channelId: string, messageId: string, docId: string): void {
    this.channelService.selectChannel(channelId);
    this.messageService.setMessageId(messageId);
    setTimeout(() => {
      this.scrollToMessage(messageId);
      this.openThreadChat(messageId, docId);
    }, 500);
  }


  /**
   * Opens the thread chat and scrolls to the thread message.
   * 
   * @param {string} messageId - The ID of the parent message.
   * @param {string} docId - The ID of the thread message.
   */
  private openThreadChat(messageId: string, docId: string): void {
    this.stateService.setThreadchatState('in');
    this.messageService.loadThreadMessages(messageId);
    setTimeout(() => this.scrollToMessage(docId), 500);
  }


  /**
   * Selects a channel and sets the active message ID.
   * 
   * @param {string} channelId - The ID of the channel.
   * @param {string} messageId - The ID of the message.
   */
  private handleDirectMessageSelection(channelId: string, messageId: string): void {
    this.channelService.selectChannel(channelId);
    this.messageService.setMessageId(messageId);
  }


  /**
   * Scrolls to a message in the DOM smoothly.
   * 
   * @param {string} messageId - The ID of the message to scroll to.
   */
  private scrollToMessage(messageId: string): void {
    const element = document.getElementById(messageId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }


  /**
   * Opens the user profile dialog with the given user ID.
   * @param {string | null} id - The ID of the user to open the profile dialog for.
   */
  openDialogUser(id: string | null): void {
    this.dialog.open(ProfileviewComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
      data: { ID: id },
    });
  }


  /**
   * Liefert die aktuelle User-ID
   * @returns Die ID des aktuellen Benutzers.
   */
  get userId() {
    return this.authService.userId() as string;
  }
}
