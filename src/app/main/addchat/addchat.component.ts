import { Component  } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { ChannelsService } from '../../shared/services/channels.service';
import { AuthService } from '../../shared/services/auth.service';
import { Channel } from '../../models/channel';
import { UserModel } from '../../models/user';
import { Subscription } from 'rxjs';



@Component({
  selector: 'app-addchat',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './addchat.component.html',
  styleUrl: './addchat.component.scss',
})
export class AddchatComponent {
  channelForm: FormGroup;
  updateData: Partial<Channel> = {};
  addMembers: boolean = false;
  allMembers: boolean = true;
  filteredMembersArray: { userId: string; name: string; photoURL: string }[] = [];
  membersArray: { userId: string; name: string; photoURL: string }[] = [];
  allMembersArray: { userId: string; name: string; photoURL: string }[] = [];
  subscriptions: Subscription = new Subscription()
  choosenMembers: { userId: string; name: string; photoURL: string }[] = [];

  /**
   * The constructor for the AddchatComponent.
   *
   * @param fb The FormBuilder for creating the channelForm.
   * @param channelsService The ChannelsService used to interact with the
   *                        channels collection in Firestore.
   * @param auth The AuthService used to get the active user.
   * @param dialogRef The MatDialogRef object for the dialog.
   */
  constructor(
    private fb: FormBuilder,
    private channelsService: ChannelsService,
    private auth: AuthService,
    public dialogRef: MatDialogRef<AddchatComponent>
  ) {
    this.channelForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      isPrivate: [false],
    });
  }


  /**
   * Initializes the component by subscribing to the user list observable and
   * populating the allMembersArray with the user data.
   */
  ngOnInit(): void {
    this.allMembers = true;
      this.subscriptions.add(
      this.auth.getUserList().subscribe({
        next: (users: UserModel[]) => {
          this.allMembersArray = users.map(user => ({
            userId: user.userId,
            name: user.name,
            photoURL: user.photoURL,
          }));
        },
        error: (error) => {console.error('Error fetching user list:', error);},
      })
    );
  }


  /**
   * Creates a new channel if the form is valid. Retrieves the current user ID
   * and generates a channel object using the form data. Calls the method to
   * create a new channel with the generated object.
   * Logs an error if the user ID cannot be retrieved or if the form is invalid.
   */
  createChannel() {
    if (this.channelForm.valid) {
      const currentUserId = this.auth.userId();
      if (!currentUserId) {
        console.error('User-ID konnte nicht abgerufen werden.');
        return;
      }
      const newChannel = this.generateChannelObject(currentUserId);
      this.createNewChannel(newChannel);
    } else {
      console.error('Formular ist ungültig.');
    }
  }


  /**
   * Generates a Channel object based on the form data and the current user ID.
   * Populates the members array with either all users (if allMembers is true) or
   * the selected users (if allMembers is false). Removes duplicate IDs from the
   * members array.
   * @param currentUserId The ID of the currently logged-in user.
   * @returns The generated Channel object.
   */
  generateChannelObject(currentUserId: string): Channel {
    const channelObject = {
      name: this.channelForm.value.name,
      description: this.channelForm.value.description || '',
      isPrivate: this.channelForm.value.isPrivate,
      createdBy: currentUserId,
      members: [
        currentUserId,
        ...(this.allMembers
          ? this.allMembersArray.map(member => member.userId)
          : this.choosenMembers.map(member => member.userId))
      ].filter((id, index, self) => self.indexOf(id) === index)
    };
    return channelObject
  }


/**
 * Creates a new channel using the provided Channel object.
 * Calls the ChannelsService to create the channel and handles the result.
 * Resets the channel form and closes the dialog upon successful creation.
 * Logs an error message if channel creation fails.
 *
 * @param newChannel The Channel object containing the channel information to be created.
 */
  createNewChannel(newChannel: Channel) {
    this.channelsService.createChannel(newChannel).then(() => {
      this.channelForm.reset();
      this.dialogRef.close();
    })
    .catch(error => {console.error('Fehler beim Erstellen des Channels:', error);});
  }


  /**
   * Toggles the allMembers flag based on the given boolean value.
   * Sets the allMembers property to the given value and logs a message to the console.
   * @param addAll A boolean indicating whether to add all members or not.
   */
  toggleAllMembers(addAll: boolean): void {
    this.allMembers = addAll;
    console.log('All members:', this.allMembers);
  }


  /**
   * Switches the component to the members selection form.
   * Resets the members array and sets the addMembers flag to true.
   */
  switchMembersForm() {
      this.addMembers = true; 
      this.membersArray = [];
  }


  /**
   * Adds a member to the choosenMembers array or removes it if it already exists.
   * Clears the search input field and resets the filteredMembersArray.
   * @param member The member object containing the user data to be added or removed.
   */
  addMembersToChannelArray(member: { userId: string; name: string; photoURL: string }): void {
    const index = this.choosenMembers.findIndex(selected => selected.userId === member.userId);
    if (index === -1) {
      this.choosenMembers.push(member);
    } else {
      this.choosenMembers.splice(index, 1);
    }
    const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = '';
    }
    this.filteredMembersArray = [];
  }


  /**
   * Closes the add chat dialog and resets the form.
   * Sets the addMembers flag to false, resets the channelForm, and closes the dialogRef.
   */
  close(): void {
    this.addMembers = false
    this.channelForm.reset();
    this.dialogRef.close(); 
  }


/**
 * Handles the input event for the search field and updates the filtered members array.
 *
 * This method clears the filteredMembersArray if the input is empty. Otherwise, it filters
 * the allMembersArray based on the search value and updates the filteredMembersArray with
 * members whose names include the search value.
 *
 * @param {Event} event - The input event containing the search field value.
 */
  onSearchInput(event: Event): void {
    if ((event.target as HTMLInputElement).value === '') {
      this.filteredMembersArray = [];
    } else {
      const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
      this.filteredMembersArray = this.allMembersArray.filter(member =>
        member.name.toLowerCase().includes(searchValue)
      );
    }
  }

  /**
   * Checks if a member is selected in the choosenMembers array.
   * @param member The member object containing the user data to be checked.
   * @returns A boolean indicating whether the member is selected or not.
   */
  isMemberSelected(member: { userId: string; name: string; photoURL: string }): boolean {
    return this.choosenMembers.some(selected => selected.userId === member.userId);
  }
}