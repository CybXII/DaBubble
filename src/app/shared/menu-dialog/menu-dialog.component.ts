import { Component, EventEmitter, Input, Output, OnInit, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ProfileviewComponent } from '../profileview/profileview.component';
import { Channel } from '../../models/channel';
import { ChannelsService } from '../services/channels.service';



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
      name: string; members: any[] ; description: string ; creator: string; createdBy: string ; channelId: string
    } = {
      name: '', members: [], description: '' , creator: '', createdBy: '', channelId: ''
  };
  @Output() dialogSwitch = new EventEmitter<{ from: string; to: string }>();
  memberIds: string[] = [];
  memberNames: { name: string; userId: string; photoURL: string }[] = [];
  addMembersForm!: FormGroup;
  activeMember: any = {};
  editChannelName: boolean = false;
  editChannelDescription: boolean = false;


  constructor(private fb: FormBuilder, public authService: AuthService, private dialog: MatDialog,private channelsService: ChannelsService) {}
  async ngOnInit(): Promise<void> {
    this.memberIds = this.dialogData.members.map((member) => member.id);
    this.memberNames = await this.authService.getUsernamesByIds(this.memberIds);
    this.addMembersForm = this.fb.group({
      members: ['', Validators.required],
    });
    console.log(this.dialogData.createdBy);
  }


  closeDialog(event: Event, menu: string) {
    event?.preventDefault();
    event?.stopPropagation();
    this.dialogSwitch.emit({ from: menu, to: 'none' });
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


  addMembers(){
    console.log(this.addMembersForm);
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
    console.log(field);
    if (this.dialogData) {
      this.channelsService.updateChannel(this.dialogData.channelId, updatedData)
        .then(() => {
            this.dialogData[field] = updatedData[field] as string;
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
  
    // Prüfen, ob der Benutzer der Ersteller des Channels ist
    if (this.dialogData.creator === userId) {
      // Channel löschen, wenn der Benutzer der Ersteller ist
      this.channelsService
        .deleteChannel(this.dialogData.channelId)
        .then(() => {
          console.log('Channel wurde gelöscht, da der Ersteller den Channel verlassen hat.');
  
          // Setze den aktuellen Channel auf null
          this.channelsService.clearCurrentChannel();
  
          // Schließe den Dialog
          this.closeDialog(new Event('close'), 'channelDialog');
        })
        .catch((error) => {
          console.error('Fehler beim Löschen des Channels:', error);
        });
    } else {
      // Mitglieder-Array aktualisieren
      const updatedMembers = this.dialogData.members.filter((member: any) => member.id !== userId);
  
      // Channel aktualisieren
      this.channelsService
        .updateChannel(this.dialogData.channelId, { members: updatedMembers })
        .then(() => {
          console.log('Du hast den Channel erfolgreich verlassen.');
  
          // Setze den aktuellen Channel auf null
          this.channelsService.clearCurrentChannel();
  
          // Schließe den Dialog
          this.closeDialog(new Event('close'), 'channelDialog');
        })
        .catch((error) => {
          console.error('Fehler beim Verlassen des Channels:', error);
        });
    }
  }
}
