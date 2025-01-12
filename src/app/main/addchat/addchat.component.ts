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

  constructor(
    private fb: FormBuilder,
    private channelsService: ChannelsService,
    private auth: AuthService,
    public dialogRef: MatDialogRef<AddchatComponent>
  ) {
    // Formular initialisieren
    this.channelForm = this.fb.group({
      name: ['', Validators.required], // Channel-Name (Pflichtfeld)
      description: [''], // Optional
      isPrivate: [false], // Öffentlich/Privat
    });
  }


  ngOnInit(): void {
    this.allMembers = true;
  
    // Benutzerliste aus dem AuthService abrufen
    this.subscriptions.add(
      this.auth.getUserList().subscribe({
        next: (users: UserModel[]) => {
          this.allMembersArray = users.map(user => ({
            userId: user.userId,
            name: user.name,
            photoURL: user.photoURL,
          }));
          console.log('All member details loaded:', this.allMembersArray);
        },
        error: (error) => {
          console.error('Error fetching user list:', error);
        },
      })
    );
  }

  createChannel() {
    if (this.channelForm.valid) {
      const currentUserId = this.auth.userId(); // Hole die aktuelle User-ID
      if (!currentUserId) {
        console.error('User-ID konnte nicht abgerufen werden.');
        return;
      }
  
      // Erstelle das Channel-Objekt
      const newChannel: Channel = {
        name: this.channelForm.value.name,
        description: this.channelForm.value.description || '',
        isPrivate: this.channelForm.value.isPrivate,
        createdBy: currentUserId, // Ersteller des Channels
        members: [
          currentUserId, // Der Ersteller wird immer hinzugefügt
          ...(this.allMembers
            ? this.allMembersArray.map(member => member.userId) // Alle Mitglieder
            : this.choosenMembers.map(member => member.userId)) // Nur ausgewählte Mitglieder
        ].filter((id, index, self) => self.indexOf(id) === index), // Entfernt doppelte IDs
      };
  
      // Channel erstellen
      this.channelsService.createChannel(newChannel)
        .then(() => {
          console.log('Channel erfolgreich erstellt!', newChannel);
  
          // Formular zurücksetzen und Dialog schließen
          this.channelForm.reset();
          this.dialogRef.close();
        })
        .catch(error => {
          console.error('Fehler beim Erstellen des Channels:', error);
        });
    } else {
      console.log('Formular ist ungültig.');
    }
  }


  toggleAllMembers(addAll: boolean): void {
    this.allMembers = addAll;
    console.log('All members:', this.allMembers);
  }


  switchMembersForm() {
      this.addMembers = true; 
      this.membersArray = [];
  }


  addMembersToChannelArray(member: { userId: string; name: string; photoURL: string }): void {
    const index = this.choosenMembers.findIndex(selected => selected.userId === member.userId);
    
    if (index === -1) {
      // Benutzer hinzufügen
      this.choosenMembers.push(member);
    } else {
      // Benutzer entfernen, wenn er bereits ausgewählt ist
      this.choosenMembers.splice(index, 1);
    }
  
    // Input-Feld zurücksetzen
    const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = ''; // Input leeren
    }
  
    // Gefilterte Liste leeren
    this.filteredMembersArray = [];
  
    console.log('Choosen Members:', this.choosenMembers);
  }


  close(): void {
    this.addMembers = false
    this.channelForm.reset();
    this.dialogRef.close(); 
  }


  onSearchInput(event: Event): void {
    if ((event.target as HTMLInputElement).value === '') {
      this.filteredMembersArray = [];
    } else {
      const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
      this.filteredMembersArray = this.allMembersArray.filter(member =>
        member.name.toLowerCase().includes(searchValue)
      );
      console.log('Filtered members:', this.filteredMembersArray);
    }
  }

  isMemberSelected(member: { userId: string; name: string; photoURL: string }): boolean {
    return this.choosenMembers.some(selected => selected.userId === member.userId);
  }
}