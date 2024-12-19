import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { ChannelsService } from '../../shared/services/channels.service';
@Component({
  selector: 'app-addchat',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './addchat.component.html',
  styleUrl: './addchat.component.scss'
})
export class AddchatComponent {
  channelForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private channelsService: ChannelsService
  ) {
    // Formular initialisieren
    this.channelForm = this.fb.group({
      name: ['', Validators.required], // Channel-Name (Pflichtfeld)
      description: [''], // Optional
      isPrivate: [false], // Öffentlich/Privat
    });
  }

  // Funktion, die aufgerufen wird, wenn das Formular abgeschickt wird
  onSubmit() {
    if (this.channelForm.valid) {
      const newChannel = {
        ...this.channelForm.value,
        createdBy: 'userId123', // Dies durch die aktuelle User-ID ersetzen
        members: ['userId123'], // Initialer Member
      };

      this.channelsService.createChannel(newChannel)
        .then(() => {
          console.log('Channel erfolgreich erstellt!');
          this.channelForm.reset(); // Formular zurücksetzen
        })
        .catch((error) => {
          console.error('Fehler beim Erstellen des Channels:', error);
        });
    } else {
      console.log('Formular ist ungültig.');
    }
  }
}
