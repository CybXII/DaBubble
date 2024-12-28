import { Component,Inject  } from '@angular/core';
import { MessagesService } from '../../../shared/services/messages.service';
import { Message } from '../../../models/message';
import { AuthService } from '../../../shared/services/auth.service';
import { FormBuilder, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
@Component({
  selector: 'app-editmessage',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './editmessage.component.html',
  styleUrl: './editmessage.component.scss'
})
export class EditmessageComponent {
  messageForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private messagesService: MessagesService,
    private auth: AuthService,
    public dialogRef: MatDialogRef<EditmessageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: Partial<Message> }
  ) {
     // Formular initialisieren
    this.messageForm = this.fb.group({
      message: ['', Validators.required], // Channel-Name (Pflichtfeld)
      // description: [''], // Optional
      // reactions : [''], // Optional
    });
  }

  ngOnInit(): void {
    this.messageForm = this.fb.group({
      message: [this.data.message.message || '', Validators.required], // Initialisiere das Formular mit der übergebenen Nachricht
      reactions: [this.data.message.reactions || []], // Initialisiere das Formular mit den übergebenen Reaktionen
    });
  }


  onSubmit() {
    if (this.messageForm.valid && this.checkCreatorWithActiveUser()) {
      const newMessage = {
        ...this.data.message, // Nutze die vorhandenen Daten der Nachricht
        ...this.messageForm.value, // Überschreibe mit den neuen Werten
        docId: this.data.message.docId, // Stelle sicher, dass docId gesetzt ist
      };
  
      this.messagesService.updateMessage(newMessage.docId, newMessage.createdBy, newMessage)
        .then(() => {
          console.log('Nachricht erfolgreich aktualisiert:', newMessage);
          this.messageForm.reset();
          this.dialogRef.close();
        })
        .catch((error) => {
          console.error('Fehler beim Aktualisieren der Nachricht:', error);
        });
    } else if (!this.messageForm.valid) {
      console.log('Formular ist ungültig.');
    } else if (!this.checkCreatorWithActiveUser()) {
      console.log('Nur der Ersteller kann die Nachricht bearbeiten.');
    }
  }

  checkCreatorWithActiveUser(): boolean {
    const dataUser = this.data.message.createdBy;
    const activeUser = this.auth.userId();
    console.log('data user', dataUser);
    console.log('active user', activeUser);
  return dataUser === activeUser;  }

  deleteMessage(): void {
    console.log('Nachricht wurde gelöscht.');
  }
  
  onCancel(): void {
    console.log('Edit cancelled');
    this.messageForm.reset();
  }
}
