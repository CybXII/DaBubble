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
  messageDelete: boolean;


  constructor(
    private fb: FormBuilder,
    private messagesService: MessagesService,
    private auth: AuthService,
    public dialogRef: MatDialogRef<EditmessageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: Partial<Message> ,deleteMessage: boolean }
  ) {
    this.messageForm = this.fb.group({
      message: ['', Validators.required],
      description: [''],
      reactions : [''],
    });
    this.messageDelete = this.data.deleteMessage;
    console.log('EditmessageComponent wurde initialisiert:', this.data.deleteMessage);
  }


  ngOnInit(): void {
    this.messageForm = this.fb.group({
      message: [this.data.message.message || '', Validators.required],
      reactions: [this.data.message.reactions || []],
    });
    console.log('EditmessageComponent wurde initialisiert:', this.messageDelete);
  }


  onSubmit() {
    if (this.messageForm.valid && this.checkCreatorWithActiveUser()) {
      const newMessage = {
        ...this.data.message,
        ...this.messageForm.value,
        docId: this.data.message.docId,
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
    if (this.messageForm.valid && this.checkCreatorWithActiveUser()) {
      const newMessage = {
        ...this.data.message,
        ...this.messageForm.value,
        docId: this.data.message.docId,
      };
      this.messagesService.deleteMessage(newMessage.docId, newMessage.createdBy)
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


  onCancel(): void { 
    console.log('Edit cancelled');
    this.messageForm.reset();
    this.dialogRef.close(); 
  }
}
