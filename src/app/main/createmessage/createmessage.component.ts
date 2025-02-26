import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../shared/services/search.service';
import { AuthService } from '../../shared/services/auth.service';
import { SharedService } from '../../shared/services/newmessage.service';
import { MentionService } from '../../shared/services/mention.service';

@Component({
  selector: 'app-createmessage',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './createmessage.component.html',
  styleUrl: './createmessage.component.scss',
})
export class CreatemessageComponent implements OnInit {
  searchText: string = '';
  searchFor: string = '';
  userResults: any[] = [];
  channelResults: any[] = [];
  privateChannelResults: any[] = [];
  mailadressResults: any[] = [];
  input: boolean = true;

/**
 * Constructs a new instance of the CreatemessageComponent.
 *
 * Initializes the component by loading user and channel data and sets up 
 * subscriptions to various search results and shared service observables.
 *
 * @param searchService - Service to handle search operations.
 * @param authService - Service to manage authentication operations.
 * @param sharedService - Service to manage shared data and operations.
 * @param mentionService - Service to handle mention-related operations.
 */
  constructor(
    private searchService: SearchService,
    private authService: AuthService,
    private sharedService: SharedService,
    private mentionService: MentionService,
  ) {
    this.searchService.loadUsers(this.userId);
    this.searchService.loadChannels();
    this.searchService.userResults$.subscribe((results) => {this.userResults = results;});
    this.searchService.channelResults$.subscribe((results) => {this.channelResults = results;});
    this.searchService.privateChannelResults$.subscribe((results) => {this.privateChannelResults = results;});
    this.sharedService.searchString$.subscribe((value) => {
      this.searchText = value;
      this.onInputChange();
    });
  }


/**
 * Initializes the component by clearing existing search results and deleting any saved search data.
 */
  ngOnInit() {
    this.clearResults();
    this.deleteSearch();
  }


  /**
   * Clears all search results and resets the component's results arrays to empty arrays.
   * This method is called when the component is initialized and when the search input field is cleared.
   */
  clearResults() {
    this.userResults = [];
    this.channelResults = [];
    this.privateChannelResults = [];
    this.mailadressResults = [];
  }


/**
 * Handles a click event on a user result.
 * 
 * Updates the search text with the selected user's target string and sets relevant
 * shared service values for targeting a user. Inserts the target text into the 
 * message box and focuses it. Clears existing search results.
 *
 * @param {string} target - The target string for the clicked user.
 * @param {string} userId - The user ID of the clicked user.
 */
  clickUser(target: string, userId: string) {
    this.searchText = target;
    this.sharedService.setTargetString('toUser');
    this.sharedService.setSearchString(target);
    this.sharedService.setUserIdString(userId);
    this.input = false;
    this.mentionService.insertTextAndFocus(target, 'messagebox')
    this.clearResults();
  }


/**
 * Handles a click event on a channel result.
 * 
 * Updates the search text with the selected channel's target string and sets relevant
 * shared service values for targeting a channel. Clears existing search results.
 *
 * @param {string} target - The target string for the clicked channel.
 * @param {string} channelId - The ID of the clicked channel.
 */
  clickChannel(target: string, channelId: string) {
    this.searchText = target;
    this.sharedService.setTargetString('toChannel');
    this.sharedService.setSearchString(target);
    this.sharedService.setChannelIdString(channelId);
    this.input = false;
    let endTarget = this.mentionService.removeFirstCharacter(target);
    this.mentionService.insertTextAndFocus(endTarget, 'messagebox');
    this.clearResults();
  }


/**
 * Handles input changes in the search bar.
 * 
 * Starts a search for channels if the first character is '#', for users if the first
 * character is '@', and for a default search otherwise.
 */
  onInputChange() {
    if (this.searchText[0] === '#') {
      this.startChannelSearch();
    } else if (this.searchText[0] === '@') {
      this.startUsersSearch();
    }
    else {
      this.startDefaultSearch();
    }
  }


/**
 * Initiates a search for channels based on the current search text.
 * 
 * If the search text length is 1, it triggers a search for all public channels the user is a member of.
 * Otherwise, it searches for channels with names matching the search text (excluding the initial character).
 */
  startChannelSearch() {
      this.searchFor = 'channels';
      if (this.searchText.length == 1) {
        this.searchService.searchChannels('', this.userId, 'channel');
      } else {
        this.searchService.searchChannels(this.searchText.slice(1),this.userId,'channel');
      }
  }


  /**
   * Initiates a search for users based on the current search text.
   * 
   * If the search text length is 1, it triggers a search for all users.
   * Otherwise, it searches for users with names matching the search text (excluding the initial character).
   */
  startUsersSearch() {
    this.searchFor = 'users';
    if (this.searchText.length == 1) {
      this.searchService.searchUsers('', 'name');
    } else {
      this.searchService.searchUsers(this.searchText.slice(1), 'name');
    }
  }


  /**
   * Initiates a search for users based on the current search text.
   * 
   * If the search text length is 0, it triggers a search for all users.
   * Otherwise, it searches for users with emails matching the search text.
   */
  startDefaultSearch() {
    this.searchFor = 'users';
    if (this.searchText.length == 0) {
      this.searchService.searchUsers('', 'email');
    } else {
      this.searchService.searchUsers(this.searchText, 'email');
    }
  }


  /**
   * The user ID of the currently signed-in user.
   * 
   * @returns The user ID of the currently signed-in user.
   */
  get userId() {
    return this.authService.userId() as string;
  }


  /**
   * Deletes the current search input and resets the state of the search box.
   * 
   * This method is called when the user clicks the "X" button in the search box.
   * It resets the state of the search box, clears the search input, and removes
   * any search results that may be currently displayed.
   */
  deleteSearch() {
    this.input = true;
    this.searchText = '';
    this.mentionService.clearInput('messagebox')
  }
}