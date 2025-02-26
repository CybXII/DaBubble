import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ProfileviewComponent } from '../profileview/profileview.component';
import { Channel } from '../../models/channel';
import { ChannelsService } from '../services/channels.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-menu-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './menu-dialog.component.html',
  styleUrl: './menu-dialog.component.scss',
})
export class MenuDialogComponent implements OnInit {
  @ViewChild('channelInput') channelInput!: ElementRef<HTMLInputElement>;
  @ViewChild('channelDescInput')
  channelDescInput!: ElementRef<HTMLInputElement>;
  @Input() menuDialog: boolean = false;
  @Input() membersDialog: boolean = false;
  @Input() channelDialog: boolean = false;
  @Input() dialogData: {
    name: string;
    members: any[];
    description: string;
    creator: string;
    createdBy: string;
    channelId: string;
    isPrivate: boolean;
  } = {
    name: '',
    members: [],
    description: '',
    creator: '',
    createdBy: '',
    channelId: '',
    isPrivate: false,
  };
  @Output() dialogSwitch = new EventEmitter<{ from: string; to: string }>();

  memberIds: string[] = [];
  memberNames: { name: string; userId: string; photoURL: string }[] = [];
  allUsers: { id: string; name: string; photoURL: string }[] = [];
  filteredUsers: { id: string; name: string; photoURL: string }[] = [];
  toSave: { id: string; name: string; photoURL: string }[] = [];
  activeMember: any = {};
  searchInput: string = '';
  editChannelName: boolean = false;
  editChannelDescription: boolean = false;
  isMobileDialogAddMemberOpen: boolean = false;
  addMembersForm!: FormGroup;

  /**
   * Constructs a new instance of the MenuDialogComponent.
   *
   * @param authService The service providing the currently logged in user.
   * @param dialog The MatDialog service for opening dialogs.
   * @param channelsService The service providing the channels data.
   * @param userService The service providing the user data.
   */
  constructor(
    public authService: AuthService,
    private dialog: MatDialog,
    private channelsService: ChannelsService,
    private userService: UserService
  ) {}

  /**
   * Initializes the component by mapping member IDs from dialog data and retrieving
   * member names using the UserService. Subscribes to the user list from the AuthService
   * and populates the allUsers array with user data. Calls updateFilteredUsers() to filter
   * the list of users. Logs an error message if there is an error loading the user list.
   */
  async ngOnInit(): Promise<void> {
    this.memberIds = this.dialogData.members.map((member) => member.id);
    this.memberNames = await this.userService.getUsernamesByIds(this.memberIds);
    this.authService.getUserList().subscribe(
      (users) => {
        this.allUsers = users.map((user) => ({
          id: user.userId,
          name: user.name,
          photoURL: user.photoURL,
        }));
        this.updateFilteredUsers();
      },
      (error) => {
        console.error('Fehler beim Laden der Benutzerliste:', error);
      }
    );
  }

  /**
   * Updates the filteredUsers array by filtering the allUsers array based on
   * whether the user ID is not in the memberIds array and whether the user name
   * includes the searchInput in a case-insensitive manner.
   */
  updateFilteredUsers() {
    this.filteredUsers = this.allUsers.filter(
      (user) =>
        !this.memberIds.includes(user.id) &&
        user.name.toLowerCase().includes(this.searchInput.toLowerCase())
    );
  }

  /**
   * Adds a user to the toSave array.
   * @param item - User object containing the user data to be added.
   */
  addToSave(item: any) {
    if ( !this.toSave.includes(item) ) {
      this.toSave.push(item);
    }
  }

  /**
   * Saves the added users to the current channel. If the channel ID is missing from
   * the dialog data, logs an error and exits the function. Otherwise, it proceeds to
   * add the members to the channel by calling the saveChanneAfterAddingMembers method.
   */
  saveAddedUser(): void {
    if (!this.dialogData || !this.dialogData.channelId) {
      console.error('Channel-ID fehlt.');
      return;
    }
    this.saveChanneAfterAddingMembers();
  }

  /**
   * Updates the current channel with the users added to the toSave array.
   * Extracts the IDs of the users to be added and combines them with the existing
   * member IDs. Calls the channelsService to update the channel members in the
   * backend. On successful update, refreshes the member IDs and dialog data
   * and clears the toSave array. Logs an error message if the update fails.
   */
  saveChanneAfterAddingMembers() {
    const addedMemberIds = this.toSave.map((user) => user.id);
    const updatedMembers = [...this.memberIds, ...addedMemberIds];
    this.channelsService
      .updateChannel(this.dialogData.channelId, { members: updatedMembers })
      .then(() => {
        this.memberIds = updatedMembers;
        this.dialogData.members = updatedMembers.map((id) => ({ id }));
        this.toSave = [];
        this.updateFilteredUsers();
      })
      .catch((error) => {
        console.error('Fehler beim Hinzufügen der Mitglieder:', error);
      });
  }

  /**
   * Clears the toSave array, which contains the users to be added to the
   * current channel. This is called when the user clicks the "Abbrechen"
   * button to cancel the addition of users to the channel.
   */
  clearToSave() {
    this.toSave = [];
  }

  /**
   * Removes a user from the toSave array.
   * @param user - The user object containing the user data to be removed.
   */
  removeFromSave(user: { id: string; name: string; photoURL: string }): void {
    this.toSave = this.toSave.filter((u) => u.id !== user.id);
  }

  /**
   * Closes the specified dialog menu by preventing the default event behavior,
   * stopping the event propagation, and emitting an event to the parent component
   * with the dialog switch data object.
   * @param event The event that triggered the dialog close action.
   * @param menu The name of the menu to be closed.
   */
  closeDialog(event: Event, menu: string) {
    event?.preventDefault();
    event?.stopPropagation();
    this.dialogSwitch.emit({ from: menu, to: 'none' });
  }

  /**
   * Handles the input event for the search field and updates the filtered members array.
   * This method clears the filteredMembersArray if the input is empty. Otherwise, it filters
   * the allMembersArray based on the search value and updates the filteredMembersArray with
   * members whose names include the search value.
   * @param {Event} event - The input event containing the search field value.
   */
  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchInput = target.value;
    this.updateFilteredUsers();
  }

  /**
   * Switches between different dialog menus and emits an event with the
   * dialog switch data object to the parent component. The dialog switch
   * data object contains the "from" property set to the name of the menu
   * that was currently open, and the "to" property set to the name of the
   * menu to be opened.
   *
   * @param to The name of the menu to be opened.
   */
  switchDialog(to: string) {
    if (this.menuDialog) {
      this.dialogSwitch.emit({ from: 'menuDialog', to });
    } else if (this.membersDialog) {
      this.dialogSwitch.emit({ from: 'membersDialog', to });
    } else if (this.channelDialog) {
      this.dialogSwitch.emit({ from: 'channelDialog', to });
    }
  }

  /**
   * Prevents the default event behavior and stops the event propagation.
   * This method is used to prevent the dialog from closing when the user clicks
   * on an element that is not supposed to close the dialog, such as a button that
   * opens a sub-menu.
   * @param event The event that triggered the action.
   */
  dontCloseDialog(event: Event) {
    event?.preventDefault();
    event.stopPropagation();
  }

  /**
   * Selects a member and updates the activeMember property with the selected member.
   * This method is used to update the active member when a user is selected in the
   * members dialog or the channel dialog.
   * @param member The selected member object containing the user data.
   */
  selectMember(member: any) {
    this.activeMember = member;
  }

  /**
   * Retrieves the current user's data from the authentication service.
   * @returns The user data as managed by the AuthService.
   */
  get userData() {
    return this.authService.userData();
  }

  /**
   * Opens the user profile dialog with the active member.
   * This dialog displays the user profile information and allows the user to edit their profile.
   */
  openDialog(): void {
    this.dialog.open(ProfileviewComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
      data: { member: this.activeMember },
    });
  }

  /**
   * Toggles the editChannelName property and focuses the channel name input field
   * if it is set to true.
   */
  activateEditChannelName() {
    this.editChannelName = !this.editChannelName;
    if (this.editChannelName) {
      setTimeout(() => {
        this.channelInput?.nativeElement.focus();
      }, 50);
    }
  }

  /**
   * Toggles the editChannelDescription property and focuses the channel description
   * input field if it is set to true.
   */
  activateEditChannelDescription() {
    this.editChannelDescription = !this.editChannelDescription;
    if (this.editChannelDescription) {
      setTimeout(() => {
        this.channelDescInput?.nativeElement.focus();
      }, 50);
    }
  }

  /**
   * Updates the channel with the given field and saves the changes.
   * @param field The field to update. Can be either 'name', 'description', or 'createdBy'.
   */
  saveChanges(field: 'name' | 'description' | 'createdBy'): void {
    const updatedData: Partial<Channel> = {};
    if (field === 'name') {
      updatedData.name = this.channelInput.nativeElement.value.trim();
      this.editChannelName = false;
    } else if (field === 'description') {
      updatedData.description =
        this.channelDescInput.nativeElement.value.trim();
      this.editChannelDescription = false;
    }
    if (this.dialogData) {
      this.channelsService
        .updateChannel(this.dialogData.channelId, updatedData)
        .then(() => {
          this.dialogData[field] = updatedData[field] as string;
          this.dialogData.members = this.memberIds;
        })
        .catch((error) =>
          console.error(`Fehler beim Aktualisieren des ${field}:`, error)
        );
    }
  }

  /**
   * Updates the specified field of the current channel with the provided data.
   * Logs an error message if the update operation fails.
   * @param field - The field to update ('name', 'description', or 'createdBy').
   * @param updatedData - The data to update for the specified field.
   */
  updateChannel(
    field: 'name' | 'description' | 'createdBy',
    updatedData: Partial<Channel>
  ): void {
    this.channelsService
      .updateChannel(this.dialogData.channelId, updatedData)
      .then(() => {
        this.dialogData[field] = updatedData[field] as string;
        this.dialogData.members = this.memberIds;
      })
      .catch((error) =>
        console.error(`Fehler beim Aktualisieren des ${field}:`, error)
      );
  }

  /**
   * Handles the user leaving the currently open channel. If the user is the
   * creator of the channel or if the channel is private, the channel is deleted.
   * Otherwise, the user is removed from the channel's members array.
   */
  leaveChannel(): void {
    if (!this.dialogData || !this.dialogData.channelId)
      return console.error('Channel-ID fehlt.');
    const userId = this.authService.userId();
    if (!userId) return console.error('User-ID konnte nicht abgerufen werden.');
    if (this.dialogData.createdBy === userId || this.dialogData.isPrivate)
      this.deleteChannel();
    else if (
      !(this.dialogData.createdBy == userId) ||
      !this.dialogData.isPrivate
    ){
      this.updateChannelAfterLeaving(userId);
      this.channelsService.setDefaultChannel();
    }
    else
      console.error(
        'Fehler beim Verlassen des Channels.' + this.dialogData,
        'user' + userId,
        'isPrivate' + this.dialogData.isPrivate
      );
  }

  /**
   * Deletes the current channel and clears the current channel ID from the ChannelsService.
   * Logs an error message if the deletion operation fails.
   */
  deleteChannel() {
    this.channelsService
      .deleteChannel(this.dialogData.channelId)
      .then(() => {
        this.channelsService.clearCurrentChannel();
        this.closeDialog(new Event('close'), 'channelDialog');
      })
      .catch((error) => {
        console.error('Fehler beim Löschen:', error);
      });
  }

  /**
   * Updates the channel after the user has left it.
   * @param userId The user ID of the user who has left the channel.
   */
  updateChannelAfterLeaving(userId: string) {
    const updatedMembers = this.dialogData.members
      .map((member: any) => member.id)
      .filter((id: string) => id !== userId);
    this.dialogData.members = updatedMembers.map((id) => ({ id }));
    this.channelsService
      .updateChannel(this.dialogData.channelId, { members: updatedMembers })
      .then(() => {
        this.memberIds = [];
        this.dialogData.members = updatedMembers.map((id) => ({ id }));
        this.closeDialog(new Event('close'), 'channelDialog');
      })
      .catch((error) => {
        console.error('Fehler beim Verlassen des Channels:', error);
      });
    this.channelsService.clearCurrentChannel();
  }

  /**
   * Opens the mobile dialog for adding members to a channel.
   */
  openMobileDialogAddMember() {
    this.isMobileDialogAddMemberOpen = true;
  }

  /**
   * Closes the mobile dialog for adding members to a channel.
   */
  closeMobileDialogAddMember() {
    this.isMobileDialogAddMemberOpen = false;
  }
}
