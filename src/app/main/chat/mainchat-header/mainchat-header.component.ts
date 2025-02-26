import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ChannelsService } from '../../../shared/services/channels.service';
import { Channel } from '../../../models/channel';
import { Observable, Subscription, map, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../shared/services/auth.service';
import { MenuDialogComponent } from "../../../shared/menu-dialog/menu-dialog.component";
import { ChangeDetectorRef } from '@angular/core';
import { CustomUser, UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-mainchat-header',
  imports: [CommonModule, MenuDialogComponent],
  standalone: true,
  templateUrl: './mainchat-header.component.html',
  styleUrl: './mainchat-header.component.scss'
})
export class MainchatHeaderComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  channel$: Observable<Channel | null>;
  usersArray$: Observable<CustomUser[]> | undefined;
  convPartner$: Observable<string> = new Observable<string>(obs => obs.next(''));
  conversationName$: Observable<string> = new Observable<string>(obs => obs.next(''));
  memberAvatars: Record<string, Record<string, string>> = {};
  channelMembers: { id: string; name: string; status: boolean; photoURL: string }[] = [];
  channelTitle: string = '';
  channelDescription: string | undefined = '';
  channelId: string | undefined = '';
  channelCreator: string = '';
  channelCreatorId: string = '';
  isPrivate: boolean = false;
  menuDialog: boolean = false;
  membersDialog: boolean = false;
  channelDialog: boolean = false;
  mobile = false
  dialogData: any = null;

  /**
   * Constructs a new instance of the MainchatHeaderComponent.
   *
   * @param channelsService The service providing the channel data.
   * @param authService The service providing the active user.
   * @param userService The service providing the user data.
   * @param cdr A ChangeDetectorRef used to detect changes.
   */
  constructor(
    private channelsService: ChannelsService,
    private authService: AuthService,
    public userService: UserService,
    private cdr: ChangeDetectorRef
  ) {
    this.channel$ = this.channelsService.currentChannel$;
    this.onResize();
  }


  /**
   * Handles window resize events.
   * Sets the `mobile` property to `true` if the window width is less than or equal to 900 pixels, otherwise sets it to `false`.
  */
@HostListener('window:resize', [])
  onResize(): void {
    this.mobile = window.innerWidth <= 900;
  }


  /**
   * Initializes the component by subscribing to the current channel observable and setting up the header information.
   * Also initializes the conversation partner name and observable.
   */
  ngOnInit(): void {
    this.subscriptions.add(
      this.channel$.subscribe((channel) => {
        if (channel) {
          this.initChannel(channel);
          this.initNamesAndAvatars(channel);
          this.initChannelCreator(channel);
        }
      })
    );
    this.initConvPartnerName();
    this.initConvPartnerObservable();
  }


  /**
   * Initializes the channel properties with the given channel data.
   *
   * @param channel The channel data.
   */
  initChannel(channel: Channel) {
    this.channelTitle = channel.name;
    this.channelId = channel.id;
    this.channelDescription = channel.description;
    this.channelCreatorId = channel.createdBy;
    this.isPrivate = channel.isPrivate;
    this.usersArray$ = this.userService.users$.pipe(
      map(users => users.filter(user => channel.members.includes(user.userId)))
    );
  }


  /**
   * Initializes the channel creator name.
   * Subscribes to the user service to get the username of the channel creator.
   * Sets the channel creator name and calls ChangeDetectorRef.detectChanges() to update the view.
   * @param channel The channel data.
   */
  initChannelCreator(channel: Channel) {
    this.userService.getUsernamesByIds([channel.createdBy]).then((creatorDetails) => {
      if (creatorDetails && creatorDetails.length > 0) {
        this.channelCreator = creatorDetails[0].name;
        this.cdr.detectChanges();
      }
    });
  }


  /**
   * Initializes the channel members array.
   * Subscribes to the users array observable and maps the users array into the channel members array.
   * Calls initChannelMembers to set the channel members and their properties.
   * @param channel The channel data.
   */
  initNamesAndAvatars(channel: Channel) {
    this.subscriptions.add(
      this.usersArray$?.subscribe((users: CustomUser[]) => {
        const newChannelMembers = users.map(user => ({
          id: user.userId, 
          name: user.name, 
          status: user.status, 
          photoURL: user.photoURL 
        }));
        this.initChannelMembers(channel,users, newChannelMembers);
      })
    );
  }


  /**
   * Initializes the channel members array and the member avatars.
   * Sets the channel members array with the given newChannelMembers.
   * If the channel has an id, creates the member avatars object for the channel using the given users array.
   * Calls ChangeDetectorRef.detectChanges() to update the view.
   * @param channel The channel data.
   * @param users The users array.
   * @param newChannelMembers The new channel members array.
   */
  initChannelMembers(channel:Channel, users: CustomUser[] ,newChannelMembers: { id: string; name: string; status: boolean; photoURL: string }[]) {
    this.channelMembers = [...newChannelMembers];
    if (channel?.id) {
      this.memberAvatars[channel.id] = users.reduce((acc, user) => {
        acc[user.userId] = user.photoURL;
        return acc;
      }, {} as Record<string, string>);
    }
    this.cdr.detectChanges();
  }


  /**
   * Initializes the conversation partner name observable.
   * Subscribes to the current channel observable and maps it to the users array observable.
   * Then maps the users array observable to the conversation name using the getConversationName() method.
   */
  initConvPartnerName() {
    this.conversationName$ = this.channel$.pipe(
      switchMap(channel => this.usersArray$!.pipe(
        map(users => this.getConversationName(users))
      ))
    );
  }


  /**
   * Initializes the conversation partner observable.
   * Subscribes to the current channel observable and maps it to the users array observable.
   * Then maps the users array observable to the conversation avatar using the getConverrsationAvatar() method.
   * @returns An observable of the conversation avatar.
   */
  initConvPartnerObservable() {
    this.convPartner$ = this.channel$.pipe(
      switchMap(channel => this.usersArray$!.pipe(
        switchMap(users => this.getConverrsationAvatar(users))
      ))
    );
  }


/**
 * Lifecycle hook that is called when the component is destroyed.
 * Unsubscribes from all active subscriptions to prevent memory leaks.
 */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


/**
 * Determines the name of the conversation based on the users involved.
 *
 * If the list of users is empty or null, returns 'Unbekannt'.
 * If there is only one user and the user is the active user, appends '(Du)' to the name.
 * If there are multiple users, returns a comma-separated string of all conversation partners' names,
 * excluding the active user. If no conversation partners are found, returns 'Unbekannt'.
 *
 * @param users An array of User objects representing the users in the conversation.
 * @returns A string representing the conversation name.
 */
  getConversationName(users: CustomUser[]): string {
    if (!users || users.length === 0) return 'Unbekannt';
    const activeUserId = this.authService.userId();
    const conversationPartners = users.filter(user => user.userId !== activeUserId);
    if (users.length === 1) {
      return `${users[0].name} (Du)`;
    } else if (users.length > 1) {
      return conversationPartners.map(user => user.name).join(', ');
    }
    return 'Unbekannt';
  }


  /**
   * Retrieves the avatar of the conversation partner.
   * If the conversation only involves the active user, returns the active user's avatar.
   * If the conversation involves multiple users, returns the avatar of the first conversation partner
   * that is not the active user. If no conversation partners are found, returns an empty string.
   * @param users An array of User objects representing the users in the conversation.
   * @returns An observable that emits the avatar URL of the conversation partner.
   */
  getConverrsationAvatar(users: CustomUser[]): Observable<string> {
    if (!users || users.length === 0) return new Observable<string>(obs => obs.next(''));
    const activeUserId = this.authService.userId();
    const conversationPartner = users.find(user => user.userId !== activeUserId);
    if (users.length === 1 && activeUserId) {
      return this.userService.getuserAvatar(activeUserId);
    } else if (users.length > 1 && conversationPartner) {
      return this.userService.getuserAvatar(conversationPartner.userId);
    }
    return new Observable<string>(obs => obs.next(''));
  }


  /**
   * Opens the specified dialog menu with the data of the current conversation.
   * @param menu The name of the menu to open. Can be either 'menuDialog', 'membersDialog', or 'channelDialog'.
   */
  openDialog(menu: string) {
    this.closeAllDialogs();
    this.dialogData = {
      name: this.channelTitle,
      members: this.channelMembers,
      description: this.channelDescription,
      creator: this.channelCreator,
      createdBy: this.channelCreatorId,
      channelId: this.channelId,
      isPrivate: this.isPrivate
    };
    this.switchMenuDialog(menu)
    this.cdr.detectChanges();
  }


  /**
   * Switches between the different menu dialogs by setting the respective boolean value to true.
   *
   * @param menu The name of the menu to open. Can be either 'menuDialog', 'membersDialog', or 'channelDialog'.
   */
  switchMenuDialog(menu: string) {
    if (menu === 'membersDialog') {
      this.membersDialog = true;
    } else if (menu === 'menuDialog') {
      this.menuDialog = true;
    } else if (menu === 'channelDialog') {
      this.channelDialog = true;
    }
  }


/**
 * Closes all open dialog menus by setting their respective boolean flags to false.
 * This includes the menuDialog, membersDialog, and channelDialog.
 */
  closeAllDialogs() {
    this.menuDialog = false;
    this.membersDialog = false;
    this.channelDialog = false;
  }


  /**
   * Closes all open dialog menus and opens the one specified in the event's 'to' property.
   * This is a callback function that is called when the user switches between the different dialog menus.
   * @param event A object containing properties 'from' and 'to', which specify the menu the user is
   * switching from and to, respectively.
   */
  onDialogSwitch(event: { from: string; to: string }) {
    this.closeAllDialogs();
    this.cdr.detectChanges();
    if (event.to === 'menuDialog') {
      this.menuDialog = true;
    } else if (event.to === 'membersDialog') {
      this.membersDialog = true;
    } else if (event.to === 'channelDialog') {
      this.channelDialog = true;
    }
  }


  /**
   * Closes all open dialog menus and sets the boolean flag for the menu
   * specified in the `menu` parameter to the value of `newValue`.
   * This is a callback function that is called when the user switches between
   * different dialog menus.
   * @param newValue A boolean indicating whether the specified menu should be
   * open or closed.
   * @param menu A string indicating which menu to open or close. Valid values
   * are 'menuDialog', 'membersDialog', and 'channelDialog'.
   */
  onDialogChange(newValue: boolean, menu: string) {
    this.closeAllDialogs();
    if (menu === 'membersDialog') 
      this.membersDialog = newValue;
    else if (menu === 'menuDialog')
      this.menuDialog = newValue;
    else if (menu === 'channelDialog') 
      this.channelDialog = newValue;
  }


/**
 * Closes all dialog menus by preventing the default event behavior and
 * setting their respective boolean flags to false. This includes the
 * menuDialog, membersDialog, and channelDialog.
 * @param event The event that triggered the dialog close action.
 */
  closeDialog(event: Event) {
    event?.preventDefault();
    event.stopPropagation();
    this.menuDialog = false;
    this.membersDialog = false;
    this.channelDialog = false;
  }
}