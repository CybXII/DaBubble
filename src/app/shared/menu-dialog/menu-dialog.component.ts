import { Component, EventEmitter, Input, Output, OnInit, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ProfileviewComponent } from '../profileview/profileview.component';
import { Channel } from '../../models/channel';
import { ChannelsService } from '../services/channels.service';
import { UserModel } from '../../models/user';



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
  allUsers: { id: string; name: string; photoURL: string }[] = []; // Liste aller Mitglieder
  filteredUsers: { id: string; name: string; photoURL: string }[] = [];
  searchInput: string = ''; // Suchinput
  toSave: { id: string; name: string; photoURL: string }[] = [];


  constructor(private fb: FormBuilder, public authService: AuthService, private dialog: MatDialog,private channelsService: ChannelsService) {}
  async ngOnInit(): Promise<void> {  
    // Lade Channel-Mitglieder
    this.memberIds = this.dialogData.members.map((member) => member.id);
    this.memberNames = await this.authService.getUsernamesByIds(this.memberIds);
    
      // Lade alle Benutzer und filtere Channel-Mitglieder aus
  this.authService.getUserList().subscribe(
    (users) => {
      this.allUsers = users.map((user) => ({
        id: user.userId,
        name: user.name,
        photoURL: user.photoURL,
      }));
      this.updateFilteredUsers(); // Aktualisiere gefilterte Benutzer
    },
    (error) => {
      console.error('Fehler beim Laden der Benutzerliste:', error);
    }
  );

  }

  /**
   * Aktualisiert die gefilterte Mitgliederliste.
   */
  updateFilteredUsers() {
    this.filteredUsers = this.allUsers.filter(
      (user) =>
        !this.memberIds.includes(user.id) && // Ausschließen der Channel-Mitglieder
        user.name.toLowerCase().includes(this.searchInput.toLowerCase()) // Filter nach Suchinput
    );
    console.log('updated',this.filteredUsers );
    console.log(this.memberIds);
  }


  addToSave(item: any) {
    this.toSave.push(item); // Beispiel: Item hinzufügen
  }

  saveAddedUser(): void {
    if (!this.dialogData || !this.dialogData.channelId) {
      console.error('Channel-ID fehlt.');
      return;
    }
  
    // IDs der hinzugefügten Benutzer sammeln
    const addedMemberIds = this.toSave.map(user => user.id);
  
    // Bestehende Mitglieder und neue Mitglieder zusammenführen
    const updatedMembers = [...this.memberIds, ...addedMemberIds];
  
    // Aktualisiere den Channel in Firebase
    this.channelsService.updateChannel(this.dialogData.channelId, { members: updatedMembers })
      .then(() => {
        console.log('Mitglieder erfolgreich hinzugefügt.');
  
        // Lokalen State aktualisieren
        this.memberIds = updatedMembers;
        this.dialogData.members = updatedMembers.map(id => ({ id })); // Wenn mehr Infos zu jedem Mitglied benötigt werden, passe dies an
        this.toSave = []; // Leere das `toSave`-Array
        this.updateFilteredUsers(); // Aktualisiere gefilterte Benutzerliste
      })
      .catch(error => {
        console.error('Fehler beim Hinzufügen der Mitglieder:', error);
      });
  }

  clearToSave() {
    this.toSave = []; // Beispiel: Array leeren
  }

  removeFromSave(user: { id: string; name: string; photoURL: string }): void {
    this.toSave = this.toSave.filter((u) => u.id !== user.id); // Entfernt den Benutzer aus dem Array
  }

  closeDialog(event: Event, menu: string) {
    event?.preventDefault();
    event?.stopPropagation();
    this.dialogSwitch.emit({ from: menu, to: 'none' });
  }

    /**
   * Wird bei Eingabe in das Suchfeld aufgerufen.
   */
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
      console.log(updatedData);
      console.log(field);
      this.channelsService.updateChannel(this.dialogData.channelId, updatedData)
        .then(() => {
            this.dialogData[field] = updatedData[field] as string;
            this.dialogData.members = this.memberIds
        })
        .catch((error) => console.error(`Fehler beim Aktualisieren des ${field}:`, error));
    }
  }

  deleteChannel(): void {
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
      console.log('Der Ersteller des Channels kann den Channel nicht einfach verlassen.');
      return; // Optional: Logik zum Löschen des Channels implementieren
    } else {
      // Mitglieder-Array aktualisieren (nur IDs extrahieren)
      const updatedMembers = this.dialogData.members
        .map((member: any) => member.id) // Extrahiere nur die ID
        .filter((id: string) => id !== userId); // Entferne die User-ID des aktuellen Benutzers
  
      console.log('Updated Members (IDs only):', updatedMembers);
      this.dialogData.members = updatedMembers.map(id => ({ id }));
      // Channel aktualisieren
      this.channelsService
        .updateChannel(this.dialogData.channelId, { members: updatedMembers })
        .then(() => {
          console.log('Du hast den Channel erfolgreich verlassen.');
          // Lokalen State aktualisieren
          this.memberIds = [];
          this.dialogData.members = updatedMembers.map(id => ({ id }));
          // Schließe den Dialog
          this.closeDialog(new Event('close'), 'channelDialog');
        })
        .catch((error) => {
          console.error('Fehler beim Verlassen des Channels:', error);
        });
    }
  }
}
