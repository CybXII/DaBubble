import { Component,Input  } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { ChannelsService } from '../../shared/services/channels.service';
import { AuthService } from '../../shared/services/auth.service';
import { FullscreenModalComponent } from '../../shared/fullscreen-modal/fullscreen-modal.component';
@Component({
  selector: 'app-addchat',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './addchat.component.html',
  styleUrl: './addchat.component.scss',
})
export class AddchatComponent {
  channelForm: FormGroup;
  @Input() dialogRef!: MatDialogRef<FullscreenModalComponent>;

  close(): void {
    this.dialogRef.close(); // Schließt den Dialog
  }
  constructor(
    private fb: FormBuilder,
    private channelsService: ChannelsService,
    private auth: AuthService,
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
        createdBy: this.auth.userId(), // Signal aufrufen, um den aktuellen Wert zu erhalten
        members: [this.auth.userId()], // Signal aufrufen
      };

      this.channelsService.createChannel(newChannel)
        .then(() => {
          console.log('Channel erfolgreich erstellt!' , newChannel);

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
