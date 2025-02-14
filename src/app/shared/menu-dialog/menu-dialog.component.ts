import { Component, EventEmitter, Input, Output, OnInit, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ProfileviewComponent } from '../profileview/profileview.component';
import { Channel } from '../../models/channel';
import { ChannelsService } from '../services/channels.service';
import { UserModel } from '../../models/user';
import { UserService } from '../services/user.service';



@Component({
  selector: 'app-menu-dialog',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './menu-dialog.component.html',
  styleUrl: './menu-dialog.component.scss'
})


export class MenuDialogComponent  implements OnInit {
  @ViewChild('channelInput') channelInput!: ElementRef<HTMLInputElement>;
  @ViewChild('channelDescInput') channelDescInput!: ElementRef<HTMLInputElement>;
  @Input() menuDialog: boolean = false;
  @Input() membersDialog: boolean = false;
  @Input() channelDialog: boolean = false;
  @Input() dialogData: { 
      name: string; members: any[] ; description: string ; creator: string; createdBy: string ; channelId: string ; isPrivate: boolean
    } = {
      name: '', members: [], description: '' , creator: '', createdBy: '', channelId: '', isPrivate: false
    };
  @Output() dialogSwitch = new EventEmitter<{ from: string; to: string }>();
  memberIds: string[] = [];
  memberNames: { name: string; userId: string; photoURL: string }[] = [];
  addMembersForm!: FormGroup;
  activeMember: any = {};
  editChannelName: boolean = false;
  editChannelDescription: boolean = false;
  allUsers: { id: string; name: string; photoURL: string }[] = [];
  filteredUsers: { id: string; name: string; photoURL: string }[] = [];
  searchInput: string = '';
  toSave: { id: string; name: string; photoURL: string }[] = [];
  isMobileDialogAddMemberOpen: boolean = false;


  constructor(private fb: FormBuilder, public authService: AuthService, private dialog: MatDialog,private channelsService: ChannelsService, private userService: UserService) {}
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


  updateFilteredUsers() {
    this.filteredUsers = this.allUsers.filter(
      (user) =>
        !this.memberIds.includes(user.id) &&
        user.name.toLowerCase().includes(this.searchInput.toLowerCase())
    );
    console.log('updated',this.filteredUsers );
    console.log(this.memberIds);
  }


  addToSave(item: any) {
    this.toSave.push(item);
  }


  saveAddedUser(): void {
    if (!this.dialogData || !this.dialogData.channelId) {
      console.error('Channel-ID fehlt.');
      return;
    }
    const addedMemberIds = this.toSave.map(user => user.id);
    const updatedMembers = [...this.memberIds, ...addedMemberIds];
    this.channelsService.updateChannel(this.dialogData.channelId, { members: updatedMembers })
      .then(() => {
        this.memberIds = updatedMembers;
        this.dialogData.members = updatedMembers.map(id => ({ id }));
        this.toSave = []; 
        this.updateFilteredUsers();
      })
      .catch(error => {
        console.error('Fehler beim Hinzufügen der Mitglieder:', error);
      });
  }


  clearToSave() {
    this.toSave = [];
  }


  removeFromSave(user: { id: string; name: string; photoURL: string }): void {
    this.toSave = this.toSave.filter((u) => u.id !== user.id);
  }


  closeDialog(event: Event, menu: string) {
    event?.preventDefault();
    event?.stopPropagation();
    this.dialogSwitch.emit({ from: menu, to: 'none' });
  }


  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchInput = target.value;
    console.log(this.searchInput);
    this.updateFilteredUsers();
  }


  switchDialog(to: string) {
    console.log(to);
    if (this.menuDialog) {
      this.dialogSwitch.emit({ from: 'menuDialog', to });
    } else if (this.membersDialog) {
      this.dialogSwitch.emit({ from: 'membersDialog', to });
    } else if (this.channelDialog) {
      this.dialogSwitch.emit({ from: 'channelDialog', to });
    }
  }


  getUserData(id: string) {
    return this.authService.getUserById(id);
  }


  dontCloseDialog(event: Event) {
    event?.preventDefault();
    event.stopPropagation();
  }


  selectMember(member: any) {
    this.activeMember = member
  }


  get userData() {
    return this.authService.userData();
  }


  openDialog(): void {
    this.dialog.open(ProfileviewComponent, {
      width: 'fit-content',
      maxWidth: '100vw',
      height: 'fit-content',
      data: {member: this.activeMember}
    });
  }


  activateEditChannelName() {
    this.editChannelName = !this.editChannelName;
    if (this.editChannelName) {
      setTimeout(() => {
        this.channelInput?.nativeElement.focus();
      }, 50);
    }
  }


  activateEditChannelDescription() {
    this.editChannelDescription = !this.editChannelDescription;
    if (this.editChannelDescription) {
      setTimeout(() => {
        this.channelDescInput?.nativeElement.focus();
      }, 50);
    }
  }


  saveChanges(field: 'name' | 'description' | 'createdBy'): void {
    const updatedData: Partial<Channel> = {};
    if (field === 'name') {
      updatedData.name = this.channelInput.nativeElement.value.trim();
      this.editChannelName = false;
    } else if (field === 'description') {
      updatedData.description = this.channelDescInput.nativeElement.value.trim();
      this.editChannelDescription = false;
    }
    if (this.dialogData) {  
      this.channelsService.updateChannel(this.dialogData.channelId, updatedData)
        .then(() => {
            this.dialogData[field] = updatedData[field] as string;
            this.dialogData.members = this.memberIds
        })
        .catch((error) => console.error(`Fehler beim Aktualisieren des ${field}:`, error));
    }
  }


  leaveChannel(): void {
    if (!this.dialogData || !this.dialogData.channelId) {
      console.error('Channel-ID fehlt.');
      return;
    }
    const userId = this.authService.userId();
    if (!userId) {
      console.error('User-ID konnte nicht abgerufen werden.');
      return;
    }
    if (this.dialogData.createdBy === userId || this.dialogData.isPrivate) {
      this.channelsService.deleteChannel(this.dialogData.channelId)
        .then(() => {
          this.channelsService.clearCurrentChannel();
          this.closeDialog(new Event('close'), 'channelDialog');
        })
        .catch((error) => {
          console.error('Fehler beim Löschen:', error);
        });
    } else if (!(this.dialogData.createdBy == userId) || !this.dialogData.isPrivate) {
      const updatedMembers = this.dialogData.members
        .map((member: any) => member.id)
        .filter((id: string) => id !== userId);
      this.dialogData.members = updatedMembers.map(id => ({ id }));
      this.channelsService
        .updateChannel(this.dialogData.channelId, { members: updatedMembers })
        .then(() => {
          this.memberIds = [];
          this.dialogData.members = updatedMembers.map(id => ({ id }));
          this.closeDialog(new Event('close'), 'channelDialog');
        })
        .catch((error) => {
          console.error('Fehler beim Verlassen des Channels:', error);
        });
      this.channelsService.clearCurrentChannel();
    }
    else {
      console.error('Fehler beim Verlassen des Channels.' + this.dialogData , 'user'+ userId, 'isPrivate' + this.dialogData.isPrivate);
    }
  }


  openMobileDialogAddMember(){
    this.isMobileDialogAddMemberOpen = true;
  }


  closeMobileDialogAddMember(){
    this.isMobileDialogAddMemberOpen = false;
  }
}
