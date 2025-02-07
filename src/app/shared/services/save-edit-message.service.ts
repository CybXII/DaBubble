import { Injectable } from '@angular/core';
import { MessagesService } from './messages.service';
import { AuthService } from './auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastMessageService } from './toastmessage.service';

@Injectable({
  providedIn: 'root'
})
export class SaveEditMessageService {
  messageForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private messagesService: MessagesService,
    private auth: AuthService,
    private toastMessageService: ToastMessageService,
  ) {
    this.messageForm = this.fb.group({
      message: ['', Validators.required],
      reactions: [''],
    });
  }

  save(message: any, thread: boolean, parentMessageId?: string, docId?: string) {

    this.messageForm.setValue({
      message: message.message || '',
      reactions: message.reactions || [],
    });

    if (this.checkCreatorWithActiveUser(message.createdBy)) {
      const updatedData = {
        ...message,
        ...this.messageForm.value,
      };
  
      if (thread) {
        if (!parentMessageId) {
          console.error('Fehlende parentMessageId für Thread-Nachricht');
          return;
        }
        // Thread-Nachricht aktualisieren
        this.messagesService.updateThreadMessage(
          parentMessageId,
          docId!, // docId sollte für Thread-Nachrichten vorhanden sein
          this.auth.userId()!,
          updatedData
        )
          .then(() => {
            console.log('Thread-Nachricht erfolgreich aktualisiert:', updatedData);
            this.showToastMessage('Nachricht aktualisiert');
          })
          .catch((error) => {
            console.error('Fehler beim Aktualisieren der Thread-Nachricht:', error);
          });
      } else {
        // Normale Nachricht aktualisieren
        this.messagesService.updateMessage(updatedData.docId, updatedData.createdBy, updatedData)
          .then(() => {
            console.log('Nachricht erfolgreich aktualisiert:', updatedData);
            this.showToastMessage('Nachricht aktualisiert');
          })
          .catch((error) => {
            console.error('Fehler beim Aktualisieren der Nachricht:', error);
          });
      }
    } else if (!this.checkCreatorWithActiveUser(message.createdBy)) {
      console.log('Nur der Ersteller kann die Nachricht bearbeiten.');
    }
  }

  checkCreatorWithActiveUser(creater: string): boolean {
    const dataUser = creater;
    const activeUser = this.auth.userId();
    console.log('data user', dataUser);
    console.log('active user', activeUser);
  return dataUser === activeUser;
  }

  showToastMessage(text:string) {
    setTimeout(() => {
      this.toastMessageService.showToastSignal(text);
    }, 500);
  }
}
